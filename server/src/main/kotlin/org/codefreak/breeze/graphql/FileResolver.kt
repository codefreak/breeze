package org.codefreak.breeze.graphql

import com.google.inject.Inject
import com.google.inject.Singleton
import graphql.kickstart.tools.GraphQLMutationResolver
import graphql.kickstart.tools.GraphQLQueryResolver
import graphql.kickstart.tools.GraphQLSubscriptionResolver
import io.reactivex.BackpressureStrategy
import io.reactivex.Flowable
import io.vertx.core.Vertx
import org.codefreak.breeze.graphql.model.Directory
import org.codefreak.breeze.graphql.model.File
import org.codefreak.breeze.graphql.model.FileSystemEventType
import org.codefreak.breeze.graphql.model.FileSystemNode
import org.codefreak.breeze.vertx.FilesystemEvent
import org.reactivestreams.Publisher
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import java.nio.file.Files
import java.nio.file.Paths
import kotlin.streams.toList
import org.codefreak.breeze.graphql.model.FilesystemEvent as FilesystemEventModel

@Singleton
class FileResolver
@Inject constructor(
        vertx: Vertx,
        private val filesService: FilesService
) : GraphQLQueryResolver, GraphQLMutationResolver, GraphQLSubscriptionResolver {
    companion object {
        private val log: Logger = LoggerFactory.getLogger(FileResolver::class.java)
    }

    private val eventBus = vertx.eventBus()

    fun file(path: String): FileSystemNode? {
        return filesService.fileToApiObject(
                filesService.pathToFile(
                        Paths.get(path)
                )
        )
    }

    fun files(): List<FileSystemNode> {
        return Files.walk(filesService.rootPath)
                .map { it.toFile() }
                .map(filesService::fileToApiObject)
                .toList()
                .filterNotNull()
    }

    fun writeFile(path: String, contents: String): File {
        return filesService.fileToApiObject(
                filesService.writeFile(Paths.get(path), contents)
        ) as File
    }

    fun createFile(path: String): File {
        return filesService.fileToApiObject(
                filesService.createFile(Paths.get(path))
        ) as File
    }

    fun createDirectory(path: String): Directory {
        return filesService.fileToApiObject(
                filesService.mkdirs(Paths.get(path))
        ) as Directory
    }

    fun fileChange(): Publisher<FilesystemEventModel> {
        log.info("Listening on file changes")
        return Flowable.create<FilesystemEventModel>({ emitter ->
            val consumer = eventBus.consumer<FilesystemEvent>(FilesystemEvent.ADDRESS) { message ->
                val event = message.body()
                emitter.onNext(FilesystemEventModel(
                        filesService.relPath(event.path),
                        FileSystemEventType.from(event.kind)
                ))
            }

            emitter.setCancellable {
                log.info("STOP listening on file changes")
                consumer.unregister()
            }
        }, BackpressureStrategy.BUFFER)
    }
}