var compile = exports.compile = function (source, options) {
    if (typeof source == 'string') {
        var handlebars = exports.handlebars ||
                (exports.handlebars = require(exports.handlebarsPath ||
                        '../support/handlebars/lib/handlebars'));
        var template = handlebars.compile(source);
		return function (options) {
			var locals = options.locals || (options.locals = {});
			if (options.body) { // for express.js > v1.0
			    locals.body = options.body;
			}
			return template(locals, options.blockHelpers);
		};
    } else {
        return source;
    }
};

exports.render = function (template, options) {
    template = compile(template, options);
    return template(options);
};
