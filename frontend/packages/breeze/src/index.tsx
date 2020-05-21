import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { WebSocketLink } from "apollo-link-ws";
import { ApolloProvider } from "@apollo/react-hooks";
import { ApolloClient, InMemoryCache } from "apollo-boost";
import { SubscriptionClient } from "subscriptions-transport-ws";

const subClient = new SubscriptionClient("ws://localhost:3000/graphql", {
  reconnect: true,
  timeout: 30000,
  inactivityTimeout: 0,
  lazy: true,
});

const client = new ApolloClient({
  link: new WebSocketLink(subClient),
  cache: new InMemoryCache(),
});

ReactDOM.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App subClient={subClient} />
    </ApolloProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

serviceWorker.unregister();
