package org.codefreak.breeze.io

import org.bouncycastle.util.io.TeeInputStream
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.io.InputStream
import java.io.PipedInputStream
import java.io.PipedOutputStream
import java.io.SequenceInputStream
import kotlin.concurrent.thread

class CachedTeeInputStream(private val source: InputStream, initialData: ByteArray? = null) : InputStream() {
    /**
     * TODO: limit cache to 1 MiB
     */
    val cache = ByteArrayOutputStream()
    private var draining = false

    init {
        // write initial data to cache
        initialData?.let {
            cache.write(it)
        }
    }

    /**
     * First output is always cache
     * Following outputs are PipedOutputStreams for all splits
     */
    private val dynamicTeeOutput = DynamicTeeOutputStream(cache)

    /**
     * Write read data to cache and all other created splits
     */
    private val inputTap = TeeInputStream(source, dynamicTeeOutput)

    /**
     * Warning: This must be flushed ASAP or read() on all splits will not be triggered
     */
    override fun read(): Int = inputTap.read()

    override fun available(): Int = source.available()

    override fun close() {
        source.close()
        dynamicTeeOutput.close()
        super.close()
    }

    /**
     * Get another readable output that contains cache and will continue with underlying InputStream
     * Warning: You should read the InputStream on a separate thread
     */
    fun split(): InputStream {
        val pipedInputStream = PipedInputStream()
        val pipedOutputStream = PipedOutputStream(pipedInputStream)
        dynamicTeeOutput.tee(pipedOutputStream)

        // first use cache and then use original source
        return SequenceInputStream(
                ByteArrayInputStream(cache.toByteArray()),
                pipedInputStream
        )
    }

    /**
     * Force draining of the underlying source so all splits get notified correctly
     */
    @Synchronized
    fun drain(): Thread {
        if (draining) {
            throw IllegalStateException("Tee is already being drained")
        }
        draining = true
        return thread(name = "breeze-tee-drain-${this.hashCode()}") {
            var alive = true
            while (alive) {
                try {
                    read()
                    dynamicTeeOutput.flush()
                } catch (e: IOException) {
                    alive = false
                    dynamicTeeOutput.close()
                }
            }
        }
    }
}