package org.codefreak.breeze.graphql.model

import java.nio.file.Path
import java.nio.file.StandardWatchEventKinds
import java.nio.file.WatchEvent

enum class FileSystemEventType {
    CREATED, DELETED, MODIFIED, UNKNOWN;

    companion object {
        fun from(kind: WatchEvent.Kind<Path>) = when (kind) {
            StandardWatchEventKinds.ENTRY_CREATE -> CREATED
            StandardWatchEventKinds.ENTRY_DELETE -> DELETED
            StandardWatchEventKinds.ENTRY_MODIFY -> MODIFIED
            else -> UNKNOWN
        }
    }
}