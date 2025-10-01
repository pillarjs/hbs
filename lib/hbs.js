const fs = require('fs');
const path = require('path');
const walk = require('walk').walk;

const async = require('./async');

function Instance(handlebars) {
  if (!(this instanceof Instance)) {
    return new Instance(handlebars);
  }

  // expose handlebars, allows users to use their versions
  // by overriding this early in their apps
  const self = this;

  self.handlebars = handlebars || require('handlebars').create();

  // cache for templates, express 3.x doesn't do this for us
  self.cache = {};

  self.__express = middleware.bind(this);

  // queue for partials registration
  self._queue = null;

  // DEPRECATED, kept for backwards compatibility
  self.SafeString = this.handlebars.SafeString;
  self.Utils = this.handlebars.Utils;
};

// express 3.x template engine compliance
function middleware(filename, options, cb) {
  const self = this;

  if (self._queue) {
    self._queue.push(middleware.bind.apply(middleware, [this].concat(Array.prototype.slice.call(arguments))))
    return
  }

  const cache = self.cache;
  const handlebars = self.handlebars;

  self.async = async();

  // grab extension from filename
  // if we need a layout, we will look for one matching out extension
  const extension = path.extname(filename);

  // Default handlebars runtime options
  const handlebarsOpts = {
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true,
  };

  // If passing the locals as data, create the handlebars options object now
  if (self.__localsAsData) {
    handlebarsOpts.data = options._locals;
  }

  // Helper function to process async placeholders
  function processAsyncResults(template, cb) {
    if (!self.async.hasPending()) {
      return cb(null, template);
    }

    self.async
      .done()
      .then(function (values) {
        let res = template;

        Object.keys(values).forEach(function (id) {
          res = res.replace(id, values[id]);
        });

        cb(null, res);
      })
      .catch(function (error) {
        cb(error);
      });
  }

  // render the original file
  // cb(err, str)
  function render_file(locals, cb) {
    // cached?
    const template = cache[filename];
    if (template) {
      try {
        const res = template(locals, handlebarsOpts);

        // Handle async operations
        processAsyncResults(res, function (err, processedRes) {
          if (err) {
            return cb(prependFilenameToError(filename, err));
          }
          cb(null, processedRes);
        });
      } catch (err) {
        cb(prependFilenameToError(filename, err));
      }

      return;
    }

    fs.readFile(filename, 'utf8', function (err, str){
      if (err) {
        return cb(err);
      }

      const template = handlebars.compile(str);
      if (locals.cache) {
        cache[filename] = template;
      }

      try {
        const res = template(locals, handlebarsOpts);

        // handle async operations
        processAsyncResults(res, function (err, processedRes) {
          if (err) {
            return cb(prependFilenameToError(filename, err));
          }
          cb(null, processedRes);
        });
      } catch (err) {
        cb(prependFilenameToError(filename, err));
      }
    });
  }

  // render with a layout
  function render_with_layout (filename, template, locals, cb) {
    render_file(locals, function (err, str) {
      if (err) {
        return cb(err);
      }

      locals.body = str;

      try {
        const res = template(locals, handlebarsOpts);

        // Handle async operations for layout
        processAsyncResults(res, function (err, processedRes) {
          if (err) {
            return cb(prependFilenameToError(filename, err));
          }
          cb(null, processedRes);
        });
      } catch (err) {
        cb(prependFilenameToError(filename, err));
      }
    });
  }

  let layout = options.layout;

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

  const view_dirs = options.settings.views;

  const layout_filename = [].concat(view_dirs).map(function (view_dir) {
    let view_path = path.join(view_dir, layout || 'layout');

    if (!path.extname(view_path)) {
      view_path += extension;
    }

    return view_path;
  });

  for (let i = 0; i < layout_filename.length; i++) {
    const layout_template = cache[layout_filename[i]];

    if (layout_template) {
      return render_with_layout(layout_filename[i], layout_template, options, cb)
    }
  }

  function prependFilenameToError(filename, err) {
    // prepend to the message
    if (typeof err.message === 'string') {
      err.message = filename + ': ' + err.message;
    }

    return err;
  }

  function cacheAndCompile(filename, str) {
    const layout_template = handlebars.compile(str);
    if (options.cache) {
      cache[filename] = layout_template;
    }

    render_with_layout(filename, layout_template, options, cb);
  }

  function tryReadFileAndCache(templates) {
    const template = templates.shift();

    fs.readFile(template, 'utf8', function (err, str) {
      if (err) {
        if (layout && templates.length === 0) {
          // Only return error if user explicitly asked for layout.
          return cb(err);
        }

        if (templates.length > 0) {
          return tryReadFileAndCache(templates);
        }

        return render_file(options, cb);
      }

      cacheAndCompile(template, str);
    });
  }

  tryReadFileAndCache(layout_filename);
}

// express 2.x template engine compliance
Instance.prototype.compile = function (str) {
  if (typeof str !== 'string') {
    return str;
  }

  const template = this.handlebars.compile(str);
  return function (locals) {
    return template(locals, {
      helpers: locals.blockHelpers,
      partials: null,
      data: null
    });
  };
};

Instance.prototype.registerHelper = function () {
  this.handlebars.registerHelper.apply(this.handlebars, arguments);
};

Instance.prototype.registerPartial = function () {
  this.handlebars.registerPartial.apply(this.handlebars, arguments);
};

Instance.prototype.registerPartials = function (directory, options, done) {
  const self = this;

  if (this._queue) {
    self._queue.unshift(
      self.registerPartials.bind.apply(
        self.registerPartials,
        [this].concat(Array.prototype.slice.call(arguments))
      )
    );
    return;
  } else {
    self._queue = [];
  }

  let callback;
  const handlebars = self.handlebars;
  let opts = options || {};

  if (done || typeof options !== 'function') {
    callback = done;
  } else {
    callback = options;
    opts = {};
  }

  const rename = opts.rename !== undefined ? opts.rename : function (name) {
    return name.replace(/\-/g, '_')
  }

  const w = walk(directory);
  w.on('file', function (root, stat, done) {
    const filepath = path.join(root, stat.name);
    const isValidTemplate = /\.(html|hbs)$/.test(filepath);

    if (!isValidTemplate) {
      return done(null);
    }

    fs.readFile(filepath, 'utf8', function (err, data) {
      if (!err) {
        const extname = path.extname(filepath);
        const name = path.relative(directory, filepath)
          .slice(0, -(extname.length))
          .replace(/\\/g, '/');

        handlebars.registerPartial(rename(name).replace(/ /g, '_'), data);
      }

      done(err);
    });
  });
  w.on('end', function () {
    if (self._queue) {
      const q = self._queue;

      self._queue = null;

      for (let i = 0; i < q.length; i++) {
        q[i]();
      }
    }
  });

  if (callback) {
    w.on('end', callback);
  }
};

Instance.prototype.registerAsyncHelper = function (name, fn) {
  const self = this;
  self.handlebars.registerHelper(name, function () {
    const args = Array.prototype.slice.call(arguments);
    return self.async.resolve.apply(self.async, [fn.bind(this)].concat(args));
  });
};

Instance.prototype.localsAsTemplateData = function (app) {
  // Set a flag to indicate we should pass locals as data
  this.__localsAsData = true;

  app.render = (function (render) {
    return function (view, options, callback) {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      // Mix response.locals (options._locals) with app.locals (this.locals)
      options._locals = options._locals || {};
      for (let key in this.locals) {
        options._locals[key] = this.locals[key];
      }

      return render.call(this, view, options, callback);
    };
  })(app.render);
};

module.exports = new Instance();
module.exports.create = function (handlebars) {
  return new Instance(handlebars);
};
