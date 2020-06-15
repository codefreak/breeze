package org.codefreak.breeze

import com.google.inject.Inject
import com.google.inject.Singleton
import graphql.GraphQL
import io.vertx.core.AbstractVerticle
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.graphql.ApolloWSHandler
import io.vertx.ext.web.handler.graphql.ApolloWSOptions
import org.codefreak.breeze.graphql.FilesService
import org.codefreak.breeze.vertx.FilesystemEvent
import org.codefreak.breeze.vertx.FilesystemEventCodec
import org.codefreak.breeze.vertx.FilesystemWatcher
import org.codefreak.breeze.workspace.Workspace
import org.slf4j.LoggerFactory

@Singleton
class GraphqlServerVerticle
@Inject constructor(
        private val workspace: Workspace,
        private val config: BreezeConfiguration,
        private val filesService: FilesService,
        private val watcher: FilesystemWatcher,
        private val graphQL: GraphQL
) : AbstractVerticle() {
    companion object {
        private val log = LoggerFactory.getLogger(GraphqlServerVerticle::class.java)
    }

    override fun start() {
        vertx.eventBus().registerDefaultCodec(FilesystemEvent::class.java, FilesystemEventCodec())

        log.info("Initializing workspace")
        workspace.init(config.replCmd, config.defaultEnv)
        log.info("Starting workspace")

        log.info("Initializing default file ${config.mainFile}")
        filesService.writeFile(workspace.path.resolve(config.mainFile), config.mainFileContent)

        val router: Router = Router.router(vertx)

        router.route("/graphql").handler(ApolloWSHandler.create(graphQL, ApolloWSOptions().apply {
            keepAlive = 15000L
        }))

        watcher.watch()
        vertx.createHttpServer()
                .requestHandler(router::handle)
                .listen(8080)
    }
}