package org.codefreak.breeze

import com.google.inject.Inject
import com.google.inject.Singleton
import graphql.GraphQL
import io.vertx.core.AbstractVerticle
import io.vertx.core.Context
import io.vertx.core.Future
import io.vertx.core.Vertx
import io.vertx.core.http.HttpMethod
import io.vertx.core.http.HttpServer
import io.vertx.ext.web.Router
import io.vertx.ext.web.handler.CorsHandler
import io.vertx.ext.web.handler.StaticHandler
import io.vertx.ext.web.handler.graphql.ApolloWSHandler
import io.vertx.ext.web.handler.graphql.ApolloWSOptions
import io.vertx.ext.web.handler.graphql.GraphQLHandler
import io.vertx.kotlin.core.http.closeAwait
import org.codefreak.breeze.util.async
import org.codefreak.breeze.vertx.FilesystemEvent
import org.codefreak.breeze.vertx.FilesystemEventCodec
import org.codefreak.breeze.vertx.FilesystemWatcher
import org.codefreak.breeze.workspace.Workspace
import org.codefreak.breeze.workspace.WorkspaceStatus
import org.codefreak.breeze.workspace.WorkspaceStatusListener
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

    var httpServer: HttpServer? = null
    var stop = false

    override fun init(vertx: Vertx, context: Context) {
        super.init(vertx, context)
        vertx.eventBus().registerDefaultCodec(FilesystemEvent::class.java, FilesystemEventCodec())
    }

    override fun start(startFuture: Future<Void>) {
        config.containerId.let {
            if (it != null) {
                log.info("Running inside container with id $it")
            } else {
                log.info("Not running inside a container")
            }
        }

        httpServer = startGraphqlServer()
        startWorkspace().onComplete {
            @Suppress("DEPRECATION")
            startFuture.complete()
        }
    }

    override fun stop(stopFuture: Future<Void>) {
        stop = true
        log.info("Received shutdown, stopping server…")
        log.info("Stopping file watcher…")
        filesystemWatcher.stop()
        log.info("Stopping workspace…")
        workspace.stop().onComplete { mapper ->
            log.info("Stopped workspace…")
            if (config.removeOnExit) {
                log.info("removing workspace…")
                workspace.remove().onComplete {
                    log.info("Done.")
                    @Suppress("DEPRECATION")
                    mapper.succeeded()
                }
            } else {
                log.info("Removing on exit is disabled")
                @Suppress("DEPRECATION")
                mapper.succeeded()
            }
        }.onComplete {
            log.info("Stopping HTTP server")
            httpServer?.close()
            log.info("HTTP server stopped")
            stopFuture.complete()
        }
    }

    private fun startWorkspace(): Future<Unit> {
        log.info("Initializing workspace")

        return workspace.create(config.workspaceReplCmd, config.environment).compose {
            log.info("Starting workspace")
            workspace.start()
        }.compose {
            log.info("Provisioning workspace")
            workspace.exec(arrayOf("/bin/sh", "-e", "-c", config.buildProvisionScript()), root = true)
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
        }.compose {
            log.info("Restarting workspace after provisioning...")
            workspace.restart()
        }.onComplete {
            config.mainFile?.let { mainFilePath ->
                log.info("Creating default file ${mainFilePath}")
                val mainFile = filesService.getFile(mainFilePath)
                if (!mainFile.exists()) {
                    filesService.writeFile(mainFile.toPath(), "")
                }
            }
            log.info("Watching ${workspace.localPath} for file changes")
            filesystemWatcher.watch()

            // restart workspace automatically if something goes south
            val restartListener: WorkspaceStatusListener = { _, new ->
                if (!stop && new === WorkspaceStatus.STOPPED) {
                    workspace.restart()
                }
            }
            workspace.addStatusListener(restartListener)
        }.onFailure { t ->
            log.error("Provisioning failed: " + t.message)
        }.compose {
            Future.succeededFuture<Unit>()
        }
    }

    private fun startGraphqlServer(): HttpServer {
        val router: Router = Router.router(vertx)
        router.route().handler(CorsHandler.create("*").allowedMethods(setOf(HttpMethod.GET)))
        // Handle static resources from React in production builds
        router.get().handler(StaticHandler.create())
        router.route("/graphql").handler(ApolloWSHandler.create(graphQL, ApolloWSOptions().apply {
            keepAlive = 15000L
        }))
        router.route("/graphql").handler(GraphQLHandler.create(graphQL))

        return vertx.createHttpServer()
                .requestHandler(router::handle)
                .listen(config.httpPort)
    }
}