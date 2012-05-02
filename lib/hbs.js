
// builtin
var fs = require('fs');
var path = require('path');

// expose handlebars, allows users to use their versions
// by overriding this early in their apps
exports.handlebars = require('handlebars');

// express 2.x template engine compliance
exports.compile = function (str, options) {
  if (typeof str !== 'string') {
    return str;
  }

  var template = exports.handlebars.compile(str);
  return function (locals) {
    return template(locals, {
      helpers: locals.blockHelpers,
      partials: null,
      data: null
    });
  };
};

// cache for templates, express 3.x doesn't do this for us
var cache = {};

// express 3.x template engine compliance
exports.__express = function(filename, options, cb) {
  var handlebars = exports.handlebars;

  // render the original file
  // cb(err, str)
  function render_file(locals, cb) {
    // cached?
    var template = cache[filename];
    if (template) {
      return cb(null, template(locals));
    }

    fs.readFile(filename, 'utf8', function(err, str){
      if (err) {
        return cb(err);
      }

      var locals = options;
      var template = handlebars.compile(str);
      if (options.cache) {
        cache[filename] = template;
      }
      cb(null, template(locals));
    });
  }

  // render with a layout
  function render_with_layout(template, locals, cb) {
    render_file(locals, function(err, str) {
      if (err) {
        return cb(err);
      }

      var locals = options;
      locals.body = str;
      var str = template(locals);
      cb(null, str);
    });
  }

  // options.layout specified and false (don't use layout)
  if (options.layout !== undefined && !options.layout) {
    return render_file(options, cb);
  }

  var view_dir = options.settings.views;
  var layout_filename = path.join(view_dir, options.layout || 'layout.hbs');

  var layout_template = cache[layout_filename];
  if (layout_template) {
    return render_with_layout(layout_template, cb);
  }

  // TODO check if layout path has .hbs extension

  fs.readFile(layout_filename, 'utf8', function(err, str) {
    if (err) {
      return cb(err);
    }

    var layout_template = handlebars.compile(str);
    if (options.cache) {
      cache[layout_filename] = layout_template;
    }

    render_with_layout(layout_template, options, cb);
  });
}

/// expose useful methods

exports.registerHelper = function () {
  exports.handlebars.registerHelper.apply(exports.handlebars, arguments);
};

exports.registerPartial = function () {
  exports.handlebars.registerPartial.apply(exports.handlebars, arguments);
};

// DEPRECATED, kept for backwards compatibility
exports.SafeString = exports.handlebars.SafeString;
exports.Utils = exports.handlebars.Utils;
