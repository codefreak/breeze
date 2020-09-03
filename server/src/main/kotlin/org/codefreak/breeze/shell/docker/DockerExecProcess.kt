package org.codefreak.breeze.shell.docker

import com.github.dockerjava.api.DockerClient
import org.codefreak.breeze.shell.Process
import org.slf4j.LoggerFactory
import java.io.PipedInputStream
import java.io.PipedOutputStream
import java.util.concurrent.CountDownLatch

class DockerExecProcess(
        private val docker: DockerClient,
        private val execId: String
) : Process {
    companion object {
        private val log: org.slf4j.Logger = LoggerFactory.getLogger(DockerExecProcess::class.java)
    }

    override val stdin = PipedOutputStream()
    private val stdoutWriter = PipedOutputStream()
    override val stdout = PipedInputStream(stdoutWriter)
    private val finishedLatch = CountDownLatch(1)
    private var exitCode: Int? = null
    private var resultCallback= StreamResultCallback(stdoutWriter) {
        // This marks the end of the process
        finishedLatch.countDown()
    }

    override fun start() {
        try {
            docker.execStartCmd(execId)
                    .withTty(true)
                    .withDetach(false)
                    .withStdIn(PipedInputStream(stdin))
                    .exec(resultCallback)
        } catch (e: Exception) {
            finishedLatch.countDown()
            throw e
        }
    }

    override fun close(): Int {
        return if (finishedLatch.count == 1L) {
            // There is no way to stop or send signals to Docker Exec via API
            // we simply close stream and mark this instance as finished.
            // Additionally, there is an issue with docker-java UNIX streams that will keep a stray thread
            // if the exec instance does not produce any output. The underlying stream will block forever.
            resultCallback.close()
            finishedLatch.countDown()
            return join()
        } else {
            -1
        }
    }

    override fun resize(cols: Int, rows: Int) {
        docker.resizeExecCmd(execId)
                .withSize(rows, cols)
                .exec()
    }

    override fun join(): Int {
        finishedLatch.await()
        synchronized(this) {
            this.exitCode?.let {
                return it
            }
            val newExitCode = fetchExitCode() ?: -1
            this.exitCode = newExitCode
            return newExitCode
        }
    }

    private fun fetchExitCode(): Int? {
        return docker.inspectExecCmd(execId).exec()?.exitCodeLong?.toInt()
    }
}