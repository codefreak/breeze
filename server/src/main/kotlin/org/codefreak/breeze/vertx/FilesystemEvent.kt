package org.codefreak.breeze.vertx

import java.nio.file.Path
import java.nio.file.WatchEvent

class FilesystemEvent(
        val path: Path,
        val kind: WatchEvent.Kind<*>
) {
    companion object {
        const val ADDRESS = "org.codefreak.breeze.filesystem.event"
    }
}