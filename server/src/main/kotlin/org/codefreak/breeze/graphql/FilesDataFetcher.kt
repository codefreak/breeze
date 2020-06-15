package org.codefreak.breeze.graphql

import com.google.inject.Inject
import com.google.inject.Singleton
import graphql.schema.DataFetcher
import graphql.schema.DataFetchingEnvironment
import org.codefreak.breeze.graphql.model.FileSystemNode
import java.nio.file.Files
import kotlin.streams.toList

@Singleton
class FilesDataFetcher
@Inject constructor(
        private val filesService: FilesService
) : DataFetcher<List<FileSystemNode>> {
    override fun get(environment: DataFetchingEnvironment) =
            Files.walk(filesService.rootPath)
                    .map { it.toFile() }
                    .map(filesService::fileToApiObject)
                    .toList()
                    .filterNotNull()
}