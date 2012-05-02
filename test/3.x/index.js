var npm = require("npm");

test('setup3.x', function(done) {
    npm.load(function(err, npm) {
        npm.localPrefix = __dirname;
        npm.commands.install(['express@>=3.0.0alpha2'], function() {
            // run tests
            require('./app');
            done();
        });
    });
});
