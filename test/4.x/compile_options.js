var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

// builtin
var assert = require('assert');

// local
var hbs = require('../../')

var strictApp = null
var noEscapeApp = null
var plainApp = null

suite('express 4.x compile options')

function createApp(instance) {
  var express = require('express')
  var app = express()

  app.engine('hbs', instance.__express)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.get('/', function (req, res) {
    res.render('no_escape', {
      layout: false,
      content: '<b>bold</b>'
    })
  })

  app.get('/strict/present', function (req, res) {
    res.render('strict', {
      layout: false,
      value: 'ok'
    })
  })

  app.get('/strict/missing', function (req, res) {
    res.render('strict', {
      layout: false
    })
  })

  app.get('/strict/layout', function (req, res) {
    // `title` is only referenced by the layout, so a failure here proves
    // the layout was compiled with the same options as the view
    res.render('strict', {
      layout: 'layout',
      value: 'ok'
    })
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

  strictApp = createApp(hbs.create(null, { compileOptions: { strict: true } }))
  noEscapeApp = createApp(hbs.create(null, { compileOptions: { noEscape: true } }))
  plainApp = createApp(hbs.create())
})

test('compileOptions defaults to an empty object', function () {
  assert.deepEqual(hbs.compileOptions, {})
  assert.deepEqual(hbs.create().compileOptions, {})
  assert.deepEqual(hbs.create(null, {}).compileOptions, {})
})

test('compileOptions is taken from create()', function () {
  var instance = hbs.create(null, { compileOptions: { strict: true } })
  assert.deepEqual(instance.compileOptions, { strict: true })
})

test('compile() honours compileOptions', function () {
  var instance = hbs.create(null, { compileOptions: { noEscape: true } })
  assert.strictEqual(instance.compile('{{x}}')({ x: '<b>' }), '<b>')
  assert.strictEqual(hbs.compile('{{x}}')({ x: '<b>' }), '&lt;b&gt;')
})

test('compileOptions can be changed after creation', function () {
  var instance = hbs.create()
  assert.strictEqual(instance.compile('{{x}}')({ x: '<b>' }), '&lt;b&gt;')
  instance.compileOptions = { noEscape: true }
  assert.strictEqual(instance.compile('{{x}}')({ x: '<b>' }), '<b>')
})

test('strict: renders when the field is present', function (done) {
  request(strictApp)
    .get('/strict/present')
    .expect(200, '<p>ok</p>\n', done)
})

test('strict: errors when the field is missing', function (done) {
  request(strictApp)
    .get('/strict/missing')
    .expect(500, /"value" not defined/, done)
})

test('strict: applies to layouts too', function (done) {
  request(strictApp)
    .get('/strict/layout')
    .expect(500, /"title" not defined/, done)
})

test('noEscape: renders raw html', function (done) {
  request(noEscapeApp)
    .get('/')
    .expect(200, '<p><b>bold</b></p>\n', done)
})

test('default instance still escapes html', function (done) {
  request(plainApp)
    .get('/')
    .expect(200, '<p>&lt;b&gt;bold&lt;/b&gt;</p>\n', done)
})
