package org.codefreak.breeze

import io.vertx.core.AbstractVerticle
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.graphql.ApolloWSHandler
import io.vertx.ext.web.handler.graphql.ApolloWSOptions
import org.codefreak.breeze.docker.DockerFactory
import org.codefreak.breeze.graphql.FilesDataFetcher
import org.codefreak.breeze.graphql.FilesService
import org.codefreak.breeze.graphql.GraphQLFactory
import org.codefreak.breeze.vertx.FilesystemEvent
import org.codefreak.breeze.vertx.FilesystemEventCodec
import org.codefreak.breeze.vertx.FilesystemWatcher
import org.codefreak.breeze.workspace.DockerWorkspace
import org.codefreak.breeze.workspace.Workspace
import org.slf4j.LoggerFactory

class Application : AbstractVerticle() {
    companion object {
        private val log = LoggerFactory.getLogger(Application::class.java)
    }

    private val config = BreezeConfiguration()
    private val docker = DockerFactory().docker()
    private val workspace: Workspace by lazy {
        DockerWorkspace(vertx, config, docker)
    }
    private val filesService by lazy {
        FilesService(workspace.path)
    }

    override fun start() {
        vertx.eventBus().registerDefaultCodec(FilesystemEvent::class.java, FilesystemEventCodec())

        log.info("Initializing workspace")
        workspace.init(config.replCmd, config.defaultEnv)
        log.info("Starting workspace")

        log.info("Initializing default file ${config.mainFile}")
        filesService.writeFile(workspace.path.resolve(config.mainFile), config.mainFileContent)

        val filesDataFetcher = FilesDataFetcher(filesService)
        val watcher = FilesystemWatcher(vertx, workspace.path)
        val gqlFactory = GraphQLFactory(vertx.eventBus(), filesService, workspace, filesDataFetcher, config)

        val router: Router = Router.router(vertx)

        val graphQL = gqlFactory.graphQL()
        router.route("/graphql").handler(ApolloWSHandler.create(graphQL, ApolloWSOptions().apply {
            keepAlive = 15000L
        }))

        watcher.watch()
        vertx.createHttpServer()
                .requestHandler(router::handle)
                .listen(8080)
    }
}