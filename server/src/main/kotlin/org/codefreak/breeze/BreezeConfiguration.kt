package org.codefreak.breeze

import java.nio.file.Paths

class BreezeConfiguration {
    var workingDirectory: String = Paths.get(System.getProperty("java.io.tmpdir")).resolve("breeze-workspace")
            .toAbsolutePath()
            .toString()

    var replHostname = "breeze"
    var replDockerImage = "python:3.8.2-buster"
    var dockerWorkingdir = "/code"
    var mainFile = "main.py"
    var mainFileContent = """
        def main():
            print("Hey, please enter your name: ", end = '')
            name=input()
            print("\nWelcome to Breeze, %s!\n" % (name))
        
        if __name__ == '__main__':
            main()
    """.trimIndent()
    var replCmd = arrayOf("/usr/bin/env", "python", "-i")

    // TODO: substitution of commands? or pass to /bin/bash -c to parse environment variables
    var runCmd = arrayOf("/usr/bin/env", "python", mainFile)
}