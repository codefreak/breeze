package org.codefreak.breeze.graphql.model

import java.time.OffsetDateTime

interface FileSystemNode {
    val path: String
    val modified: OffsetDateTime
}