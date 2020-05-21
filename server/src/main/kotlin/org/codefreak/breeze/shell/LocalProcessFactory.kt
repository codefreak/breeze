package org.codefreak.breeze.shell

import com.pty4j.PtyProcess
import com.pty4j.PtyProcessBuilder
import com.pty4j.WinSize
import java.io.InputStream
import java.io.OutputStream

class LocalProcessFactory : ProcessFactory {
    class LocalPtyProcess(private val ptyProcess: PtyProcess) : Process {
        override val stdin: OutputStream = ptyProcess.outputStream
        override val stdout: InputStream = ptyProcess.inputStream
        override fun start() {
            // pty processes are already started
        }

        override fun join() = ptyProcess.waitFor()

        override fun close(): Int {
            ptyProcess.destroy()
            return join()
        }

        override fun resize(cols: Int, rows: Int) {
            ptyProcess.winSize = WinSize(cols, rows)
        }
    }

    override fun createProcess(cmd: Array<String>, workingDirectory: String?, env: Map<String, String>?): Process {
        val process = PtyProcessBuilder()
                .setCommand(cmd)
                .setEnvironment(env)
                .setDirectory(workingDirectory)
                .start()
        return LocalPtyProcess(process)
    }
}