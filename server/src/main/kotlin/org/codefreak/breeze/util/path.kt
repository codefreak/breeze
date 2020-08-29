package org.codefreak.breeze.util

import java.nio.file.Paths
import java.util.UUID

fun breezeWorkdir() = Paths.get(System.getProperty("user.dir")).resolve(".breeze")

/**
 * Return the path to a random tmp directory
 */
fun workspacePath(name: String = UUID.randomUUID().toString()) = breezeWorkdir()
        .resolve("workspace")
        .resolve(name)
        .toAbsolutePath()