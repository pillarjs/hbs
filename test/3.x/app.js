var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

var FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')

// builtin
var fs = require('fs');
var assert = require('assert');

// local
var hbs = require('../../').create();

hbs.registerHelper('make_error', function () {
  throw new TypeError('oops!')
})

hbs.registerHelper('link_to', function(context) {
  return "<a href='" + context.url + "'>" + context.body + "</a>";
});

hbs.registerHelper('link_to2', function(title, context) {
  return "<a href='/posts" + context.url + "'>" + title + "</a>"
});

hbs.registerHelper('list', function(items, context) {
  var out = '<ul class="' + (this.listClassName || '') + '">'

  for(var i=0; i<items.length; ++i) {
    out = out + "<li>" + context.fn(items[i]) + "</li>";
  }
  return out + "</ul>";
});

hbs.registerPartial('link2', '<a href="/people/{{id}}">{{name}}</a>');
hbs.registerPartials(path.join(__dirname, 'views', 'partials'))

var app = null

before(function () {
  if (utils.nodeVersionCompare(10.0) >= 0) {
    this.skip()
    return
  }

  var express = require('express')

  app = express()

  // manually set render engine, under normal circumstances this
  // would not be needed as hbs would be installed through npm
  app.engine('hbs', hbs.__express)

  // render html files using hbs as well
  // tests detecting the view engine extension
  app.engine('html', hbs.__express)

  // set the view engine to use handlebars
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.use(express.static(path.join(__dirname, 'public')))
  app.use(app.router)
  app.use(function (err, req, res, next) {
    res.status(500).send(err.stack.toString())
  })

  // expose app and response locals in views
  hbs.localsAsTemplateData(app)
  app.locals.father = 'Alan'

  app.get('/', function (req, res) {
    res.render('index', {
      title: 'Express Handlebars Test',
      // basic test
      name: 'Alan',
      hometown: 'Somewhere, TX',
      kids: [
        { name: 'Jimmy', age: '12' },
        { name: 'Sally', age: '4' }],
      // path test
      person: { name: 'Alan' },
      company: { name: 'Rad, Inc.' },
      // escapee test
      escapee: '<jail>escaped</jail>',
      // helper test
      listClassName: 'my-list',
      posts: [{ url: '/hello-world', body: 'Hello World!' }],
      // helper with string
      posts2: [{ url: '/hello-world', body: 'Hello World!' }],
      // for block helper test
      people: [
        { firstName: 'Yehuda', lastName: 'Katz' },
        { firstName: 'Carl', lastName: 'Lerche' },
        { firstName: 'Alan', lastName: 'Johnson' }
      ],
      people2: [
        { name: { firstName: 'Yehuda', lastName: 'Katz' } },
        { name: { firstName: 'Carl', lastName: 'Lerche' } },
        { name: { firstName: 'Alan', lastName: 'Johnson' } }
      ],
      // for partial test
      people3: [
        { name: 'Alan', id: 1 },
        { name: 'Yehuda', id: 2 }
      ]
    })
  })

  app.get('/html', function (req, res) {
    res.render('index.html', {
      title: 'Express Handlebars Test',
      // basic test
      name: 'Alan',
      hometown: 'Somewhere, TX',
      kids: [
        { name: 'Jimmy', age: '12' },
        { name: 'Sally', age: '4' }
      ],
      // path test
      person: { name: 'Alan' },
      company: { name: 'Rad, Inc.' },
      // escapee test
      escapee: '<jail>escaped</jail>',
      // helper test
      listClassName: 'my-list',
      posts: [{ url: '/hello-world', body: 'Hello World!' }],
      // helper with string
      posts2: [{ url: '/hello-world', body: 'Hello World!' }],
      // for block helper test
      people: [
        { firstName: 'Yehuda', lastName: 'Katz' },
        { firstName: 'Carl', lastName: 'Lerche' },
        { firstName: 'Alan', lastName: 'Johnson' }
      ],
      people2: [
        { name: { firstName: 'Yehuda', lastName: 'Katz' } },
        { name: { firstName: 'Carl', lastName: 'Lerche' } },
        { name: { firstName: 'Alan', lastName: 'Johnson' } }
      ],
      // for partial test
      people3: [
        { name: 'Alan', id: 1 },
        { name: 'Yehuda', id: 2 }
      ]
    })
  })

  app.get('/helper-error', function (req, res) {
    res.render('error')
  })

  app.get('/syntax-error', function (req, res) {
    res.render('syntax-error', {
      cache: true
    })
  })

  app.get('/partials', function (req, res) {
    res.render('partials', { layout: false })
  })

  app.get('/escape', function (req, res) {
    res.render('escape', { title: 'foobar', layout: false })
  })

  app.get('/locals', function (req, res) {
    res.locals.person = 'Alan'
    res.render('locals', {
      layout: false,
      kids: [{ name: 'Jimmy' }, { name: 'Sally' }]
    })
  })

  app.get('/locals-cached', function (req, res) {
    res.locals.person = 'Alan'
    res.render('locals', {
      layout: false,
      cache: true,
      kids: [{ name: 'Jimmy' }, { name: 'Sally' }]
    })
  })

  app.get('/locals-model', function (req, res) {
    res.locals.person = new Person('Alan', 'Smith')
    res.render('locals', {
      layout: false,
      kids: [new Person('Jimmy', 'Smith'), new Person('Sally', 'Smith')]
    })
  })

  app.get('/globals', function (req, res) {
    res.render('globals', {
      layout: 'layout_globals',
      kids: [{ name: 'Jimmy' }, { name: 'Sally' }]
    })
  })
})

test('index', function(done) {
  request(app)
    .get('/')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'index.html'), 'utf8'))
    .end(done)
});

test('partials', function(done) {
  request(app)
    .get('/partials')
    .expect(shouldHaveFirstLineEqual('Test Partial 1Test Partial 2Test Partial 3Test Partial 4'))
    .end(done)
});

test('helper error', function (done) {
  request(app)
    .get('/helper-error')
    .expect(500)
    .expect(shouldHaveFirstLineEqual('TypeError: ' + path.join(__dirname, 'views', 'error.hbs') + ': oops!'))
    .end(done)
})

test('html extension', function(done) {
  request(app)
    .get('/html')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'index.html'), 'utf8'))
    .end(done)
});

test('syntax error', function(done) {
  request(app)
    .get('/syntax-error')
    .expect(500)
    .expect(shouldHaveFirstLineEqual('Error: ' + path.join(__dirname, 'views', 'syntax-error.hbs') + ': Parse error on line 1:'))
    .end(done)
});

test('syntax error cached', function (done) {
  request(app)
    .get('/syntax-error')
    .expect(500)
    .expect(shouldHaveFirstLineEqual('Error: ' + path.join(__dirname, 'views', 'syntax-error.hbs') + ': Parse error on line 1:'))
    .end(done)
})

test('escape for frontend', function(done) {
  request(app)
    .get('/escape')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'escape.html'), 'utf8'))
    .end(done)
});

test('response locals', function(done) {
  request(app)
    .get('/locals')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'locals.html'), 'utf8'))
    .end(done)
});

test('response locals cached', function(done) {
  request(app)
    .get('/locals-cached')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'locals.html'), 'utf8'))
    .end(function (error) {
      if (error) return done(error)
      request(app)
        .get('/locals-cached')
        .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'locals.html'), 'utf8'))
        .end(done)
    })
});

test('response locals model', function(done) {
  request(app)
    .get('/locals-model')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'locals.html'), 'utf8'))
    .end(done)
});

test('response globals', function(done) {
  request(app)
    .get('/globals')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'globals.html'), 'utf8'))
    .end(done)
});

test('app.render', function (done) {
  app.render('blank', function (err, str) {
    if (err) return done(err)
    assert.ok(/  index body :\)/.test(str))
    done()
  })
})

function shouldHaveFirstLineEqual (str) {
  return function (res) {
    assert.strictEqual(res.text.split(/\r?\n/)[0], str)
  }
}

function Person (firstName, lastName) {
  this.firstName = firstName
  this.lastName = lastName
}

Person.prototype.toString = function toString () {
  return this.name()
}

Person.prototype.name = function name () {
  return this.firstName
}
