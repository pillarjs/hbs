var npm = require('npm');

test('setup4.x', function(done) {
    npm.load(function(err, npm) {
        npm.localPrefix = __dirname;
        npm.commands.install(['express@~4.10.0'], function() {
            // run tests
            require('./app');
            require('./async_helpers');
            done();
        });
    });
});
