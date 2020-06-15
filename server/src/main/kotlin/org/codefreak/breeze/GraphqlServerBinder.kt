package org.codefreak.breeze

import com.github.dockerjava.api.DockerClient
import com.github.dockerjava.core.DefaultDockerClientConfig
import com.github.dockerjava.core.DockerClientBuilder
import com.github.dockerjava.core.DockerClientConfig
import com.github.dockerjava.netty.NettyDockerCmdExecFactory
import com.google.inject.AbstractModule
import com.google.inject.Provides
import com.google.inject.Singleton
import graphql.GraphQL
import io.vertx.core.Vertx
import org.codefreak.breeze.graphql.FilesDataFetcher
import org.codefreak.breeze.graphql.FilesService
import org.codefreak.breeze.graphql.GraphQLFactory
import org.codefreak.breeze.vertx.FilesystemWatcher
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
    fun graphQLFactory(
            vertx: Vertx,
            filesService: FilesService,
            workspace: Workspace,
            filesDataFetcher: FilesDataFetcher,
            config: BreezeConfiguration): GraphQL {
        return GraphQLFactory(vertx.eventBus(), filesService, workspace, filesDataFetcher, config).graphQL()
    }

    override fun configure() {
        bind(Workspace::class.java).to(DockerWorkspace::class.java)
    }
}