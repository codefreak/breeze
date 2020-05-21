package org.codefreak.breeze.shell.docker

import com.github.dockerjava.api.DockerClient
import com.github.dockerjava.api.async.ResultCallback
import com.github.dockerjava.api.exception.DockerException
import com.github.dockerjava.api.model.Bind
import com.github.dockerjava.api.model.HostConfig
import com.github.dockerjava.api.model.PullResponseItem
import com.github.dockerjava.api.model.Volume
import org.codefreak.breeze.BreezeConfiguration
import org.codefreak.breeze.shell.Process
import org.codefreak.breeze.shell.ProcessFactory
import org.slf4j.LoggerFactory

class DockerProcessFactory(
        private val config: BreezeConfiguration,
        private val docker: DockerClient
) : ProcessFactory {

    companion object {
        private val log: org.slf4j.Logger = LoggerFactory.getLogger(DockerProcessFactory::class.java)
    }

    private fun normalizeImageName(imageName: String): String {
        return if (imageName.contains(":")) {
            imageName
        } else {
            "$imageName:latest"
        }
    }

    override fun createProcess(cmd: Array<String>, workingDirectory: String?, env: Map<String, String>?): Process {
        val imageName = normalizeImageName(config.replDockerImage)

        // TODO: run non-blocking
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

        val volume = Volume(config.dockerWorkingdir)
        val container = docker.createContainerCmd(imageName)
                .withCmd(*cmd)
                .withTty(true)
                .withEnv(env?.map { "${it.key}=${it.value}" } ?: listOf())
                .withStdinOpen(true)
                .withAttachStdout(true)
                .withHostName(config.replHostname)
                .withWorkingDir(config.dockerWorkingdir)
                // todo: prepare proper named volumes and share them between docker instances
                .withVolumes(volume)
                .withHostConfig(HostConfig.newHostConfig().apply {
                    withBinds(Bind(workingDirectory, volume))
                })
                .exec()
        return DockerProcess(docker, container.id)
    }

    private fun imageExists(imageName: String): Boolean {
        return try {
            val imageDetails = docker.inspectImageCmd(imageName).exec()
            imageDetails.id !== null
        } catch (e: DockerException) {
            false
        }
    }
}