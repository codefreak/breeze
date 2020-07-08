import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'
import { ApolloProvider } from '@apollo/react-hooks'
import ConnectionStatusProvider from './ConnectionStatusProvider'
import { createApolloClient, createSubscriptionClient } from './service/apollo'

const subscriptionClient = createSubscriptionClient()
const apolloClient = createApolloClient(subscriptionClient)

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <ConnectionStatusProvider subClient={subscriptionClient}>
        <App />
      </ConnectionStatusProvider>
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

serviceWorker.unregister()
