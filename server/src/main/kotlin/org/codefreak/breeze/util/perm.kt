package org.codefreak.breeze.util

import com.sun.security.auth.module.UnixSystem

// TODO: Make this work with Docker Desktop (Windows, MacOS)
private val nx = UnixSystem()

fun getUid() = nx.uid
fun getGid() = nx.gid