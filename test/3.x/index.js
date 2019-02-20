var exec = require('child_process').exec
var utils = require('../support/utils')

suite('express 3.x')

before(function (done) {
  var env = utils.childEnvironment()

  exec('npm install --prefix . express@~3.16.8', { cwd: __dirname, env: env }, function (err, stderr) {
    if (err) {
      err.message += stderr
      done(err)
      return
    }

    done()
  })
});

require('./app')
require('./async_helpers')
require('./view_engine')
require('./no_layout_app')
