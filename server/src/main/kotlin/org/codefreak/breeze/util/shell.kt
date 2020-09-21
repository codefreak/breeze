package org.codefreak.breeze.util

import com.google.common.escape.Escaper
import com.google.common.escape.Escapers


private val shellEscape: Escaper = Escapers.builder().addEscape('\'', "'\"'\"'").build()

fun escapeArg(str: String): String = shellEscape.escape(str)
