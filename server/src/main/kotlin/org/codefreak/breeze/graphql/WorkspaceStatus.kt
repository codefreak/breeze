package org.codefreak.breeze.graphql

import org.codefreak.breeze.workspace.WorkspaceStatus as WorkspaceStatusEntity

enum class WorkspaceStatus {
    UNDEFINED,
    CREATING,
    CREATED,
    STARTING,
    RESTARTING,
    RUNNING,
    STOPPING,
    STOPPED,
    REMOVING,
    REMOVED
}

fun WorkspaceStatus(status: WorkspaceStatusEntity): WorkspaceStatus {
    return when (status) {
        WorkspaceStatusEntity.UNDEFINED -> WorkspaceStatus.UNDEFINED
        WorkspaceStatusEntity.CREATING -> WorkspaceStatus.CREATING
        WorkspaceStatusEntity.CREATED -> WorkspaceStatus.CREATED
        WorkspaceStatusEntity.STARTING -> WorkspaceStatus.STARTING
        WorkspaceStatusEntity.RESTARTING -> WorkspaceStatus.RESTARTING
        WorkspaceStatusEntity.RUNNING -> WorkspaceStatus.RUNNING
        WorkspaceStatusEntity.STOPPING -> WorkspaceStatus.STOPPING
        WorkspaceStatusEntity.STOPPED -> WorkspaceStatus.STOPPED
        WorkspaceStatusEntity.REMOVING -> WorkspaceStatus.REMOVING
        WorkspaceStatusEntity.REMOVED -> WorkspaceStatus.REMOVED
    }
}