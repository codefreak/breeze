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

    override fun start() {
        try {
            docker.execStartCmd(execId)
                    .withTty(true)
                    .withDetach(false)
                    .withStdIn(PipedInputStream(stdin))
                    .exec(StreamResultCallback(stdoutWriter) {
                        log.info("exec output finished")
                        finishedLatch.countDown()
                    })
        } catch (e: Exception) {
            finishedLatch.countDown()
            throw e
        }
    }

    override fun close(): Int {
        return if (finishedLatch.count == 0L) {
            log.warn("Signals for docker exec processes are not supported. Closing stdin instead")
            //stdin.close()
            join()
        } else {
            -1
        }
    }

    override fun resize(cols: Int, rows: Int) {
        log.warn("Resizing docker exec processes is not supported")
    }

    override fun join(): Int {
        finishedLatch.await()
        return docker.inspectExecCmd(execId).exec()?.exitCodeLong?.toInt() ?: -1
    }
}