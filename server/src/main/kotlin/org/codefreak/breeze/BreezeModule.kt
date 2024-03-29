package org.codefreak.breeze

import com.beust.jcommander.JCommander
import com.github.dockerjava.api.DockerClient
import com.github.dockerjava.core.DefaultDockerClientConfig
import com.github.dockerjava.core.DockerClientBuilder
import com.github.dockerjava.core.DockerClientConfig
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient
import com.google.inject.AbstractModule
import com.google.inject.Provides
import com.google.inject.Singleton
import com.google.inject.TypeLiteral
import com.google.inject.multibindings.Multibinder
import graphql.GraphQL
import graphql.kickstart.tools.GraphQLResolver
import io.vertx.core.impl.launcher.VertxCommandLauncher
import org.codefreak.breeze.docker.DockerWorkspace
import org.codefreak.breeze.graphql.ConfigResolver
import org.codefreak.breeze.graphql.FileResolver
import org.codefreak.breeze.graphql.GraphQLFactory
import org.codefreak.breeze.graphql.ProcessResolver
import org.codefreak.breeze.graphql.WorkspaceResolver
import org.codefreak.breeze.workspace.Workspace
import java.net.URI

class BreezeModule : AbstractModule() {
    @Provides
    @Singleton
    fun docker(): DockerClient {
        val config: DockerClientConfig = DefaultDockerClientConfig.createDefaultConfigBuilder()
                .build()
        return DockerClientBuilder.getInstance(config).withDockerHttpClient(
                ApacheDockerHttpClient.Builder()
                        .dockerHost(URI.create("unix:///var/run/docker.sock"))
                        .build()
        ).build()
    }

    @Provides
    @Singleton
    @JvmSuppressWildcards
    fun graphQL(queryResolvers: Set<GraphQLResolver<*>>): GraphQL {
        return GraphQLFactory(queryResolvers.toList()).graphQL()
    }

    @Provides
    @Singleton
    fun fileService(workspace: Workspace): FilesService {
        return FilesService(workspace.localPath)
    }

    @Provides
    @Singleton
    fun configuration(): BreezeConfiguration {
        val config = BreezeConfiguration()
        JCommander.newBuilder()
                .addObject(config)
                .build()
                .parse(*VertxCommandLauncher.getProcessArguments().toTypedArray())
        return config
    }

    override fun configure() {
        bind(Workspace::class.java).to(DockerWorkspace::class.java)

        Multibinder.newSetBinder(binder(), object : TypeLiteral<GraphQLResolver<*>>() {}).apply {
            addBinding().to(ProcessResolver::class.java)
            addBinding().to(FileResolver::class.java)
            addBinding().to(ConfigResolver::class.java)
            addBinding().to(WorkspaceResolver::class.java)
        }
    }
}