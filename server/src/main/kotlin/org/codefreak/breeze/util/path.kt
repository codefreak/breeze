package org.codefreak.breeze.util

import java.nio.file.Paths
import java.util.UUID

/**
 * Return the path to a random tmp directory
 */
fun tmpdir() = Paths.get(System.getProperty("java.io.tmpdir"))
        .resolve(UUID.randomUUID().toString())
        .toAbsolutePath()