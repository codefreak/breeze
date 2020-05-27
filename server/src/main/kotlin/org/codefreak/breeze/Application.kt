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
import org.slf4j.LoggerFactory

class Application : AbstractVerticle() {
    companion object {
        private val log = LoggerFactory.getLogger(Application::class.java)
    }

    override fun start() {
        log.info("launching...");
        log.warn("launching...");
        log.error("launching...");
        log.debug("launching...");
        log.trace("launching...");
        val config = BreezeConfiguration()
        val docker = DockerFactory().docker()
        val processFactory = DockerProcessFactory(config, docker)
        val watcher = FileSystemWatcher()
        val filesService = FilesService(config)
        val filesDataFetcher = FilesDataFetcher(filesService)
        val gqlFactory = GraphQLFactory(filesService, watcher, processFactory, filesDataFetcher, config)

        val router: Router = Router.router(vertx)

        val graphQL = gqlFactory.graphQL()
        router.route("/graphql").handler(ApolloWSHandler.create(graphQL, ApolloWSOptions().apply {
            keepAlive = 15000L
        }));

        vertx.createHttpServer()
                .requestHandler(router::handle)
                .listen(8080)
    }
}