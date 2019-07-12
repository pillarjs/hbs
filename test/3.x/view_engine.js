var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

var FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')

// builtin
var fs = require('fs');

var app = null

suite('express 3.x view engine')

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
  app.engine('html', hbs.__express)

  // set the view engine to use handlebars
  app.set('view engine', 'html')
  app.set('views', path.join(__dirname, 'views_view_engine'))

  app.set('view options', {
    layout: false
  })

  app.get('/', function (req, res) {
    res.render('no_layout', {
      title: 'Express Handlebars Test'
    })
  })

  app.get('/with_layout', function (req, res) {
    res.render('blank', {
      title: 'Express Handlebars Test',
      layout: 'layout'
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
