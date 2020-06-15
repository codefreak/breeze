package org.codefreak.breeze.graphql

import graphql.GraphQL
import graphql.execution.SubscriptionExecutionStrategy
import graphql.kickstart.tools.GraphQLResolver
import graphql.kickstart.tools.SchemaParser
import graphql.scalars.ExtendedScalars
import org.codefreak.breeze.graphql.model.Directory

class GraphQLFactory(
        private val resolvers: List<GraphQLResolver<*>>
) {

    fun graphQL(): GraphQL {
        val schemaParser = SchemaParser.newParser().apply {
            file("schema.graphqls")
            scalars(ExtendedScalars.DateTime)
            resolvers(resolvers)
            dictionary(Directory::class.java)
        }

        val schema = schemaParser.build().makeExecutableSchema()
        return GraphQL.newGraphQL(schema)
                .subscriptionExecutionStrategy(SubscriptionExecutionStrategy())
                .build()
    }
}