package org.codefreak.breeze.vertx

import com.google.inject.Inject
import com.google.inject.Singleton
import io.vertx.core.Vertx
import org.codefreak.breeze.workspace.Workspace
import org.slf4j.LoggerFactory
import java.io.FileFilter
import java.nio.file.FileSystems
import java.nio.file.Path
import java.nio.file.StandardWatchEventKinds
import java.nio.file.WatchEvent

@Singleton
class FilesystemWatcher
@Inject constructor(
        private val vertx: Vertx,
        workspace: Workspace
) {
    companion object {
        private val log = LoggerFactory.getLogger(FilesystemWatcher::class.java)
        private val directoryFilter = FileFilter { file -> file.isDirectory }

        private val watchEventKinds = arrayOf(
                StandardWatchEventKinds.ENTRY_CREATE,
                StandardWatchEventKinds.ENTRY_MODIFY,
                StandardWatchEventKinds.ENTRY_DELETE
        )
    }

    private var pollRate = 100L
    private val root = workspace.path
    private var watching = false
    private val watchService = FileSystems.getDefault().newWatchService()
    private val eventBus = vertx.eventBus()

    fun watch() {
        if (watching) {
            throw RuntimeException("Already watching $root for changes")
        }

        watching = true
        watchPathRecursively(root)
        vertx.setPeriodic(pollRate) {
            val happened = watchService.poll() ?: return@setPeriodic

            val parent = happened.watchable() as Path
            happened.pollEvents().forEach { event ->
                val path = event.context() as Path
                val kind = event.kind()
                val absolute = parent.resolve(path)

                // new node might be a directory. Try to watch it
                if (kind == StandardWatchEventKinds.ENTRY_CREATE) {
                    watchPathRecursively(absolute)
                }

                broadcastEvent(absolute, kind)
            }
            happened.reset()
        }
    }

    private fun watchPathRecursively(path: Path) {
        val file = path.toFile()
        if (file.isDirectory) {
            if (log.isDebugEnabled) {
                log.debug("Watching $path for changes")
            }
            path.register(watchService, watchEventKinds)
            file.listFiles(directoryFilter)?.forEach {
                watchPathRecursively(it.toPath())
            }
        }
    }

    private fun broadcastEvent(path: Path, eventKind: WatchEvent.Kind<*>) {
        if (log.isDebugEnabled) {
            log.debug("Broadcasting $eventKind for $path")
        }
        val event = FilesystemEvent(path, eventKind)
        eventBus.send(FilesystemEvent.ADDRESS, event)
    }
}