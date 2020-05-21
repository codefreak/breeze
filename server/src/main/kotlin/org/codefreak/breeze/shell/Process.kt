package org.codefreak.breeze.shell

import java.io.InputStream
import java.io.OutputStream

interface Process {
    val stdin: OutputStream
    val stdout: InputStream
    fun start()
    fun close(): Int
    fun write(data: String): Int {
        stdin.write(data.toByteArray())
        stdin.flush()
        return data.length
    }

    fun resize(cols: Int, rows: Int)
    fun join(): Int
}