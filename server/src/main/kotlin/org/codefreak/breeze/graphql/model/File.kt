package org.codefreak.breeze.graphql.model

import java.time.OffsetDateTime

data class File(
        override val path: String,
        override val modified: OffsetDateTime,
        val size: Long,
        val contents: String
) : FileSystemNode