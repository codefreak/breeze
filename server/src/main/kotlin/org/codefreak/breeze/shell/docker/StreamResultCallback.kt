package org.codefreak.breeze.shell.docker

import com.github.dockerjava.api.async.ResultCallback
import com.github.dockerjava.api.model.Frame
import java.io.OutputStream

class StreamResultCallback(private val writer: OutputStream) : ResultCallback.Adapter<Frame>() {
    override fun onNext(frame: Frame) {
        writer.write(frame.payload)
        writer.flush()
    }
}