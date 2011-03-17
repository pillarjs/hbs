var hbs = {};
var handlebars = null;
var handlebarsPath = __dirname + "/../support/handlebars/lib/handlebars";

Object.defineProperty(hbs, "handlebars", {
  enumerable: true,
  get: function() {
    if(handlebars == null) {
      handlebars = require(hbs.handlebarsPath);
    }
    return handlebars;
  },
  set: function(value) {
    handlebars = value;
  }
});

Object.defineProperty(hbs, "handlebarsPath", {
  enumerable: true,
  get: function() {
    return handlebarsPath;
  },
  set: function(value) {
    handlebarsPath = value;
    handlebars = null;
  }
})

var compile = hbs.compile = function (source, options) {
  if (typeof source == 'string') {
    var template = hbs.handlebars.compile(source);
    return function (options) {
      return template(options, options.blockHelpers);
    };
  } else {
    return source;
  }
};

var render = hbs.render = function(template, options) {
  var compiledTemplate = compile(template, options);
  return compiledTemplate(options);
};

module.exports = hbs;
