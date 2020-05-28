package org.codefreak.breeze.workspace

import io.vertx.core.Future
import io.vertx.core.Promise
import io.vertx.core.Vertx
import org.codefreak.breeze.shell.LocalProcessFactory
import org.codefreak.breeze.shell.Process
import org.codefreak.breeze.util.tmpdir
import java.nio.file.Path

class LocalWorkspace(
        vertx: Vertx,
        path: Path,
        remove: Boolean = false
) : Workspace(vertx, path, remove) {
    companion object {
        /**
         * Start workspace in a temporary directory
         */
        fun tmp(vertx: Vertx) = LocalWorkspace(
                vertx,
                tmpdir(),
                remove = true
        )
    }

    private val processFactory = LocalProcessFactory()
    private var mainProcess: Process? = null
    private var cmd: Array<String>? = null
    private var env: Map<String, String>? = null

    override fun doInit(cmd: Array<String>, env: Map<String, String>?): Future<Unit> {
        this.cmd = cmd
        this.env = env

        val promise = Promise.promise<Unit>()
        if (vertx.fileSystem().existsBlocking(path.toString())) {
            promise.complete()
        } else {
            vertx.fileSystem().mkdirs(path.toString()) {
                if (it.succeeded()) {
                    promise.complete()
                } else {
                    promise.fail(it.cause())
                }
            }
        }
        return promise.future()
    }

    override fun doStart(): Future<Process> {
        val promise = Promise.promise<Process>()
        vertx.executeBlocking<Process>({
            // TODO: watch process and go to stopped if it ends
            it.complete(processFactory.createProcess(
                    cmd ?: throw RuntimeException("No command has be specified"),
                    path.toString(),
                    env
            ))
        }, {
            mainProcess = it.result()
            promise.complete(mainProcess)
        })
        return promise.future()
    }

    override fun doStop(): Future<Unit> {
        val promise = Promise.promise<Unit>()
        vertx.executeBlocking<Unit>({
            mainProcess?.close()
            it.complete()
        }, {
            promise.complete()
        })
        return promise.future()
    }

    override fun doRemove(): Future<Unit> {
        val promise = Promise.promise<Unit>()
        vertx.fileSystem().deleteRecursive(path.toString(), true) {
            if (it.succeeded()) {
                promise.complete()
            } else {
                promise.fail(it.cause())
            }
        }
        return promise.future()
    }

    override fun doExec(cmd: Array<String>, env: Map<String, String>?): Future<Process> {
        // TODO: Store processes and kill all of them on stop
        return Future.succeededFuture(
                processFactory.createProcess(cmd, path.toString(), env)
        )
    }
}