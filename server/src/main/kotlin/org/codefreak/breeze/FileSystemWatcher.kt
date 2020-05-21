package org.codefreak.breeze

import io.reactivex.FlowableEmitter
import io.reactivex.FlowableOnSubscribe
import org.codefreak.breeze.graphql.model.FileSystemEventType

data class FilesystemEvent(val type: FileSystemEventType, val path: String)
typealias FilesystemEventListener = (event: FilesystemEvent) -> Unit

open class FileSystemWatcher : FlowableOnSubscribe<FilesystemEvent> {
    private val listeners: MutableSet<FilesystemEventListener> = mutableSetOf()

    fun trigger() {
    }

    override fun subscribe(emitter: FlowableEmitter<FilesystemEvent>) {
    }
}
