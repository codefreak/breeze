package org.codefreak.breeze.graphql

import graphql.schema.DataFetcher
import graphql.schema.DataFetchingEnvironment
import org.codefreak.breeze.graphql.model.FileSystemNode
import java.nio.file.Files
import kotlin.streams.toList

class FilesDataFetcher(
        val filesService: FilesService
) : DataFetcher<List<FileSystemNode>> {
    override fun get(environment: DataFetchingEnvironment) =
            Files.walk(filesService.rootPath)
                    .map { it.toFile() }
                    .map(filesService::fileToApiObject)
                    .toList()
                    .filterNotNull()
}