package org.codefreak.breeze.util

import com.beust.jcommander.IValueValidator
import com.beust.jcommander.ParameterException
import java.io.File
import java.io.IOException
import java.util.regex.Pattern

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

fun splitCommand(command: String): Array<String> {
    // from https://stackoverflow.com/a/366532/5519485
    val matchList = ArrayList<String>()
    val regex = Pattern.compile("[^\\s\"']+|\"([^\"]*)\"|'([^']*)'")
    val regexMatcher = regex.matcher(command)
    while (regexMatcher.find()) {
        when {
            regexMatcher.group(1) != null -> // Add double-quoted string without the quotes
                matchList.add(regexMatcher.group(1))
            regexMatcher.group(2) != null -> // Add single-quoted string without the quotes
                matchList.add(regexMatcher.group(2))
            else -> // Add unquoted word
                matchList.add(regexMatcher.group())
        }
    }
    return matchList.toArray(arrayOf())
}

private val sizeRegex = Regex("(\\d+)([bkmg]?)", RegexOption.IGNORE_CASE)
fun humanReadableSizeToBytes(input: String): Long {
    val matches = sizeRegex.matchEntire(input)?.groupValues
    if (matches == null) {
        throw IllegalArgumentException("Size $input does not match a number with an optional b/k/m/g suffix.")
    }
    val multiplier = matches[1].toLong()
    return when (matches[2].toLowerCase()) {
        "k" -> multiplier * 1024
        "m" -> multiplier * 1024 * 1024
        "g" -> multiplier * 1024 * 1024 * 1024
        else -> multiplier
    }
}

class MemoryValidator : IValueValidator<String> {
    override fun validate(name: String, value: String) {
        try {
            humanReadableSizeToBytes(value)
        } catch (e: IllegalArgumentException) {
            throw ParameterException(
                    "Please specify the value as a number (in bytes) with an optional b/k/m/g suffix for kilobytes/megabytes/gigabytes, e.g. 128m for 128 megabytes"
            )
        }
    }
}