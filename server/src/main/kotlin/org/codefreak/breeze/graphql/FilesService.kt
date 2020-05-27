package org.codefreak.breeze.graphql

import org.codefreak.breeze.BreezeConfiguration
import org.codefreak.breeze.graphql.model.Directory
import org.codefreak.breeze.graphql.model.File as FileAPIObject
import org.codefreak.breeze.graphql.model.FileSystemNode
import org.slf4j.LoggerFactory
import java.io.File
import java.nio.file.Path
import java.nio.file.Paths
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId

class FilesService(
        val config: BreezeConfiguration
) {
    val rootPath: Path = Paths.get(config.workingDirectory)

    companion object {
        private val log = LoggerFactory.getLogger(FilesService::class.java)
    }

    init {
        if (!rootPath.toFile().exists()) {
            rootPath.toFile().mkdirs()
        }
    }

    fun fileToApiObject(file: File): FileSystemNode? {
        if (!file.exists()) {
            return null
        }

        val modified = OffsetDateTime.ofInstant(
                Instant.ofEpochMilli(file.lastModified()),
                ZoneId.systemDefault()
        )
        return if (file.isDirectory) {
            Directory(relPath(file), modified)
        } else {
            FileAPIObject(relPath(file), modified, file.length(), file.readText())
        }
    }

    fun writeFile(path: Path, content: String): File {
        val file = getFile(path)
        if (!file.exists()) {
            file.createNewFile()
        } else if (file.isDirectory) {
            throw RuntimeException("Cannot write content to directory")
        }
        if (log.isDebugEnabled) {
            log.debug("Updating contents of $path")
        }
        file.writeText(content)
        return file
    }

    fun getFile(path: Path): File = Paths.get(config.workingDirectory, path.toString()).toFile()

    private fun relPath(file: File): String {
        return rootPath.relativize(file.toPath()).toString()
    }
}