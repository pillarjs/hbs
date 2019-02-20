var exec = require('child_process').exec
var utils = require('../support/utils')

test('setup4.x', function(done) {
  var env = utils.childEnvironment()

  exec('npm install --prefix . express@4.12.0', { cwd: __dirname, env: env }, function (err, stderr) {
    if (err) {
      err.message += stderr
      done(err)
      return
    }

    // run tests
    require('./app')
    require('./async_helpers')
    require('./view_engine')
    require('./no_layout_app')
    done()
  })
});
