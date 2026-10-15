var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

// local
var hbs = require('../../')

var app = null

suite('express 4.x template inheritance')

function createApp (instance) {
  var express = require('express')
  var app = express()

  // a reusable base layout registered as a partial, with an override block.
  // see https://github.com/pillarjs/hbs/issues/119
  instance.registerPartial('base', [
    '<html>',
    '<head><title>{{title}}</title></head>',
    '<body><main>{{#> content}}Default content{{/content}}</main></body>',
    '</html>'
  ].join('\n'))

  app.engine('hbs', instance.__express)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.get('/home', function (req, res) {
    res.render('inherit', { layout: false, name: 'Alan' })
  })

  app.get('/default', function (req, res) {
    res.render('inherit_default', { layout: false })
  })

  return app
}

before(function () {
  if (utils.nodeVersionCompare(0.10) < 0) {
    this.skip()
    return
  }

  app = createApp(hbs.create())
})

test('a child view overrides a parent block', function (done) {
  request(app)
    .get('/home')
    .expect(/<title>Home<\/title>/)
    .expect(/<main><h1>Welcome Alan<\/h1><\/main>/, done)
})

test('an unoverridden block keeps the parent default', function (done) {
  request(app)
    .get('/default')
    .expect(/<main>Default content<\/main>/, done)
})
