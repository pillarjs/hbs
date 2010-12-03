var handlebars = require("../support/handlebars/lib/handlebars");

var compile = exports.compile = function (source, options) {
    if (typeof source == 'string') {
        var template = handlebars.compile(source);
		return function (options) {
			// latest Handlebars moved blockHelpers to second parameter
			return template(options.locals, options.blockHelpers);
		};
    } else {
        return source;
    }
};

exports.render = function (template, options) {
    var locals = options.locals || (options.locals = {});
    template = compile(template, options);
    return template(locals);
};
