package org.codefreak.breeze

import com.beust.jcommander.Parameter
import com.beust.jcommander.Parameters
import org.codefreak.breeze.util.getGid
import org.codefreak.breeze.util.getSurroundingContainerId
import org.codefreak.breeze.util.getUid
import org.codefreak.breeze.util.splitCommand

/**
 * Make sure the CLI option naming does not collide with Vertx
 */
@Parameters(separators = " =")
class BreezeConfiguration {
    /**
     * This is unused but required because arguments will also contain VertX
     * specific parameters
     */
    @Parameter
    var arguments: List<String> = arrayListOf()

    @Parameter(names = ["--http-port"])
    var httpPort: Int = 3000

    @Parameter(names = ["--instance-id"])
    var instanceId: String = java.util.UUID.randomUUID().toString()

    @Parameter(names = ["--hostname"])
    var workspaceHostname = "breeze"

    @Parameter(names = ["--image"])
    var workspaceDockerImage = "python:rc"

    @Parameter(names = ["--workspace-path"])
    var workspaceCodePath = "/home/coder/project"

    @Parameter(names = ["--workdir"])
    var dockerWorkingDir = workspaceCodePath

    @Parameter(names = ["--main-file"])
    var mainFile: String? = null

    @Parameter(names = ["--repl-cmd"])
    var workspaceReplCmdString = "/usr/bin/env bash --noprofile --norc -i"

    val workspaceReplCmd: Array<String> get() = splitCommand(workspaceReplCmdString)

    var environment: Map<String, String> = mapOf(
            "TERM" to "xterm",
            "PS1" to "\\[\\e[32m\\]\\W\\[\\e[m\\] \\[\\e[34m\\]\\\\\$\\[\\e[m\\] "
    )

    // TODO: substitution of commands? or pass to /bin/bash -c to parse environment variables
    @Parameter(names = ["--run-cmd"])
    var runCmdString = "/usr/bin/env echo 'There is no run command specified. Please configure it with --run-cmd'"

    val runCmd: Array<String> get() = splitCommand(runCmdString)

    @Parameter(names = ["--container-id"])
    var containerId = getSurroundingContainerId()

    @Parameter(names = ["--uid"])
    var dockerUid = getUid()

    @Parameter(names = ["--gid"])
    var dockerGid = getGid()

    @Parameter(names = ["--user-name"])
    var dockerUserName = "coder"

    @Parameter(names = ["--group-name"])
    var dockerGroupName = "coder"

    @Parameter(names = ["--home"])
    var homeDir = "/home/$dockerUserName"

    @Parameter(names = ["--remove-on-exit"])
    var removeOnExit = containerId == null

    fun buildProvisionScript() = """
        mkdir -p "$homeDir"
        chmod 0700 "$homeDir"
        chown "$dockerUid":"$dockerGid" "$homeDir"
        echo "$dockerGroupName:x:$dockerGid:" >> /etc/group
        echo "${dockerUserName}:x:$dockerUid:$dockerGid:,,,:$homeDir:/bin/bash" >> /etc/passwd
    """.trimIndent()
}