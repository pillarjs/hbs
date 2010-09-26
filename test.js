var hbs = require("./lib/hbs");

var options = {
    locals: {
        message: "foobar"
    }
};

var source = "testing {{message}}";
var template = hbs.compile(source, options);
var rendered = hbs.render(template, options);

console.log(rendered);