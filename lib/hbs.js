var handlebars = require("../support/handlebars/lib/handlebars");

var compile = exports.compile = function (source, options) {
    if (typeof source == 'string') {
        console.log("compiling Handlebars template");
        return handlebars.compile(source);
    } else {
        return source;
    }
};

exports.render = function (template, options) {
    template = compile(template, options);
    return template(options.locals);
};
