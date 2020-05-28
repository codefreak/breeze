package org.codefreak.breeze.workspace

import io.vertx.core.Future
import io.vertx.core.Promise
import io.vertx.core.Vertx
import org.codefreak.breeze.shell.Process
import java.nio.file.Path

/**
 * This abstract workspace class is only responsible for state management
 */
abstract class Workspace(
        protected val vertx: Vertx,
        val path: Path,
        private val remove: Boolean
) {
    var status: WorkspaceStatus = WorkspaceStatus.UNDEFINED
        private set

    private val creationPromise: Promise<Unit> = Promise.promise()
    private var startupPromise: Promise<Process>? = null
    private val stopPromise: Promise<Unit> = Promise.promise()
    private val removePromise: Promise<Unit> = Promise.promise()

    fun init(cmd: Array<String>, env: Map<String, String>? = null): Future<Unit> {
        if (status >= WorkspaceStatus.CREATING && status < WorkspaceStatus.RUNNING) {
            return creationPromise.future()
        }
        status = WorkspaceStatus.CREATING
        return doInit(cmd, env).onSuccess {
            status = WorkspaceStatus.CREATED
        }
    }

    protected abstract fun doInit(cmd: Array<String>, env: Map<String, String>? = null): Future<Unit>

    fun start(): Future<Process> {
        startupPromise?.let {
            return it.future()
        }
        if (status > WorkspaceStatus.STOPPED) {
            return Future.failedFuture(RuntimeException("Cannot restart a removed environment"))
        }
        status = if (status > WorkspaceStatus.RUNNING) {
            WorkspaceStatus.RESTARTING
        } else {
            WorkspaceStatus.STARTING
        }
        return Promise.promise<Process>().also { promise ->
            startupPromise = promise
            doStart().onSuccess() {
                status = WorkspaceStatus.RUNNING
                startupPromise = null
                promise.complete(it)
            }
        }.future()
    }

    protected abstract fun doStart(): Future<Process>

    fun stop(): Future<Unit> {
        if (status >= WorkspaceStatus.STOPPING) {
            return stopPromise.future()
        }
        if (status < WorkspaceStatus.RUNNING) {
            return Future.failedFuture(RuntimeException("Can only stop running workspace"))
        }
        status = WorkspaceStatus.STOPPING
        doStop().onComplete {
            status = WorkspaceStatus.STOPPED
        }
        return stopPromise.future()
    }

    protected abstract fun doStop(): Future<Unit>

    fun remove(): Future<Unit> {
        if (status >= WorkspaceStatus.REMOVING && status < WorkspaceStatus.STOPPED) {
            return removePromise.future()
        }
        if (status < WorkspaceStatus.STOPPED) {
            return Future.failedFuture(RuntimeException("Can only remove stopped workspace"))
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

    fun exec(cmd: Array<String>, env: Map<String, String>? = null): Future<Process> {
        if (status !== WorkspaceStatus.RUNNING) {
            return Future.failedFuture(RuntimeException("Can only start processes in running workspaces"))
        }
        return doExec(cmd, env)
    }

    protected abstract fun doExec(cmd: Array<String>, env: Map<String, String>? = null): Future<Process>
}