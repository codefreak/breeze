// workaround for https://github.com/facebook/create-react-app/issues/5280
/* eslint-disable */

const proxy = require('http-proxy-middleware')

const proxyHost = process.env.NODE_PROXY_HOST || 'localhost'
const proxyPort = process.env.NODE_PROXY_PORT || '3000'
const proxyUrl = `${proxyHost}:${proxyPort}`

module.exports = function (app) {
  app.use(
    proxy('/graphql', {
      target: `ws://${proxyUrl}`,
      ws: true
    })
  )
}
