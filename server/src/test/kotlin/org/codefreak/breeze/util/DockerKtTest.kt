package org.codefreak.breeze.util

import org.junit.jupiter.api.Test

import org.junit.jupiter.api.Assertions.*

internal class DockerKtTest {
    @Test
    fun testHumanReadableSizeToBytesLegal() {
        assertEquals(0L, humanReadableSizeToBytes("0"))
        assertEquals(1L, humanReadableSizeToBytes("1"))
        assertEquals(1024L, humanReadableSizeToBytes("1024"))
        assertEquals(1024L, humanReadableSizeToBytes("1k"))
        assertEquals(2048L, humanReadableSizeToBytes("2k"))
        assertEquals(1048576L, humanReadableSizeToBytes("1m"))
        assertEquals(1073741824L, humanReadableSizeToBytes("1g"))
    }

    @Test
    fun testHumanReadableSizeToBytesIgnoresCase() {
        assertEquals(1024L, humanReadableSizeToBytes("1K"))
    }

    @Test
    fun testHumanReadableSizeToBytesIllegalInput() {
        // illegal empty
        assertThrows(IllegalArgumentException::class.java) {
            humanReadableSizeToBytes("")
        }
        // illegal negative number
        assertThrows(IllegalArgumentException::class.java) {
            humanReadableSizeToBytes("-1")
        }
        // illegal floating point
        assertThrows(IllegalArgumentException::class.java) {
            humanReadableSizeToBytes("1.23")
        }
        // valid number, illegal suffix
        assertThrows(IllegalArgumentException::class.java) {
            humanReadableSizeToBytes("2n")
        }
        // no number, valid suffix
        assertThrows(IllegalArgumentException::class.java) {
            humanReadableSizeToBytes("b")
        }
    }
}