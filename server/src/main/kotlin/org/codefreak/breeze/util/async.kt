package org.codefreak.breeze.util

import io.vertx.core.Future
import io.vertx.core.Promise
import io.vertx.core.Vertx
import java.util.concurrent.CompletableFuture

import java.util.concurrent.CompletionStage


inline fun <T> async(vertx: Vertx, crossinline blocking: () -> T): Future<T> {
    val promise = Promise.promise<T>()
    vertx.executeBlocking<T>({
        try {
            it.complete(blocking())
        } catch (e: Exception) {
            it.fail(e)
        }
    }, {
        if (it.succeeded()) {
            promise.complete(it.result())
        } else {
            promise.fail(it.cause())
        }

    })
    return promise.future()
}

// taken from VertX 4.0.0
fun <T> Future<T>.toCompletionStage(): CompletionStage<T> {
    val completableFuture: CompletableFuture<T> = CompletableFuture<T>()
    this.onComplete { ar ->
        if (ar.succeeded()) {
            completableFuture.complete(ar.result())
        } else {
            completableFuture.completeExceptionally(ar.cause())
        }
    }
    return completableFuture
}