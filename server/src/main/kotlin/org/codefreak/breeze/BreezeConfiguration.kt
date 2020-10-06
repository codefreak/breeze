package org.codefreak.breeze

import com.beust.jcommander.Parameter
import com.beust.jcommander.Parameters
import org.codefreak.breeze.util.getGid
import org.codefreak.breeze.util.getSurroundingContainerId
import org.codefreak.breeze.util.getUid

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

    @Parameter(names = ["--instance-id"])
    var instanceId: String = java.util.UUID.randomUUID().toString()

    @Parameter(names = ["--hostname"])
    var workspaceHostname = "breeze"

    @Parameter(names = ["--image"])
    var workspaceDockerImage = "python:3.8.2-buster"

    @Parameter(names = ["--workspace-path"])
    var workspaceCodePath = "/workspace"

    @Parameter(names = ["--workdir"])
    var dockerWorkingDir = workspaceCodePath

    @Parameter(names = ["--main-file"])
    var mainFile = "main.py"

    @Parameter(names = ["--main-file-content"])
    var mainFileContent = """
        def main():
            print("Hey, please enter your name: ", end = '')
            name=input()
            print("\nWelcome to Breeze, %s!\n" % (name))
        
        if __name__ == '__main__':
            main()
    """.trimIndent()

    @Parameter(names = ["--repl-cmd"])
    var workspaceReplCmd = arrayOf("/usr/bin/env", "bash", "--noprofile", "--norc", "-i")

    @Parameter(names = ["--env-map"])
    var environment: Map<String, String> = mapOf(
            "TERM" to "xterm",
            "PS1" to "\\[\\e[32m\\]\\W\\[\\e[m\\] \\[\\e[34m\\]\\\\\$\\[\\e[m\\] "
    )

    // TODO: substitution of commands? or pass to /bin/bash -c to parse environment variables
    @Parameter(names = ["--run-cmd"])
    var runCmd = arrayOf("/usr/bin/env", "python", mainFile)

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
    var dockerHomeDir = "/home/$dockerUserName"

    fun buildProvisionScript() = """
        mkdir -p "$dockerHomeDir"
        chmod 0700 "$dockerHomeDir"
        chown "$dockerUid":"$dockerGid" "$dockerHomeDir"
        echo "$dockerGroupName:x:$dockerGid:" >> /etc/group
        echo "${dockerUserName}:x:$dockerUid:$dockerGid:,,,:$dockerHomeDir:/bin/bash" >> /etc/passwd
    """.trimIndent()
}