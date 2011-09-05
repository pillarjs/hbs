var hbs = {};
var Handlebars = null;
var handlebarsPath = __dirname + "/../support/handlebars.1.0.0.beta.3-hack";
var fs = require('fs')
var path = require('path')

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


// PARTIALS // 
var registerPartial = hbs.registerPartial = function(name, partial) {
  hbs.Handlebars.registerPartial(name, partial)
}

var partials = hbs.partials = function(directory, cb) {
    // loads partials from a directory

    cb = cb || throwErrors

    fs.readdir(directory, function(err, files) {
        if (err) return cb(err)
        var remaining = files.length
        files.forEach(function(file) {
            hbs.partial(path.join(directory, file), function(err) {
                if (err) return cb(err)
                if (--remaining === 0) cb()
            })
        })
    })
}

var partial = hbs.partial = function(file, cb) {
    cb = cb || throwErrors
    var name = path.basename(file).replace(/\.\w+$/, "")
    fs.readFile(file, function(err, data) {
        if (err) return cb(err)
        hbs.registerPartial(name, data.toString())
        cb()
    })
}



// HELPERS //

var registerHelper = hbs.registerHelper = function(name, helper) {
    hbs.Handlebars.registerHelper(name, helper)
}

var helpers = hbs.helpers = function(module) {
    for (var name in module) {
        var value = module[name]
        if (typeof value === "function") {
            hbs.registerHelper(name, value)
        }
    }
}





function throwErrors(err) {
    if (err) throw err
}

module.exports = hbs;
