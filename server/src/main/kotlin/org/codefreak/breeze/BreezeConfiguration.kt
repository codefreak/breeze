package org.codefreak.breeze

import com.google.inject.Singleton
import org.codefreak.breeze.util.getSurroundingContainerId

@Singleton
class BreezeConfiguration {
    val instanceId: String = java.util.UUID.randomUUID().toString()
    var workspaceHostname = "breeze"
    var workspaceDockerImage = "python:3.8.2-buster"
    var workspaceCodePath = "/workspace"
    var dockerWorkingdir = workspaceCodePath
    var mainFile = "main.py"
    var mainFileContent = """
        def main():
            print("Hey, please enter your name: ", end = '')
            name=input()
            print("\nWelcome to Breeze, %s!\n" % (name))
        
        if __name__ == '__main__':
            main()
    """.trimIndent()
    var workspaceReplCmd = arrayOf("/usr/bin/env", "bash", "-i")
    val defaultEnv: Map<String, String> = mapOf(
            "TERM" to "xterm"
    )

    // TODO: substitution of commands? or pass to /bin/bash -c to parse environment variables
    var runCmd = arrayOf("/usr/bin/env", "python", mainFile)
    var containerId = getSurroundingContainerId()
}