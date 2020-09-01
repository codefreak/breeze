package org.codefreak.breeze.workspace

import io.vertx.core.Future
import io.vertx.core.Promise
import io.vertx.core.Vertx
import org.codefreak.breeze.shell.Process
import org.slf4j.LoggerFactory
import java.nio.file.Path
import kotlin.concurrent.thread
import kotlin.properties.Delegates

/**
 * This abstract workspace class is only responsible for state management
 * TODO: make async thread safe
 */
abstract class Workspace(
        protected val vertx: Vertx,
        val path: Path,
        private val remove: Boolean
) {
    companion object {
        private val log: org.slf4j.Logger = LoggerFactory.getLogger(Workspace::class.java)
    }

    private var status: WorkspaceStatus by Delegates.observable(WorkspaceStatus.UNDEFINED) { _, old, new ->
        if (log.isDebugEnabled) {
            log.debug("Workspace status changed: $old -> $new")
        }
    }

    private var mainProcess: Process? = null
    private val creationPromise: Promise<Unit> = Promise.promise()
    private var startupPromise: Promise<Process>? = null
    private val stopPromise: Promise<Unit> = Promise.promise()
    private val removePromise: Promise<Unit> = Promise.promise()

    @Synchronized
    fun create(cmd: Array<String>, env: Map<String, String>? = null): Future<Unit> {
        if (status >= WorkspaceStatus.CREATING && status < WorkspaceStatus.RUNNING) {
            return creationPromise.future()
        }
        status = WorkspaceStatus.CREATING
        return doCreate(cmd, env).onSuccess {
            status = WorkspaceStatus.CREATED
        }
    }

    protected abstract fun doCreate(cmd: Array<String>, env: Map<String, String>? = null): Future<Unit>

    @Synchronized
    fun start(): Future<Process> {
        if (status === WorkspaceStatus.STARTING) {
            return startupPromise?.future()
                    ?: throw RuntimeException("Workspace is already starting but has no startup promise.")
        }
        if (status === WorkspaceStatus.RUNNING) {
            return mainProcess?.let { Future.succeededFuture(it) }
                    ?: throw RuntimeException("Workspace is running but has no main process.")
        }
        if (status > WorkspaceStatus.STOPPED) {
            return Future.failedFuture(RuntimeException("Cannot restart a removed environment"))
        }
        val promise = Promise.promise<Process>()
        startupPromise = promise
        status = when {
            status > WorkspaceStatus.RUNNING -> WorkspaceStatus.RESTARTING
            else -> WorkspaceStatus.STARTING
        }
        doStart().onSuccess {
            status = WorkspaceStatus.RUNNING
            it.start()
            mainProcess = it
            // join process to keep status synced
            // TODO: this looks ugly and creates a stray thread
            thread {
                it.join()
                log.debug("Main process was stopped from outside. Stopping workspace...")
                stop()
            }
            promise.complete(it)
            startupPromise = null
        }
        return promise.future()
    }

    protected abstract fun doStart(): Future<out Process>

    @Synchronized
    fun stop(): Future<Unit> {
        if (status >= WorkspaceStatus.STOPPING) {
            return stopPromise.future()
        }
        status = WorkspaceStatus.STOPPING
        doStop().onComplete {
            status = WorkspaceStatus.STOPPED
            mainProcess = null
            stopPromise.complete()
        }
        return stopPromise.future()
    }

    protected abstract fun doStop(): Future<Unit>

    @Synchronized
    fun remove(): Future<Unit> {
        if (status >= WorkspaceStatus.REMOVING && status < WorkspaceStatus.STOPPED) {
            return removePromise.future()
        }
        if (status < WorkspaceStatus.STOPPED && status > WorkspaceStatus.CREATED) {
            return Future.failedFuture(RuntimeException("Can only remove non-running workspace"))
        }
        status = WorkspaceStatus.REMOVING
        if (remove) {
            doRemove().onComplete {
                removePromise.complete()
            }
        } else {
            removePromise.complete()
        }
        return removePromise.future().onSuccess {
            status = WorkspaceStatus.REMOVED
        }
    }

    protected abstract fun doRemove(): Future<Unit>

    @Synchronized
    fun exec(cmd: Array<String>, env: Map<String, String>? = null): Future<Process> {
        if (status !== WorkspaceStatus.RUNNING) {
            return Future.failedFuture(RuntimeException("Can only start processes in running workspaces"))
        }
        return doExec(cmd, env)
    }

    protected abstract fun doExec(cmd: Array<String>, env: Map<String, String>? = null): Future<Process>
}