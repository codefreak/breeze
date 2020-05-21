package org.codefreak.breeze.shell

interface ProcessFactory {
    fun createProcess(cmd: Array<String>,
                      workingDirectory: String? = null,
                      env: Map<String, String>? = null): Process
}