package org.codefreak.breeze.graphql

import com.google.inject.Inject
import com.google.inject.Singleton
import graphql.kickstart.tools.GraphQLMutationResolver
import graphql.kickstart.tools.GraphQLQueryResolver
import graphql.kickstart.tools.GraphQLSubscriptionResolver
import io.vertx.core.Vertx
import org.codefreak.breeze.BreezeConfiguration
import org.codefreak.breeze.graphql.model.Config

@Singleton
class ConfigResolver
@Inject constructor(
        private val config: BreezeConfiguration
) : GraphQLQueryResolver {

    fun config() = Config(
            instanceId = config.instanceId,
            mainFile = config.mainFile
    )
}