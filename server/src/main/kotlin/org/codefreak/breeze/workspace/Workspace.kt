package org.codefreak.breeze.workspace

import io.vertx.core.Future
import io.vertx.core.Promise
import io.vertx.core.Vertx
import org.codefreak.breeze.shell.LocalProcessFactory
import org.codefreak.breeze.shell.Process
import org.codefreak.breeze.util.tmpdir
import java.nio.file.Path

open class Workspace(
        private val vertx: Vertx,
        val path: Path,
        private val remove: Boolean = false
) {
    companion object {
        /**
         * Start workspace in a temporary directory
         */
        fun tmp(vertx: Vertx) = Workspace(
                vertx,
                tmpdir(),
                remove = true
        )
    }

    var status: WorkspaceStatus = WorkspaceStatus.UNDEFINED
        protected set
    private val processFactory = LocalProcessFactory()

    private val creationPromise: Promise<Unit> = Promise.promise()
    private var startupPromise: Promise<Process>? = null
    private val stopPromise: Promise<Unit> = Promise.promise()
    private val removePromise: Promise<Unit> = Promise.promise()

    private var cmd: Array<String>? = null
    private var env: Map<String, String>? = null
    private var mainProcess: Process? = null

    fun init(cmd: Array<String>, env: Map<String, String>? = null): Future<Unit> {
        if (status >= WorkspaceStatus.CREATING && status < WorkspaceStatus.RUNNING) {
            return creationPromise.future()
        }
        this.cmd = cmd
        this.env = env
        status = WorkspaceStatus.CREATING

        if (vertx.fileSystem().existsBlocking(path.toString())) {
            creationPromise.complete()
        } else {
            vertx.fileSystem().mkdirs(path.toString()) {
                if (it.succeeded()) {
                    creationPromise.complete()
                } else {
                    creationPromise.fail(it.cause())
                }
            }
        }
        return creationPromise.future().onSuccess {
            status = WorkspaceStatus.CREATED
        }
    }

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
            vertx.executeBlocking<Process>({
                // TODO: watch process and go to stopped if it ends
                it.complete(processFactory.createProcess(
                        cmd ?: throw RuntimeException("No command has be specified"),
                        path.toString(),
                        env
                ))
            }, {
                status = WorkspaceStatus.RUNNING
                promise.complete(it.result())
                startupPromise = null
            })
        }.future()
    }

    fun stop(): Future<Unit> {
        if (status >= WorkspaceStatus.STOPPING) {
            return stopPromise.future()
        }
        if (status < WorkspaceStatus.RUNNING) {
            return Future.failedFuture(RuntimeException("Can only stop running workspace"))
        }
        status = WorkspaceStatus.STOPPING
        vertx.executeBlocking<Unit>({
            mainProcess?.close()
            it.complete()
        }, {
            status = WorkspaceStatus.STOPPED
            stopPromise.complete()
        })
        return stopPromise.future()
    }

    fun remove(): Future<Unit> {
        if (status >= WorkspaceStatus.REMOVING && status < WorkspaceStatus.STOPPED) {
            return removePromise.future()
        }
        if (status < WorkspaceStatus.STOPPED) {
            return Future.failedFuture(RuntimeException("Can only remove stopped workspace"))
        }
        status = WorkspaceStatus.REMOVING
        if (remove) {
            vertx.fileSystem().deleteRecursive(path.toString(), true) {
                if (it.succeeded()) {
                    removePromise.complete()
                } else {
                    removePromise.fail(it.cause())
                }
            }
        } else {
            removePromise.complete()
        }
        return removePromise.future().onSuccess {
            status = WorkspaceStatus.REMOVED
        }
    }

    fun exec(cmd: Array<String>, env: Map<String, String>? = null): Future<Process> {
        if (status !== WorkspaceStatus.RUNNING) {
            return Future.failedFuture(RuntimeException("Can only start processes in running workspaces"))
        }
        // TODO: Store processes and kill all of them on stop
        return Future.succeededFuture(
                processFactory.createProcess(cmd, path.toString(), env)
        )
    }
}