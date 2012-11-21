var npm = require("npm");

test('setup3.x', function(done) {
    npm.load(function(err, npm) {
        npm.localPrefix = __dirname;
        npm.commands.install(['express@=3.0.x'], function() {
            // run tests
            require('./app');
            require('./async_helpers');
            done();
        });
    });
});
