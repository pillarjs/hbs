var assert = require('assert');
var hbs = require("./lib/hbs");

var handlebars = hbs.handlebars;
assert.ok(handlebars != null);

var options = {
    message: "foobar"
};

//testing out of the box configuration
var source = "testing {{message}}";
var template = hbs.compile(source, options);
var rendered = hbs.render(template, options);
assert.equal('testing foobar', rendered);

//fake handlebars conforming interface
var fakeHandlebars = {
  compile: function(source, options) {
    return function(template, options) {
      return source;
    }
  },
  render: function(tpl, options) {
    return tpl();
  }
};
module.exports = fakeHandlebars;


//setting handlebars to fake version
hbs.handlebars = fakeHandlebars;
var template = hbs.compile(source, options);
var rendered = hbs.render(template, options);
assert.equal('testing {{message}}', rendered);

//changing require path to go back to path of real handlebars
hbs.handlebarsPath = __dirname + '/support/handlebars/lib/handlebars';
var template = hbs.compile(source, options);
var rendered = hbs.render(template, options);
assert.equal('testing foobar', rendered);

//changing require path to use this file (which exports fake version)
hbs.handlebarsPath = __filename;
var template = hbs.compile(source, options);
var rendered = hbs.render(template, options);
assert.equal('testing {{message}}', rendered);

