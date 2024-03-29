package org.codefreak.breeze.docker

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
import org.codefreak.breeze.util.async
import org.codefreak.breeze.util.getSurroundingContainerId
import org.codefreak.breeze.util.workspacePath
import org.codefreak.breeze.workspace.Workspace
import org.slf4j.LoggerFactory
import java.nio.file.Paths

@Singleton
class DockerWorkspace
@Inject constructor(
        vertx: Vertx,
        private val config: BreezeConfiguration,
        private val docker: DockerClient
) : Workspace(
        vertx,
        localPath = if (getSurroundingContainerId() == null) workspacePath(config.instanceId) else Paths.get(config.workspaceCodePath),
        remove = true
) {
    companion object {
        private val log: org.slf4j.Logger = LoggerFactory.getLogger(DockerWorkspace::class.java)
    }

    private var containerId: String? = null

    private val containerName = "breeze-ws-${config.instanceId}"

    override fun doCreate(cmd: Array<String>, env: Map<String, String>?): Future<Unit> {
        // use existing container
        if (containerId !== null) {
            return Future.succeededFuture<Unit>()
        }

        val promise = Promise.promise<Unit>()
        // create workspace directory
        vertx.fileSystem().mkdirs(localPath.toString()) {
            if (it.succeeded()) {
                promise.complete()
            } else {
                promise.fail(it.cause())
            }
        }

        // try to use existing container
        // otherwise pull docker image and create new container
        val imageName = normalizeImageName(config.workspaceDockerImage)
        return promise.future()
                .compose {
                    getContainerId()
                }
                .compose(
                        {
                            containerId = it
                            log.info("Using existing workspace container with id $it")
                            Future.succeededFuture<Unit>()
                        },
                        {
                            pullDockerImage(imageName).compose {
                                createContainer(imageName, cmd, env)
                            }.compose {
                                containerId = it
                                log.info("Created workspace container $it")
                                Future.succeededFuture<Unit>()
                            }
                        }
                )
    }

    override fun doStart(): Future<out Process> {
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

    override fun doExec(cmd: Array<String>, env: Map<String, String>?, root: Boolean): Future<Process> = withContainerId { id ->
        return createExec(id, cmd, env, root).map { exec ->
            log.debug("Created exec instance with '${cmd.joinToString(" ")}' on container $id")
            DockerExecProcess(docker, exec.id)
        }
    }

    private inline fun <T> withContainerId(block: (containerId: String) -> T): T {
        return block(containerId ?: throw RuntimeException("No container id"))
    }

    private fun getContainerId(): Future<String> = async(vertx) {
        docker.inspectContainerCmd(containerName).exec().id
    }

    private fun createContainer(imageName: String, cmd: Array<String>, env: Map<String, String>?) = async(vertx) {
        val volume = Volume(config.dockerWorkingDir)
        val workspaceSource = getWorkspaceDirBindSource()
        log.info("Mounting $workspaceSource to ${config.dockerWorkingDir}")
        val labels: MutableMap<String, String> = mutableMapOf(
                "org.codefreak.breeze.ws" to config.instanceId
        )
        config.containerId?.let { labels["org.codefreak.breeze.depends-on"] = it }
        val container = docker.createContainerCmd(imageName)
                .withName(containerName)
                .withCmd(*cmd)
                .withTty(true)
                .withEnv(env?.toKeyValueList() ?: listOf())
                .withStdinOpen(true)
                .withAttachStdout(true)
                .withHostName(config.workspaceHostname)
                .withWorkingDir(config.dockerWorkingDir)
                .withVolumes(volume)
                .withUser("${config.dockerUid}:${config.dockerGid}")
                .withLabels(labels)
                .withNetworkDisabled(!config.enableNetwork)
                .withEntrypoint(mutableListOf())
                .withHostConfig(
                        HostConfig.newHostConfig()
                                .withMemory(config.memoryInBytes)
                                .withCpuCount(config.cpuCount)
                                .withBinds(
                                        Bind(workspaceSource, volume)
                                )
                )
                .exec()
        container.id
    }

    private fun pullDockerImage(imageName: String) = async(vertx) {
        if (!imageExists(imageName)) {
            log.info("Pulling image $imageName, this may take some time...")
            val callback = object : ResultCallback.Adapter<PullResponseItem>() {
                override fun onNext(response: PullResponseItem) {
                    if(response.progress != null) {
                        log.debug("${response.status} layer ${response.id}: ${response.progress}")
                    }
                }
            }
            docker.pullImageCmd(imageName).exec(callback)
            callback.awaitCompletion()
            log.info("Image $imageName pulled")
        } else {
            log.info("Image $imageName is already present on docker daemon")
        }
    }

    private fun stopContainer(containerId: String) = async<Unit>(vertx) {
        docker.killContainerCmd(containerId).exec()
    }

    private fun removeContainer(containerId: String) = async<Unit>(vertx) {
        docker.removeContainerCmd(containerId).exec()
    }

    private fun createExec(containerId: String, cmd: Array<String>, env: Map<String, String>?, root: Boolean) = async(vertx) {
        docker.execCreateCmd(containerId)
                .withCmd(*cmd)
                .withWorkingDir(config.dockerWorkingDir)
                .withTty(true)
                .withAttachStdout(true)
                .withAttachStdin(true)
                .withEnv(env?.toKeyValueList() ?: listOf())
                .apply {
                    if (root) {
                        withUser("root:root")
                    }
                }
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

    /**
     * When mounting the /workspace volume there are three possibilities:
     * 1. We are running outside of Docker --> bind the temporary dir from the host
     * 2. We are running inside Docker and /workspace is a named volume --> bind the named volume
     * 3. We are running inside Docker and /workspace is a bind-mount from the host --> also bind the host dir
     */
    private fun getWorkspaceDirBindSource(): String {
        val ownContainerId = config.containerId
        if (ownContainerId == null) {
            // create simple bind-mount of the tmp dir in case we are running Breeze outside of a container
            return localPath.toString()
        } else {
            // mount code volume containing all files from this container to the workspace
            val containerInfo = docker.inspectContainerCmd(ownContainerId).exec()
            val workspaceMount = containerInfo.mounts?.find { it.destination?.path == config.workspaceCodePath }
                    ?: throw RuntimeException("This container has no mount at ${config.workspaceCodePath}")

            // either use the volume name or the absolute path as volume source
            workspaceMount.name?.let {
                return it
            }
            workspaceMount.source?.let {
                return it
            }
            throw RuntimeException("Could not determine the mount source for ${config.workspaceCodePath}")
        }
    }

    private fun Map<String, String>.toKeyValueList() = this.map { "${it.key}=${it.value}" }
}