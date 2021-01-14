package org.codefreak.breeze.graphql

import com.google.inject.Inject
import com.google.inject.Singleton
import graphql.kickstart.tools.GraphQLSubscriptionResolver
import io.reactivex.BackpressureStrategy
import io.reactivex.Flowable
import org.codefreak.breeze.workspace.Workspace
import org.codefreak.breeze.workspace.WorkspaceStatusListener
import org.reactivestreams.Publisher
import org.slf4j.Logger
import org.slf4j.LoggerFactory

@Singleton
class WorkspaceResolver
@Inject constructor(
        private val workspace: Workspace
) : GraphQLSubscriptionResolver {
    companion object {
        private val log: Logger = LoggerFactory.getLogger(WorkspaceResolver::class.java)
    }

    fun workspaceStatus(): Publisher<WorkspaceStatus> {
        return Flowable.create<WorkspaceStatus>({ emitter ->
            val listener: WorkspaceStatusListener = { _, new ->
                emitter.onNext(WorkspaceStatus(new))
            }
            val removeListener = workspace.addStatusListener(listener)
            emitter.setCancellable {
                removeListener()
            }
            // initially emit current status
            emitter.onNext(WorkspaceStatus(workspace.status))
        }, BackpressureStrategy.BUFFER)
    }
}