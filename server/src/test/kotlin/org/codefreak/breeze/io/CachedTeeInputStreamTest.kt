package org.codefreak.breeze.io

import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*
import java.io.PipedInputStream
import java.io.PipedOutputStream
import java.io.SequenceInputStream

internal class CachedTeeInputStreamTest {

    @Test
    fun split() {
        val input = PipedInputStream()
        val output = PipedOutputStream(input)
        val source = SequenceInputStream("He".byteInputStream(), input)

        val cacheTee = CachedTeeInputStream(source)

        // read cached data first
        assertEquals(cacheTee.read().toChar(), 'H')
        val split1 = cacheTee.split()
        assertEquals(split1.read().toChar(), 'H')
        assertEquals(cacheTee.read().toChar(), 'e')
        assertEquals(split1.read().toChar(), 'e')
        val split2 = cacheTee.split()
        assertEquals(split2.read().toChar(), 'H')
        assertEquals(split2.read().toChar(), 'e')

        // continue with streamed data
        output.write("l".toByteArray())
        assertEquals(cacheTee.read().toChar(), 'l')
        assertEquals(split1.read().toChar(), 'l')
        assertEquals(split2.read().toChar(), 'l')
    }
}