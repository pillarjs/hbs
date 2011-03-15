var compile = exports.compile = function (source, options) {
    if (typeof source == 'string') {
        var handlebars = exports.handlebars ||
                (exports.handlebars = require(exports.handlebarsPath ||
                        '../support/handlebars/lib/handlebars'));
        var template = handlebars.compile(source);
        return function (options) {
            return template(options, options.blockHelpers);
        };
    } else {
        return source;
    }
};

exports.render = function (template, options) {
    template = compile(template, options);
    return template(options);
};
