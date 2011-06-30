var hbs = {};
var Handlebars = null;
var handlebarsPath = __dirname + "/../support/handlebars.1.0.0.beta.3-hack";

Object.defineProperty(hbs, "Handlebars", {
  enumerable: true,
  get: function() {
    if(Handlebars == null) {
      Handlebars = require(hbs.handlebarsPath);
    }
    return Handlebars;
  },
  set: function(value) {
    Handlebars = value;
  }
});

Object.defineProperty(hbs, "handlebarsPath", {
  enumerable: true,
  get: function() {
    return handlebarsPath;
  },
  set: function(value) {
    handlebarsPath = value;
    Handlebars = null;
  }
})

var compile = hbs.compile = function (source, options) {
  if (typeof source == 'string') {
    var template = hbs.Handlebars.compile(source);
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
