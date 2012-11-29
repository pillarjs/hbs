
// builtin
var fs = require('fs');
var path = require('path');

// handle async helpers
var async = require('./async');

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
var cache = exports.cache = {};

// express 3.x template engine compliance
exports.__express = function(filename, options, cb) {
  var handlebars = exports.handlebars;

  // grab extension from filename
  // if we need a layout, we will look for one matching out extension
  var extension = path.extname(filename);

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

      try {
        var res = template(locals);
        async.done(function(values) {
          Object.keys(values).forEach(function(id) {
            res = res.replace(id, values[id]);
          });

          cb(null, res);
        });
      } catch (err) {
        err.message = filename + ': ' + err.message;
        cb(err);
      }
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

      var res = template(locals);
      async.done(function(values) {
        Object.keys(values).forEach(function(id) {
          res = res.replace(id, values[id]);
        });

        cb(null, res);
      });
    });
  }

  var layout = options.layout;

  // user did not specify a layout in the locals
  // check global layout state
  if (layout === undefined && options.settings && options.settings['view options']) {
    layout = options.settings['view options'].layout;
  }

  // user explicitly request no layout
  // either by specifying false for layout: false in locals
  // or by settings the false view options
  if (layout !== undefined && !layout) {
    return render_file(options, cb);
  }

  var view_dir = options.settings.views;
  var layout_filename = path.join(view_dir, layout || 'layout');

  if (!path.extname(layout_filename)) {
    layout_filename += extension;
  };

  var layout_template = cache[layout_filename];
  if (layout_template) {
    return render_with_layout(layout_template, options, cb);
  }

  // TODO check if layout path has .hbs extension

  fs.readFile(layout_filename, 'utf8', function(err, str) {
    if (err) {
      if (layout) {
        // Only return error if user explicitly asked for layout.
        return cb(err);
      }
      return render_file(options, cb);
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

exports.registerAsyncHelper = function(name, fn) {
  exports.handlebars.registerHelper(name, function(context) {
    return async.resolve(fn, context);
  });
};

// DEPRECATED, kept for backwards compatibility
exports.SafeString = exports.handlebars.SafeString;
exports.Utils = exports.handlebars.Utils;
