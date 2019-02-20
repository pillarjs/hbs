'use strict'

module.exports.childEnvironment = childEnvironment

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
