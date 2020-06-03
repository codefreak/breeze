package org.codefreak.breeze.shell.docker

import com.github.dockerjava.api.async.ResultCallback
import com.github.dockerjava.api.model.Frame
import org.slf4j.LoggerFactory
import java.io.IOException
import java.io.OutputStream

class StreamResultCallback(
        private val writer: OutputStream,
        private val onCompleteCallback: () -> Unit = {}
) : ResultCallback.Adapter<Frame>() {
    companion object {
        private val log: org.slf4j.Logger = LoggerFactory.getLogger(StreamResultCallback::class.java)
    }

    override fun onNext(frame: Frame) {
        try {
            writer.write(frame.payload)
            writer.flush()
        } catch (e: IOException) {
            log.warn("Cannot write incoming frame:", e)
        }
    }

    override fun onComplete() {
        super.onComplete()
        onCompleteCallback()
    }
}