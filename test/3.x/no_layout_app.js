var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

var FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')

// builtin
var fs = require('fs');
var root = process.cwd();

var app = null

suite('express 3.x no layout')

before(function () {
  if (utils.nodeVersionCompare(10.0) >= 0) {
    this.skip()
    return
  }

  var express = require('express')
  var hbs = require('../../')

  app = express()

  // manually set render engine, under normal circumstances this
  // would not be needed as hbs would be installed through npm
  app.engine('hbs', hbs.__express)

  // set the view engine to use handlebars
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.set('view options', {
    layout: false
  })

  app.use(express.static(path.join(__dirname, 'public')))

  app.get('/', function (req, res) {
    res.render('no_layout', {
      title: 'Express Handlebars Test'
    })
  })

  app.get('/with_layout', function (req, res) {
    res.render('blank', {
      layout: 'layout',
      title: 'Express Handlebars Test'
    })
  })

  app.get('/layout_cache', function (req, res, next) {
    res.render('blank', {
      layout: 'layout',
      cache: true,
      title: 'Express Handlebars Test'
    }, function (error, body) {
      if (error) return next(error)
      var file = path.join(root, 'test', '3.x', 'views', 'layout.hbs')
      if (hbs.cache[file]) {
        res.send(body)
      } else {
        res.send('not cached!')
      }
    })
  })
})

test('index', function(done) {
  request(app)
    .get('/')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'index_no_layout.html'), 'utf8'))
    .end(done)
});

test('index w/layout', function(done) {
  request(app)
    .get('/with_layout')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'index_no_layout.html'), 'utf8'))
    .end(done)
});

test('index layout cache', function(done) {
  request(app)
    .get('/layout_cache')
    .expect(fs.readFileSync(path.join(FIXTURES_DIR, 'index_no_layout.html'), 'utf8'))
    .end(done)
});
