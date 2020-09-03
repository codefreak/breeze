package org.codefreak.breeze.util

import java.util.UUID

val UUID.shortHex
    get() = "%x".format(this.mostSignificantBits)