var npm = require("npm");

test('setup2.x', function(done) {
    npm.load(function(err, npm) {
        npm.localPrefix = __dirname;
        npm.commands.install(['express@=2.5.10'], function() {
            // run tests
            require('./app');
            done();
        });
    });
});
