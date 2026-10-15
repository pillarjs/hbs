var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

// local
var hbs = require('../../')

var app = null

suite('express 4.x settings collision')

function createApp (instance) {
  var express = require('express')
  var app = express()

  app.engine('hbs', instance.__express)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  // a "settings" property in the render data shadows Express's reserved
  // "settings" local. see https://github.com/pillarjs/hbs/issues/153
  app.get('/collision', function (req, res) {
    res.render('blank', { settings: { foo: 'bar' } })
  })

  app.get('/no-layout', function (req, res) {
    res.render('blank', { settings: { foo: 'bar' }, layout: false })
  })

  app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
    res.status(500).send(err.message)
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

test('a "settings" local yields a descriptive error when a layout is needed', function (done) {
  request(app)
    .get('/collision')
    .expect(500, /reserved "settings"/, done)
})

test('a "settings" local still renders when no layout is used', function (done) {
  request(app)
    .get('/no-layout')
    .expect(200, '  index body :)', done)
})
