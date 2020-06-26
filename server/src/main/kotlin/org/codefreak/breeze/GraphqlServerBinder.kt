package org.codefreak.breeze

import com.github.dockerjava.api.DockerClient
import com.github.dockerjava.core.DefaultDockerClientConfig
import com.github.dockerjava.core.DockerClientBuilder
import com.github.dockerjava.core.DockerClientConfig
import com.github.dockerjava.netty.NettyDockerCmdExecFactory
import com.google.inject.AbstractModule
import com.google.inject.Provides
import com.google.inject.Singleton
import com.google.inject.TypeLiteral
import com.google.inject.multibindings.Multibinder
import graphql.GraphQL
import graphql.kickstart.tools.GraphQLResolver
import org.codefreak.breeze.graphql.ConfigResolver
import org.codefreak.breeze.graphql.FileResolver
import org.codefreak.breeze.graphql.GraphQLFactory
import org.codefreak.breeze.graphql.ReplResolver
import org.codefreak.breeze.workspace.DockerWorkspace
import org.codefreak.breeze.workspace.Workspace

class GraphqlServerBinder : AbstractModule() {
    @Provides
    @Singleton
    fun docker(): DockerClient {
        val config: DockerClientConfig = DefaultDockerClientConfig.createDefaultConfigBuilder()
                .build()
        return DockerClientBuilder.getInstance(config).withDockerCmdExecFactory(
                // OkHttp implementation causes 100% CPU usage currently
                NettyDockerCmdExecFactory()
        ).build()
    }

    @Provides
    @Singleton
    @JvmSuppressWildcards
    fun graphQL(queryResolvers: Set<GraphQLResolver<*>>): GraphQL {
        return GraphQLFactory(queryResolvers.toList()).graphQL()
    }

    override fun configure() {
        bind(Workspace::class.java).to(DockerWorkspace::class.java)

        Multibinder.newSetBinder(binder(), object : TypeLiteral<GraphQLResolver<*>>() {}).apply {
            addBinding().to(ReplResolver::class.java)
            addBinding().to(FileResolver::class.java)
            addBinding().to(ConfigResolver::class.java)
        }
    }
}