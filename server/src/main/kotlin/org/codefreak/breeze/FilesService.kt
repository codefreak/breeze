package org.codefreak.breeze

import org.codefreak.breeze.graphql.model.Directory
import org.codefreak.breeze.graphql.model.FileSystemNode
import org.slf4j.LoggerFactory
import java.io.File
import java.nio.file.Path
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneId
import org.codefreak.breeze.graphql.model.File as FileAPIObject

class FilesService(val rootPath: Path) {

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
        val file = createFile(path)
        if (log.isDebugEnabled) {
            log.debug("Writing to $path")
        }
        file.writeText(content)
        return file
    }

    fun createFile(path: Path): File {
        return touch(path).also {
            if (it.isDirectory) {
                throw RuntimeException("Cannot write content to directory")
            }
        }
    }

    fun touch(path: Path): File {
        val file = pathToFile(path)
        if (!file.exists()) {
            file.createNewFile()
        }
        return file
    }

    fun mkdirs(path: Path): File {
        val file = pathToFile(path)
        if (!file.exists()) {
            file.mkdirs()
        } else if (!file.isDirectory) {
            throw RuntimeException("$path already exists and is not a directory")
        }
        return file
    }

    fun pathToFile(path: Path) = resolvePath(path).toFile()

    private fun resolvePath(path: Path): Path {
        return if (path.startsWith(rootPath)) {
            path
        } else {
            rootPath.resolve(path.toString().trimStart('/'))
        }
    }

    fun relPath(file: File) = relPath(file.toPath())

    fun relPath(path: Path): String {
        return rootPath.relativize(path).toString()
    }

    fun rename(oldPath: Path, newPath: Path): File {
        val file = pathToFile(oldPath)
        val newFile = pathToFile(newPath)
        if(!file.exists()) {
            throw IllegalArgumentException("File ${oldPath.fileName} does not exist")
        }
        file.renameTo(newFile)
        return newFile
    }

    fun unlink(path: Path): Boolean {
        val file = pathToFile(path)
        return when {
            !file.exists() -> true
            file.isDirectory -> file.deleteRecursively()
            else -> file.delete()
        }
    }
}