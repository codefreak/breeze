package org.codefreak.breeze.docker

import com.github.dockerjava.api.DockerClient
import com.github.dockerjava.core.DefaultDockerClientConfig
import com.github.dockerjava.core.DockerClientBuilder
import com.github.dockerjava.core.DockerClientConfig
import com.github.dockerjava.netty.NettyDockerCmdExecFactory

class DockerFactory {
    fun docker(): DockerClient {
        val config: DockerClientConfig = DefaultDockerClientConfig.createDefaultConfigBuilder()
                .build()
        return DockerClientBuilder.getInstance(config).withDockerCmdExecFactory(
                // OkHttp implementation causes 100% CPU usage currently
                NettyDockerCmdExecFactory()
        ).build()
    }
}