package org.codefreak.breeze.util

import java.nio.file.Paths
import java.util.UUID

/**
 * Return the path to a random tmp directory
 */
fun tmpdir(name: String = UUID.randomUUID().toString()) = Paths.get(System.getProperty("java.io.tmpdir"))
        .resolve(name)
        .toAbsolutePath()