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
        private val log: Logger = LoggerFactory.getLogger(ProcessResolver::class.java)
    }

    fun createProcess(type: ProcessType = ProcessType.DEFAULT): CompletionStage<UUID> {
        val promise = Promise.promise<UUID>()
        if (type === ProcessType.DEFAULT) {
            workspace.start().onSuccess {
                promise.complete(Workspace.MAIN_PROCESS_ID)
            }
        } else {
            workspace.exec(config.runCmd).map { processId ->
                promise.complete(processId)
            }
        }
        return promise.future().toCompletionStage()
    }

    fun writeProcess(id: UUID, data: String) = workspace.withProcess(id) {
        // fail gracefully if process does not exist (anymore)
        it.write(data)
    }

    fun resizeProcess(id: UUID, cols: Int, rows: Int): Boolean = workspace.withProcess(id) { process ->
        process.resize(cols, rows)
        true
    }

    fun killProcess(id: UUID) {
        stopProcess(id)
    }

    fun processOutput(id: UUID): Publisher<String> {
        log.info("Subscribing for data of shell $id")
        val stdout = workspace.stdout(id) ?: throw IllegalArgumentException("There is no process $id")
        return Flowable.create({ emitter ->
            val stdoutThread = thread {
                Strings.from(BufferedReader(InputStreamReader(stdout)))
                        .onErrorReturnItem("\u0000")
                        .subscribe(emitter::onNext)
            }
            emitter.setCancellable {
                stdoutThread.interrupt()
            }
        }, BackpressureStrategy.BUFFER)
    }

    fun processWait(id: UUID): Publisher<Int> = workspace.withProcess(id) { process ->
        return@withProcess Flowable.create<Int>({ emitter ->
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

    private fun stopProcess(id: UUID): CompletionStage<Int> = workspace.withProcess(id) { process ->
        if (id == Workspace.MAIN_PROCESS_ID) {
            return@withProcess Future.succeededFuture(-1).toCompletionStage()
        }
        process.close()
        return@withProcess Future.succeededFuture(process.close()).toCompletionStage()
    }
}