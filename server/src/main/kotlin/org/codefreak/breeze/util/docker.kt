package org.codefreak.breeze.util

import java.io.File
import java.io.IOException

/**
 * Stolen from https://stackoverflow.com/a/20012536/1526257
 */
const val CGROUP_FILE = "/proc/1/cgroup"

/**
 * If the process is running inside a container returns the container id as string.
 * In all other cases including IO failures it returns NULL.
 */
fun getSurroundingContainerId(): String? = try {
    File(CGROUP_FILE).useLines { sequence ->
        val line = sequence.find { it.contains("/docker/") }
        return line?.let {
            Regex("^(?:[^:]+:){2}/docker/([a-f0-9]+)\$").find(it)?.groupValues?.last()
        }
    }
} catch (e: IOException) {
    null
}