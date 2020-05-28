package org.codefreak.breeze.graphql

import com.github.davidmoten.rx2.Strings
import graphql.GraphQL
import graphql.execution.SubscriptionExecutionStrategy
import graphql.scalars.ExtendedScalars
import graphql.schema.idl.RuntimeWiring
import graphql.schema.idl.SchemaGenerator
import graphql.schema.idl.SchemaParser
import graphql.schema.idl.TypeDefinitionRegistry
import io.reactivex.BackpressureStrategy
import io.reactivex.Flowable
import io.vertx.core.eventbus.EventBus
import io.vertx.ext.web.handler.graphql.VertxDataFetcher
import org.codefreak.breeze.BreezeConfiguration
import org.codefreak.breeze.graphql.model.Directory
import org.codefreak.breeze.graphql.model.File
import org.codefreak.breeze.graphql.model.FileSystemEventType
import org.codefreak.breeze.graphql.model.ReplType
import org.codefreak.breeze.shell.Process
import org.codefreak.breeze.vertx.FilesystemEvent
import org.codefreak.breeze.workspace.Workspace
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.io.BufferedReader
import java.io.InputStreamReader
import java.nio.file.Paths
import java.util.UUID
import kotlin.concurrent.thread
import org.codefreak.breeze.graphql.model.FilesystemEvent as FilesystemEventModel

class GraphQLFactory(
        private val eventBus: EventBus,
        private val filesService: FilesService,
        private val workspace: Workspace,
        private val filesDataFetcher: FilesDataFetcher,
        private val config: BreezeConfiguration
) {
    private val log: Logger = LoggerFactory.getLogger(this::class.java)

    fun graphQL(): GraphQL {
        val schemaParser = SchemaParser()
        val schemaGenerator = SchemaGenerator()

        val typeRegistry = TypeDefinitionRegistry()
        typeRegistry.merge(
                schemaParser.parse(
                        BufferedReader(
                                InputStreamReader(
                                        Thread.currentThread()
                                                .contextClassLoader
                                                .getResourceAsStream("schema.graphqls")!!
                                )
                        )
                )
        )

        val mainProcessUUID = UUID(0, 0)
        val processMap = mutableMapOf<UUID, Process>()
        fun stopProcess(id: UUID): Int {
            val process = processMap.remove(id) ?: return -1
            log.info("Killing process $id. ${processMap.size} processes left")
            return process.close()
        }

        val runtimeWiring = RuntimeWiring.newRuntimeWiring()
                .scalar(ExtendedScalars.DateTime)
                .type("FileSystemNode") { typeWiring ->
                    typeWiring.typeResolver {
                        when (it.getObject<Any>()) {
                            is File -> it.schema.getObjectType("File")
                            is Directory -> it.schema.getObjectType("Directory")
                            else -> null
                        }
                    }
                }
                .type("Mutation") { typeWiring ->
                    typeWiring.dataFetcher("createRepl", VertxDataFetcher<UUID> { env, future ->
                        val type = ReplType.valueOf(env.getArgumentOrDefault("type", ReplType.DEFAULT.name))
                        if (type === ReplType.DEFAULT) {
                            workspace.start().onSuccess {
                                processMap[mainProcessUUID] = it
                                future.complete(mainProcessUUID)
                            }
                        } else {
                            workspace.exec(config.runCmd).map { process ->
                                val id = UUID.randomUUID()
                                processMap[id] = process
                                process.start()
                                log.info("Started REPL $id")
                                future.complete(id)
                            }
                        }
                    })
                    typeWiring.dataFetcher("writeRepl") {
                        val id = UUID.fromString(it.getArgument("id"))
                        val process = processMap[id]
                        // fail gracefully if repl does not exist (anymore)
                        process?.write(it.getArgument("data")) ?: 0
                    }
                    typeWiring.dataFetcher("resizeRepl") {
                        val id = UUID.fromString(it.getArgument("id"))
                        val process = processMap[id] ?: throw IllegalArgumentException("No REPL $id")
                        process.resize(
                                it.getArgument("cols"),
                                it.getArgument("rows")
                        )
                        true
                    }
                    typeWiring.dataFetcher("killRepl") {
                        val shellId = UUID.fromString(it.getArgument("id"))
                        stopProcess(shellId)
                    }
                    typeWiring.dataFetcher("writeFile") {
                        val path = Paths.get(it.getArgument<String>("path"))
                        filesService.fileToApiObject(
                                filesService.writeFile(path, it.getArgument("contents"))
                        )
                    }
                }
                .type("Query") { typeWiring ->
                    typeWiring.dataFetcher("files", filesDataFetcher)
                    typeWiring.dataFetcher("file") {
                        val path = Paths.get(it.getArgument<String>("path"))
                        filesService.fileToApiObject(
                                filesService.pathToFile(path)
                        )
                    }
                }
                .type("Subscription") { typeWiring ->
                    typeWiring.dataFetcher("fileChange") {
                        log.info("Listening on file changes")
                        Flowable.create<FilesystemEventModel>({ emitter ->
                            val consumer = eventBus.consumer<FilesystemEvent>(FilesystemEvent.ADDRESS) { message ->
                                val event = message.body()
                                emitter.onNext(FilesystemEventModel(
                                        event.path.toString(),
                                        FileSystemEventType.from(event.kind)
                                ))
                            }

                            emitter.setCancellable {
                                log.info("STOP listening on file changes")
                                consumer.unregister()
                            }
                        }, BackpressureStrategy.BUFFER)
                    }
                    typeWiring.dataFetcher("replOutput") {
                        val id = UUID.fromString(it.getArgument("id"))
                        val process = processMap[id] ?: throw IllegalArgumentException("No REPL $id")
                        Flowable.create<String>({ emitter ->
                            log.info("Subscribing for data of shell $id")
                            emitter.setCancellable {
                                stopProcess(id)
                            }
                            thread {
                                Strings.from(BufferedReader(InputStreamReader(process.stdout)))
                                        .subscribe(emitter::onNext)
                            }
                        }, BackpressureStrategy.BUFFER)
                    }
                    typeWiring.dataFetcher("replWait") {
                        val id = UUID.fromString(it.getArgument("id"))
                        val process = processMap[id] ?: throw IllegalArgumentException("No REPL $id")
                        Flowable.create<Int>({ emitter ->
                            val joinThread = thread {
                                val exitCode = process.join()
                                log.info("Repl $id finished")
                                if (!emitter.isCancelled) {
                                    emitter.onNext(exitCode)
                                    emitter.onComplete()
                                }
                            }
                            emitter.setCancellable {
                                log.info("Cancelling waiting for repl $id")
                                joinThread.interrupt()
                            }
                        }, BackpressureStrategy.BUFFER).onErrorReturnItem(-1)
                    }
                }
                .build()

        val schema = schemaGenerator.makeExecutableSchema(typeRegistry, runtimeWiring)
        return GraphQL.newGraphQL(schema)
                .subscriptionExecutionStrategy(SubscriptionExecutionStrategy())
                .build()
    }
}