package org.codefreak.breeze.util

import io.vertx.core.Future
import io.vertx.core.Promise
import io.vertx.core.Vertx

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