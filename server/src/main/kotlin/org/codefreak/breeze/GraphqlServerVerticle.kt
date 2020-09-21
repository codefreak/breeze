package org.codefreak.breeze

import com.google.inject.Inject
import com.google.inject.Singleton
import graphql.GraphQL
import io.vertx.core.AbstractVerticle
import io.vertx.core.Future
import io.vertx.core.http.HttpMethod
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.CorsHandler
import io.vertx.ext.web.handler.StaticHandler
import io.vertx.ext.web.handler.graphql.ApolloWSHandler
import io.vertx.ext.web.handler.graphql.ApolloWSOptions
import io.vertx.ext.web.handler.graphql.GraphQLHandler
import org.codefreak.breeze.graphql.FilesService
import org.codefreak.breeze.util.async
import org.codefreak.breeze.vertx.FilesystemEvent
import org.codefreak.breeze.vertx.FilesystemEventCodec
import org.codefreak.breeze.vertx.FilesystemWatcher
import org.codefreak.breeze.workspace.Workspace
import org.slf4j.LoggerFactory
import java.util.stream.Collectors

@Singleton
class GraphqlServerVerticle
@Inject constructor(
        private val workspace: Workspace,
        private val config: BreezeConfiguration,
        private val filesService: FilesService,
        private val filesystemWatcher: FilesystemWatcher,
        private val graphQL: GraphQL
) : AbstractVerticle() {
    companion object {
        private val log = LoggerFactory.getLogger(GraphqlServerVerticle::class.java)
    }

    override fun start() {
        vertx.eventBus().registerDefaultCodec(FilesystemEvent::class.java, FilesystemEventCodec())

        config.containerId.let {
            if (it != null) {
                log.info("Running inside container with id $it")
            } else {
                log.info("Not running inside a container")
            }
        }

        log.info("Initializing workspace")
        workspace.create(config.workspaceReplCmd, config.defaultEnv).compose {
            log.info("Starting workspace")
            workspace.start()
        }.compose {
            log.info("Provisioning workspace")
            workspace.exec(arrayOf("/bin/sh", "-e", "-c", config.provisionScript), root = true)
        }.compose { processUid ->
            val stdout = workspace.stdout(processUid)
            workspace.withProcess(processUid) { process ->
                async(vertx) {
                    log.info("Waiting for provisioning to finish...")
                    Triple(stdout, process, process.join())
                }
            }
        }.compose { (stdout, process, exitCode) ->
            if (exitCode == 0) {
                log.info("Provisioning finished successfully. ")
            } else {
                val output = stdout.bufferedReader().lines().collect(Collectors.joining())
                log.warn("Provisioning failed: $output")
            }
            Future.succeededFuture(process)
        }.onFailure { t ->
            log.error("Provisioning failed: " + t.message)
        }

        log.info("Initializing default file ${config.mainFile}")
        filesService.writeFile(workspace.path.resolve(config.mainFile), config.mainFileContent)

        val router: Router = Router.router(vertx)
        router.route().handler(CorsHandler.create("*").allowedMethods(setOf(HttpMethod.GET)))
        // Handle static resources from React in production builds
        router.get().handler(StaticHandler.create())
        router.route("/graphql").handler(ApolloWSHandler.create(graphQL, ApolloWSOptions().apply {
            keepAlive = 15000L
        }))
        router.route("/graphql").handler(GraphQLHandler.create(graphQL))

        filesystemWatcher.watch()

        vertx.createHttpServer()
                .requestHandler(router::handle)
                .listen(8080)
    }

    override fun stop(stopFuture: Future<Void>) {
        log.info("Received shutdown, stopping server…")
        log.info("Stopping file watcher…")
        filesystemWatcher.stop()
        log.info("Stopping workspace…")
        workspace.stop().onSuccess {
            log.info("removing workspace…")
            workspace.remove().onComplete {
                log.info("Done.")
                stopFuture.complete()
            }
        }
    }
}