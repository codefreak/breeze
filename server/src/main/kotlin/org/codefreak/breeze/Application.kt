package org.codefreak.breeze

import io.vertx.core.AbstractVerticle
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.graphql.ApolloWSHandler
import io.vertx.ext.web.handler.graphql.ApolloWSOptions
import org.codefreak.breeze.docker.DockerFactory
import org.codefreak.breeze.graphql.FilesDataFetcher
import org.codefreak.breeze.graphql.FilesService
import org.codefreak.breeze.graphql.GraphQLFactory
import org.codefreak.breeze.shell.docker.DockerProcessFactory
import org.codefreak.breeze.vertx.FilesystemEvent
import org.codefreak.breeze.vertx.FilesystemEventCodec
import org.codefreak.breeze.vertx.FilesystemWatcher
import org.slf4j.LoggerFactory
import java.nio.file.Paths

class Application : AbstractVerticle() {
    companion object {
        private val log = LoggerFactory.getLogger(Application::class.java)
    }

    override fun start() {
        vertx.eventBus().registerDefaultCodec(FilesystemEvent::class.java, FilesystemEventCodec())
        val config = BreezeConfiguration()
        val docker = DockerFactory().docker()
        val processFactory = DockerProcessFactory(config, docker)
        val filesService = FilesService(config)
        val filesDataFetcher = FilesDataFetcher(filesService)
        val watcher2 = FilesystemWatcher(vertx, Paths.get(config.workingDirectory))
        val gqlFactory = GraphQLFactory(vertx.eventBus(), filesService, processFactory, filesDataFetcher, config)

        val router: Router = Router.router(vertx)

        val graphQL = gqlFactory.graphQL()
        router.route("/graphql").handler(ApolloWSHandler.create(graphQL, ApolloWSOptions().apply {
            keepAlive = 15000L
        }))

        watcher2.watch()
        vertx.createHttpServer()
                .requestHandler(router::handle)
                .listen(8080)
    }
}