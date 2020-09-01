package org.codefreak.breeze.shell.docker

import com.github.dockerjava.api.DockerClient
import com.github.dockerjava.api.async.ResultCallback
import com.github.dockerjava.api.exception.DockerException
import com.github.dockerjava.api.exception.NotModifiedException
import com.github.dockerjava.api.model.WaitResponse
import org.apache.commons.io.input.CloseShieldInputStream
import org.apache.commons.io.output.CloseShieldOutputStream
import org.codefreak.breeze.shell.Process
import org.slf4j.LoggerFactory
import java.io.PipedInputStream
import java.io.PipedOutputStream

class DockerContainerProcess(
        private val docker: DockerClient,
        private val containerId: String
) : Process {
    companion object {
        private val log: org.slf4j.Logger = LoggerFactory.getLogger(DockerContainerProcess::class.java)
    }

    override val stdin = PipedOutputStream()
    private val stdoutStream = PipedOutputStream()
    override val stdout = PipedInputStream(stdoutStream)

    override fun start() {
        docker.attachContainerCmd(containerId)
                .withFollowStream(true)
                .withStdIn(CloseShieldInputStream(PipedInputStream(stdin)))
                .withStdErr(true)
                .withStdOut(true)
                .exec(StreamResultCallback(CloseShieldOutputStream(stdoutStream)))

        try {
            docker.startContainerCmd(containerId).exec()
        } catch (e: NotModifiedException) {
            log.warn("Container $containerId is already running. This is unexpected.")
        }
    }

    override fun close(): Int {
        try {
            // TODO: try to stop gracefully first
            docker.killContainerCmd(containerId).exec()
            log.info("Stopped container $containerId")
        } catch (e: DockerException) {
            log.warn("Could not stop container $containerId: ${e.message}")
        }
        try {
            docker.removeContainerCmd(containerId)
                    .withForce(true)
                    .withRemoveVolumes(true)
                    .exec()
            log.info("Removed container $containerId")
        } catch (e: DockerException) {
            log.warn("Could not remove container $containerId: ${e.message}")
        }
        // TODO: correct exit code
        return 0
    }

    override fun resize(cols: Int, rows: Int) {
        try {
            docker.resizeContainerCmd(containerId)
                    .withSize(rows, cols)
                    .exec()
        } catch (e: DockerException) {
            log.warn("Could not resize container's pty: " + e.message)
        }
    }

    override fun join(): Int {
        var exitCode: Int = -1
        docker.waitContainerCmd(containerId).exec(object : ResultCallback.Adapter<WaitResponse>() {
            override fun onNext(response: WaitResponse) {
                exitCode = response.statusCode
            }
        }).awaitCompletion()
        return exitCode
    }
}