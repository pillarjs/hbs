const fs = require('fs')
const { readdir, readFile } = require('node:fs/promises')
const path = require('path')

const async = require('./async')

function Instance (handlebars) {
  if (!(this instanceof Instance)) {
    return new Instance(handlebars)
  }

  // expose handlebars, allows users to use their versions
  // by overriding this early in their apps
  const self = this

  self.handlebars = handlebars || require('handlebars').create()

  // cache for compiled templates
  self.cache = {}

  self.__express = middleware.bind(this)

  // queue for partials registration
  self._queue = null
}

// Express view engine interface
function middleware (filename, options, cb) {
  const self = this

  if (self._queue) {
    self._queue.push(
      middleware.bind.apply(
        middleware,
        [this].concat(Array.prototype.slice.call(arguments))
      )
    )
    return
  }

  const cache = self.cache
  const handlebars = self.handlebars

  self.async = async()

  // grab extension from filename
  // if we need a layout, we will look for one matching out extension
  const extension = path.extname(filename)

  // Default handlebars runtime options
  const handlebarsOpts = {
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true,
  }

  // If passing the locals as data, create the handlebars options object now
  if (self.__localsAsData) {
    handlebarsOpts.data = options._locals
  }

  // Helper function to process async placeholders
  function processAsyncResults (template, cb) {
    if (!self.async.hasPending()) {
      return cb(null, template)
    }

    self.async
      .done()
      .then(function (values) {
        let res = template

        Object.keys(values).forEach(function (id) {
          const value = values[id]

          const escaped = handlebars.Utils.escapeExpression(
            value == null ? String(value) : value
          )

          res = res.replace(id, function () { return escaped })
        })

        cb(null, res)
      })
      .catch(function (error) {
        cb(error)
      })
  }

  // render the original file
  // cb(err, str)
  function renderFile (locals, cb) {
    // cached?
    const template = cache[filename]
    if (template) {
      try {
        const res = template(locals, handlebarsOpts)

        // Handle async operations
        processAsyncResults(res, function (err, processedRes) {
          if (err) {
            return cb(prependFilenameToError(filename, err))
          }
          cb(null, processedRes)
        })
      } catch (err) {
        cb(prependFilenameToError(filename, err))
      }

      return
    }

    fs.readFile(filename, 'utf8', function (err, str) {
      if (err) {
        return cb(err)
      }

      const template = handlebars.compile(str)
      if (locals.cache) {
        cache[filename] = template
      }

      try {
        const res = template(locals, handlebarsOpts)

        // handle async operations
        processAsyncResults(res, function (err, processedRes) {
          if (err) {
            return cb(prependFilenameToError(filename, err))
          }
          cb(null, processedRes)
        })
      } catch (err) {
        cb(prependFilenameToError(filename, err))
      }
    })
  }

  // render with a layout
  function renderWithLayout (filename, template, locals, cb) {
    renderFile(locals, function (err, str) {
      if (err) {
        return cb(err)
      }

      locals.body = str

      try {
        const res = template(locals, handlebarsOpts)

        // Handle async operations for layout
        processAsyncResults(res, function (err, processedRes) {
          if (err) {
            return cb(prependFilenameToError(filename, err))
          }
          cb(null, processedRes)
        })
      } catch (err) {
        cb(prependFilenameToError(filename, err))
      }
    })
  }

  let layout = options.layout

  // user did not specify a layout in the locals
  // check global layout state
  if (
    layout === undefined &&
    options.settings &&
    options.settings['view options']
  ) {
    layout = options.settings['view options'].layout
  }

  // user explicitly request no layout
  // either by specifying false for layout: false in locals
  // or by settings the false view options
  if (layout !== undefined && !layout) {
    return renderFile(options, cb)
  }

  const viewDirs = options.settings.views

  const layoutFilename = [].concat(viewDirs).map(function (viewDir) {
    let viewPath = path.join(viewDir, layout || 'layout')

    if (!path.extname(viewPath)) {
      viewPath += extension
    }

    return viewPath
  })

  for (let i = 0; i < layoutFilename.length; i++) {
    const layoutTemplate = cache[layoutFilename[i]]

    if (layoutTemplate) {
      return renderWithLayout(
        layoutFilename[i],
        layoutTemplate,
        options,
        cb
      )
    }
  }

  function prependFilenameToError (filename, err) {
    // prepend to the message
    if (typeof err.message === 'string') {
      err.message = filename + ': ' + err.message
    }

    return err
  }

  function cacheAndCompile (filename, str) {
    const layoutTemplate = handlebars.compile(str)
    if (options.cache) {
      cache[filename] = layoutTemplate
    }

    renderWithLayout(filename, layoutTemplate, options, cb)
  }

  function tryReadFileAndCache (templates) {
    const template = templates.shift()

    fs.readFile(template, 'utf8', function (err, str) {
      if (err) {
        if (layout && templates.length === 0) {
          // Only return error if user explicitly asked for layout.
          return cb(err)
        }

        if (templates.length > 0) {
          return tryReadFileAndCache(templates)
        }

        return renderFile(options, cb)
      }

      cacheAndCompile(template, str)
    })
  }

  tryReadFileAndCache(layoutFilename)
}

Instance.prototype.registerHelper = function () {
  this.handlebars.registerHelper.apply(this.handlebars, arguments)
}

Instance.prototype.registerPartial = function () {
  this.handlebars.registerPartial.apply(this.handlebars, arguments)
}

Instance.prototype.registerPartials = function (directory, options, done) {
  const self = this

  if (this._queue) {
    self._queue.unshift(
      self.registerPartials.bind.apply(
        self.registerPartials,
        [this].concat(Array.prototype.slice.call(arguments))
      )
    )
    return
  } else {
    self._queue = []
  }

  let callback
  const handlebars = self.handlebars
  let opts = options || {}

  if (done || typeof options !== 'function') {
    callback = done
  } else {
    callback = options
    opts = {}
  }

  const rename =
    opts.rename !== undefined
      ? opts.rename
      : function (name) {
        return name.replace(/-/g, '_')
      }

  // Recursively collect .html/.hbs templates under `directory`. We walk with
  // per-directory readdir instead of readdir(dir, { recursive: true }) because
  // the recursive option requires Node >= 18.17, while hbs supports Node >= 18.
  // Symlinked directories are not followed (Dirent.isDirectory() is false for a
  // symlink), matching the previous behavior.
  async function collectTemplates (dir) {
    const found = []
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const full = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        found.push(...await collectTemplates(full))
      } else if (entry.isFile() && /\.(html|hbs)$/.test(full)) {
        found.push(full)
      }
    }

    return found
  }

  function finish (err) {
    if (self._queue) {
      const q = self._queue

      self._queue = null

      for (let i = 0; i < q.length; i++) {
        q[i]()
      }
    }

    if (callback) {
      callback(err)
    }
  }

  collectTemplates(directory)
    .then(async function (files) {
      for (const filepath of files) {
        const data = await readFile(filepath, 'utf8')
        const extname = path.extname(filepath)
        const name = path
          .relative(directory, filepath)
          .slice(0, -extname.length)
          .replace(/\\/g, '/')

        handlebars.registerPartial(rename(name).replace(/ /g, '_'), data)
      }
    })
    .then(function () { finish(null) })
    .catch(finish)
}

Instance.prototype.registerAsyncHelper = function (name, fn) {
  const self = this
  self.handlebars.registerHelper(name, function () {
    const args = Array.prototype.slice.call(arguments)
    return self.async.resolve.apply(self.async, [fn.bind(this)].concat(args))
  })
}

Instance.prototype.localsAsTemplateData = function (app) {
  // Set a flag to indicate we should pass locals as data
  this.__localsAsData = true

  app.render = (function (render) {
    return function (view, options, callback) {
      if (typeof options === 'function') {
        callback = options
        options = {}
      }

      // Mix response.locals (options._locals) with app.locals (this.locals)
      options._locals = options._locals || {}
      for (const key in this.locals) {
        options._locals[key] = this.locals[key]
      }

      return render.call(this, view, options, callback)
    }
  })(app.render)
}

module.exports = new Instance()
module.exports.create = function (handlebars) {
  return new Instance(handlebars)
}
