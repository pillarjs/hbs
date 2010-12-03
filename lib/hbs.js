var handlebars = require("../support/handlebars/lib/handlebars");

var compile = exports.compile = function (source, options) {
    if (typeof source == 'string') {
        var template = handlebars.compile(source);
		return function (options) {
			var locals = options.locals || (options.locals = {});
			locals.body = options.body;
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
