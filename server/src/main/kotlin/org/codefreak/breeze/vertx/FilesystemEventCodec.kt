package org.codefreak.breeze.vertx

import com.google.inject.Singleton
import io.vertx.core.buffer.Buffer
import io.vertx.core.eventbus.MessageCodec

@Singleton
class FilesystemEventCodec : MessageCodec<FilesystemEvent, FilesystemEvent> {
    override fun decodeFromWire(pos: Int, buffer: Buffer): FilesystemEvent {
        throw RuntimeException("Cannot send FilesystemEvent across the wire yet")
    }

    override fun encodeToWire(buffer: Buffer, s: FilesystemEvent) {
        throw RuntimeException("Cannot send FilesystemEvent across the wire yet")
    }

    override fun transform(s: FilesystemEvent): FilesystemEvent = s
    override fun name(): String = "FilesystemEventCodec"
    override fun systemCodecID(): Byte = -1
}