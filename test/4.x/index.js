var npm = require('npm');

test('setup4.x', function(done) {
    npm.load(function(err, npm) {
        npm.localPrefix = __dirname;
        npm.commands.install(['express@4.12.0'], function(err) {
            if (err) {
                return done(err);
            }
            // run tests
            require('./app');
            require('./async_helpers');
            require('./view_engine');
            done();
        });
    });
});
