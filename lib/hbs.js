var handlebars = require('handlebars');

var compile = function (str, options) {
  if (typeof str !== 'string') {
    return str;
  }
  
  var template = handlebars.compile(str);
  return function (locals) {
    return template(locals, {
      helpers: locals.blockHelpers,
      partials: null,
      data: null
    });
  };
};

// Express view template engine compliance

exports.compile = compile;

// Expose Handlebars and useful methods

exports.handlebars = handlebars;

exports.registerHelper = function () {
  handlebars.registerHelper.apply(handlebars, arguments);
};

exports.registerPartial = function () {
  handlebars.registerPartial.apply(handlebars, arguments);
};

exports.SafeString = handlebars.SafeString;
exports.Utils = handlebars.Utils;
