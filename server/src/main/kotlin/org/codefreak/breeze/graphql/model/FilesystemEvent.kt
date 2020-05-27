package org.codefreak.breeze.graphql.model

class FilesystemEvent(
        val path: String,
        val type: FileSystemEventType
)