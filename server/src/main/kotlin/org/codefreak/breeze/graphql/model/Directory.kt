package org.codefreak.breeze.graphql.model

import java.time.OffsetDateTime

data class Directory(
        override val path: String,
        override val modified: OffsetDateTime
) : FileSystemNode