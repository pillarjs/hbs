var path = require('path')
var request = require('supertest')
var utils = require('../support/utils')

// builtin
var assert = require('assert');

// local
var hbs = require('../../')

var unsafeApp = null
var safeApp = null

suite('express 4.x runtime options')

function createApp(instance) {
  var express = require('express')
  var app = express()

  app.engine('hbs', instance.__express)
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.get('/proto', function (req, res) {
    res.render('proto', {
      layout: false,
      value: Object.create({ inherited: 'PROTO' })
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

  unsafeApp = createApp(hbs.create())
  safeApp = createApp(hbs.create(null, {
    runtimeOptions: { allowProtoPropertiesByDefault: false }
  }))
})

test('runtimeOptions defaults to an empty object', function () {
  assert.deepEqual(hbs.runtimeOptions, {})
  assert.deepEqual(hbs.create().runtimeOptions, {})
  assert.deepEqual(hbs.create(null, {}).runtimeOptions, {})
})

test('runtimeOptions is taken from create()', function () {
  var instance = hbs.create(null, {
    runtimeOptions: { allowProtoPropertiesByDefault: false }
  })
  assert.deepEqual(instance.runtimeOptions, { allowProtoPropertiesByDefault: false })
})

test('default render allows prototype property access (legacy default)', function (done) {
  request(unsafeApp)
    .get('/proto')
    .expect(200, '<p>PROTO</p>\n', done)
})

test('runtimeOptions can restore handlebars safe prototype defaults', function (done) {
  request(safeApp)
    .get('/proto')
    .expect(200, '<p></p>\n', done)
})
