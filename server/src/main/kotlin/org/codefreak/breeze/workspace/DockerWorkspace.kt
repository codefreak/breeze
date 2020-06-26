package org.codefreak.breeze.workspace

import com.github.dockerjava.api.DockerClient
import com.github.dockerjava.api.async.ResultCallback
import com.github.dockerjava.api.exception.DockerException
import com.github.dockerjava.api.model.Bind
import com.github.dockerjava.api.model.HostConfig
import com.github.dockerjava.api.model.PullResponseItem
import com.github.dockerjava.api.model.Volume
import com.google.inject.Inject
import com.google.inject.Singleton
import io.vertx.core.Future
import io.vertx.core.Promise
import io.vertx.core.Vertx
import org.codefreak.breeze.BreezeConfiguration
import org.codefreak.breeze.shell.Process
import org.codefreak.breeze.shell.docker.DockerContainerProcess
import org.codefreak.breeze.shell.docker.DockerExecProcess
import org.codefreak.breeze.util.async
import org.codefreak.breeze.util.tmpdir
import org.slf4j.LoggerFactory

@Singleton
class DockerWorkspace
@Inject constructor(
        vertx: Vertx,
        private val config: BreezeConfiguration,
        private val docker: DockerClient
) : Workspace(vertx, tmpdir(config.instanceId), true) {
    companion object {
        private val log: org.slf4j.Logger = LoggerFactory.getLogger(DockerWorkspace::class.java)
    }

    private var containerId: String? = null

    override fun doInit(cmd: Array<String>, env: Map<String, String>?): Future<Unit> {
        // use existing container
        if (containerId !== null) {
            return Future.succeededFuture()
        }

        val promise = Promise.promise<Unit>()
        // create temporary dir
        vertx.fileSystem().mkdirs(path.toString()) {
            if (it.succeeded()) {
                promise.complete()
            } else {
                promise.fail(it.cause())
            }
        }

        // pull docker image and create container
        val imageName = normalizeImageName(config.replDockerImage)
        return promise.future().compose {
            return@compose pullDockerImage(imageName)
        }.compose {
            return@compose createContainer(imageName, cmd, env)
        }
    }

    override fun doStart(): Future<Process> {
        return Future.succeededFuture(
                DockerContainerProcess(
                        docker,
                        containerId ?: throw RuntimeException("No containerId")
                )
        )
    }

    override fun doStop(): Future<Unit> = withContainerId {
        return stopContainer(it)
    }

    override fun doRemove(): Future<Unit> = withContainerId {
        return removeContainer(it)
    }

    override fun doExec(cmd: Array<String>, env: Map<String, String>?): Future<Process> = withContainerId { id ->
        return createExec(id, cmd, env).map { exec ->
            log.debug("Created exec instance with '${cmd.joinToString(" ")}' on container $id")
            DockerExecProcess(docker, exec.id)
        }
    }

    private inline fun <T> withContainerId(block: (containerId: String) -> T): T {
        return block(containerId ?: throw RuntimeException("No container id"))
    }

    private fun createContainer(imageName: String, cmd: Array<String>, env: Map<String, String>?) = async(vertx) {
        val volume = Volume(config.dockerWorkingdir)
        val container = docker.createContainerCmd(imageName)
                .withCmd(*cmd)
                .withTty(true)
                .withEnv(env?.toKeyValueList() ?: listOf())
                .withStdinOpen(true)
                .withAttachStdout(true)
                .withHostName(config.replHostname)
                .withWorkingDir(config.dockerWorkingdir)
                // todo: prepare proper named volumes and share them between docker instances
                .withVolumes(volume)
                .withHostConfig(HostConfig.newHostConfig().apply {
                    withBinds(Bind(path.toString(), volume))
                })
                .exec()

        containerId = container.id
    }

    private fun pullDockerImage(imageName: String) = async(vertx) {
        if (!imageExists(imageName)) {
            log.info("Pulling image $imageName")
            val callback = object : ResultCallback.Adapter<PullResponseItem>() {
                override fun onNext(response: PullResponseItem) {
                    log.info(
                            "Pulling $imageName: ${response.progressDetail?.current}/${response.progressDetail?.total}"
                    )
                }
            }
            docker.pullImageCmd(imageName).exec(callback)
            callback.awaitCompletion()
        }
    }

    private fun stopContainer(containerId: String) = async<Unit>(vertx) {
        docker.stopContainerCmd(containerId).exec()
    }

    private fun removeContainer(containerId: String) = async<Unit>(vertx) {
        docker.removeContainerCmd(containerId).exec()
    }

    private fun createExec(containerId: String, cmd: Array<String>, env: Map<String, String>?) = async(vertx) {
        docker.execCreateCmd(containerId)
                .withCmd(*cmd)
                .withWorkingDir(config.dockerWorkingdir)
                .withTty(true)
                .withAttachStdout(true)
                .withAttachStdin(true)
                .withEnv(env?.toKeyValueList() ?: listOf())
                .exec()
    }

    private fun imageExists(imageName: String): Boolean {
        return try {
            // TODO: async
            val imageDetails = docker.inspectImageCmd(imageName).exec()
            imageDetails.id !== null
        } catch (e: DockerException) {
            false
        }
    }

    private fun normalizeImageName(imageName: String): String {
        return if (imageName.contains(":")) {
            imageName
        } else {
            "$imageName:latest"
        }
    }

    private fun Map<String, String>.toKeyValueList() = this.map { "${it.key}=${it.value}" }
}