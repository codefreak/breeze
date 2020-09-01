package org.codefreak.breeze.io

import java.io.IOException
import java.io.OutputStream

/**
 * TeeOutputStream that works with dynamic number of sources
 * Not sure if the list iteration is fast enough
 * We could use a nested version of Apache's TeeOutputStream otherwise
 *
 * If any operation on the destination fails it will be removed from the list
 */
class DynamicTeeOutputStream(vararg initialDestinations: OutputStream) : OutputStream() {
    private val destinations: MutableSet<OutputStream> = mutableSetOf(*initialDestinations)

    /**
     * Add another output to write to
     */
    fun tee(outputStream: OutputStream) = destinations.add(outputStream)

    override fun write(p0: Int) = destinations.forEachRemovingExceptional { it.write(p0) }
    override fun close() = destinations.forEachRemovingExceptional(OutputStream::close)
    override fun flush() = destinations.forEachRemovingExceptional(OutputStream::flush)

    /**
     * Call operation on each element in set an remove all that are throwing exceptions
     */
    private fun MutableSet<OutputStream>.forEachRemovingExceptional(block: (outputStream: OutputStream) -> Unit) {
        val invalid: MutableSet<OutputStream> = mutableSetOf()
        this.forEach {
            try {
                block(it)
            } catch (e: IOException) {
                // remove all invalid destinations after all data has been written
                invalid.add(it)
            }
        }
        this.removeAll(invalid)
    }
}