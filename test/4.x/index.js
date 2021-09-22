var exec = require('child_process').exec
var path = require('path')
var rimraf = require('rimraf')
var utils = require('../support/utils')

suite('express 4.x')

before(function (done) {
  if (utils.nodeVersionCompare(0.10) < 0) {
    this.skip()
    return done()
  }

  var env = utils.childEnvironment()

  this.timeout(30000)
  exec('npm install --prefix . express@~4.17.1', { cwd: __dirname, env: env }, function (err, stderr) {
    if (err) {
      err.message += stderr
      done(err)
      return
    }

    done()
  })
});

after(function (done) {
  this.timeout(30000)
  rimraf(path.join(__dirname, 'node_modules'), function (err) {
    if (err) return done(err)
    rimraf(path.join(__dirname, 'package.json'), done)
  })
})

require('./app')
require('./async_helpers')
require('./register_partials')
require('./view_engine')
require('./no_layout_app')
