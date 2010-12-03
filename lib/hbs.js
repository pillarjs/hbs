var handlebars = require("../support/handlebars/lib/handlebars");

var compile = exports.compile = function (source, options) {
    if (typeof source == 'string') {
        return handlebars.compile(source);
    } else {
        return source;
    }
};

exports.render = function (template, options) {
    var locals = options.locals || (options.locals = {}),
        blockHelpers = options.blockHelpers || (options.blockHelpers = {});
    
    template = compile(template, options);
    return template(locals, blockHelpers);
};
