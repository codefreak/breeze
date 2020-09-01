package org.codefreak.breeze.graphql

import com.github.davidmoten.rx2.Strings
import com.google.inject.Inject
import com.google.inject.Singleton
import graphql.kickstart.tools.GraphQLMutationResolver
import graphql.kickstart.tools.GraphQLSubscriptionResolver
import io.reactivex.BackpressureStrategy
import io.reactivex.Flowable
import io.vertx.core.Future
import io.vertx.core.Promise
import org.codefreak.breeze.BreezeConfiguration
import org.codefreak.breeze.graphql.model.ProcessType
import org.codefreak.breeze.io.CachedTeeInputStream
import org.codefreak.breeze.shell.Process
import org.codefreak.breeze.util.toCompletionStage
import org.codefreak.breeze.workspace.Workspace
import org.reactivestreams.Publisher
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.UUID
import java.util.concurrent.CompletionStage
import kotlin.concurrent.thread

@Singleton
class ProcessResolver
@Inject constructor(
        private val config: BreezeConfiguration,
        private val workspace: Workspace
) : GraphQLMutationResolver, GraphQLSubscriptionResolver {
    companion object {
        private val MAIN_PROCESS_UID = UUID(0, 0)
        private val log: Logger = LoggerFactory.getLogger(ProcessResolver::class.java)
    }

    private val processMap = mutableMapOf<UUID, Process>()
    private val stdoutMap = mutableMapOf<UUID, CachedTeeInputStream>()

    fun createProcess(type: ProcessType = ProcessType.DEFAULT): CompletionStage<UUID> {
        val promise = Promise.promise<UUID>()
        if (type === ProcessType.DEFAULT) {
            workspace.start().onSuccess { process ->
                val existingMainProcess = processMap[MAIN_PROCESS_UID]
                if(existingMainProcess == null) {
                    processMap[MAIN_PROCESS_UID] = process
                    val existingStdout = stdoutMap[MAIN_PROCESS_UID]?.cache?.toByteArray()
                    stdoutMap[MAIN_PROCESS_UID] = CachedTeeInputStream(process.stdout, existingStdout).also {
                        it.drain()
                    }
                    // TODO: introduce event system for workspace to keep process map in sync
                    thread {
                        process.join()
                        log.debug("Main process stopped. Removing from map")
                        processMap.remove(MAIN_PROCESS_UID)
                    }
                }
                promise.complete(MAIN_PROCESS_UID)
            }
        } else {
            workspace.exec(config.runCmd).map { process ->
                val id = UUID.randomUUID()
                processMap[id] = process
                log.info("Starting process $id")
                process.start()
                log.info("Started process $id")
                promise.complete(id)
            }
        }
        return promise.future().toCompletionStage()
    }

    fun writeProcess(id: UUID, data: String) {
        // fail gracefully if process does not exist (anymore)
        processMap[id]?.write(data) ?: -1
    }

    fun resizeProcess(id: UUID, cols: Int, rows: Int): Boolean = withProcess(id) { process ->
        process.resize(cols, rows)
        return true
    }

    fun killProcess(id: UUID) {
        stopProcess(id)
    }

    fun processOutput(id: UUID): Publisher<String> = withProcess(id) {
        val stdout = stdoutMap[id] ?: throw IllegalArgumentException("There is no shell $id")
        return Flowable.create({ emitter ->
            log.info("Subscribing for data of shell $id")
            val stdoutThread = thread {
                Strings.from(BufferedReader(InputStreamReader(stdout.split())))
                        .onErrorReturnItem("\u0000")
                        .subscribe(emitter::onNext)
            }
            emitter.setCancellable {
                stdoutThread.interrupt()
            }
        }, BackpressureStrategy.BUFFER)
    }

    fun processWait(id: UUID): Publisher<Int> = withProcess(id) { process ->
        return Flowable.create<Int>({ emitter ->
            val joinThread = thread {
                try {
                    val exitCode = process.join()
                    log.info("Process $id finished with exit code $exitCode")
                    if (!emitter.isCancelled) {
                        emitter.onNext(exitCode)
                        emitter.onComplete()
                    }
                } catch (e: InterruptedException) {
                    log.info("Waiting for process $id was cancelled")
                }
            }
            emitter.setCancellable {
                joinThread.interrupt()
            }
        }, BackpressureStrategy.BUFFER).onErrorReturnItem(-1)
    }

    private fun stopProcess(id: UUID): CompletionStage<Int> {
        if (id == MAIN_PROCESS_UID) {
            return Future.succeededFuture(-1).toCompletionStage()
        }

        val process = processMap.remove(id) ?: return Future.succeededFuture(-1).toCompletionStage()
        log.info("Killing process $id. ${processMap.size} processes left")
        return Future.succeededFuture(process.close()).toCompletionStage()
    }

    private inline fun <T> withProcess(id: UUID, block: (process: Process) -> T): T {
        val process = processMap[id] ?: throw IllegalArgumentException("No process $id")
        return block(process)
    }
}