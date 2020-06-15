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
import org.codefreak.breeze.graphql.model.ReplType
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
class ReplResolver
@Inject constructor(
        private val config: BreezeConfiguration,
        private val workspace: Workspace
) : GraphQLMutationResolver, GraphQLSubscriptionResolver {
    companion object {
        private val MAIN_PROCESS_UID = UUID(0, 0)
        private val log: Logger = LoggerFactory.getLogger(ReplResolver::class.java)
    }

    private val processMap = mutableMapOf<UUID, Process>()

    fun createRepl(type: ReplType = ReplType.DEFAULT): CompletionStage<UUID> {
        val promise = Promise.promise<UUID>()
        if (type === ReplType.DEFAULT) {
            workspace.start().onSuccess {
                processMap[MAIN_PROCESS_UID] = it
                promise.complete(MAIN_PROCESS_UID)
            }
        } else {
            workspace.exec(config.runCmd).map { process ->
                val id = UUID.randomUUID()
                processMap[id] = process
                log.info("Starting REPL $id")
                process.start()
                log.info("Started REPL $id")
                promise.complete(id)
            }
        }
        return promise.future().toCompletionStage()
    }

    fun writeRepl(id: UUID, data: String) {
        // fail gracefully if repl does not exist (anymore)
        processMap[id]?.write(data) ?: -1
    }

    fun resizeRepl(id: UUID, cols: Int, rows: Int): Boolean {
        val process = processMap[id] ?: throw IllegalArgumentException("No REPL $id")
        process.resize(cols, rows)
        return true
    }

    fun killRepl(id: UUID) {
        stopProcess(id)
    }

    fun replOutput(id: UUID): Publisher<String> {
        val process = processMap[id] ?: throw IllegalArgumentException("No REPL $id")
        return Flowable.create({ emitter ->
            log.info("Subscribing for data of shell $id")
            val stdoutThread = thread {
                Strings.from(BufferedReader(InputStreamReader(process.stdout)))
                        .onErrorReturnItem("\u0000")
                        .subscribe(emitter::onNext)
            }
            emitter.setCancellable {
                stdoutThread.interrupt()
                stopProcess(id)
            }
        }, BackpressureStrategy.BUFFER)
    }

    fun replWait(id: UUID): Publisher<Int> {
        val process = processMap[id] ?: throw IllegalArgumentException("No REPL $id")
        return Flowable.create<Int>({ emitter ->
            val joinThread = thread {
                try {
                    val exitCode = process.join()
                    log.info("Repl $id finished")
                    if (!emitter.isCancelled) {
                        emitter.onNext(exitCode)
                        emitter.onComplete()
                    }
                } catch (e: InterruptedException) {
                    log.info("Waiting for REPL $id was cancelled")
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
}