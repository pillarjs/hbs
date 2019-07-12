'use strict'

module.exports.childEnvironment = childEnvironment
module.exports.nodeVersionCompare = nodeVersionCompare

function childEnvironment () {
  var env = Object.create(null)

  // copy the environment except for npm veriables
  for (var key in process.env) {
    if (key.substr(0, 4) !== 'npm_') {
      env[key] = process.env[key]
    }
  }

  return env
}

function nodeVersionCompare (version) {
  return parseFloat(process.version.substr(1).split('.').slice(0, 2).join('.')) - version
}
