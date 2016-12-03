var npm = require('npm');

test('setup3.x', function(done) {
    npm.load(function(err, npm) {
        npm.localPrefix = __dirname;
        npm.commands.install(['express@~3.16.8'], function() {
            // run tests
            require('./app');
            require('./default_partials');
            require('./async_helpers');
            require('./view_engine');
            require('./no_layout_app');
            done();
        });
    });
});
