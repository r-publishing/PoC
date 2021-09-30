
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./key-did-provider-secp256k1.cjs.production.min.js')
} else {
  module.exports = require('./key-did-provider-secp256k1.cjs.development.js')
}
