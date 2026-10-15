const path = require('node:path')
const request = require('supertest')
const express = require('express')
const hbsFactory = require('../')

// Regression test for GHSA-3c55-w9jx-p5jr / CVE-2026-87123.
//
// The DoS was that handlebars' escapeExpression had a SafeString fast path
// which called `value.toHTML()` for any value with a *truthy* `toHTML`, without
// checking that it was callable. An async helper resolving on a later tick to
// an object with a truthy non-callable `toHTML` (trivially produced by
// JSON.parse, since JSON cannot carry functions) made escapeExpression throw a
// TypeError, and on hbs 4.3.0 that throw ran outside the render try/catch and
// crashed the process.
//
// Two layers now prevent this:
//   1. handlebars 4.7.10 fixed the root cause: escapeExpression now checks
//      `typeof value.toHTML === 'function'`, so a JSON-sourced `toHTML` key is
//      escaped like any other object instead of being invoked.
//   2. The promise-based async pipeline routes any substitution throw through
//      processAsyncResults' .catch to the render callback, so it surfaces as a
//      normal render error (HTTP 500) the application can handle, never a crash.
describe('async helper output escaping (GHSA-3c55-w9jx-p5jr)', () => {
  let app

  beforeAll(() => {
    const hbs = hbsFactory.create()

    app = express()
    app.engine('hbs', hbs.__express)
    app.set('view engine', 'hbs')
    app.set('views', path.join(__dirname, 'views'))

    // the exact advisory payload: a truthy non-callable `toHTML`, as produced
    // by JSON.parse('{"toHTML":"x"}') from untrusted input, resolved on a later
    // tick (the normal registerAsyncHelper case)
    hbs.registerAsyncHelper('async-tohtml', function (context, cb) {
      process.nextTick(function () {
        cb(JSON.parse('{"toHTML":"x"}'))
      })
    })

    // a callable `toHTML` that throws, to exercise the pipeline's .catch safety
    // net directly (independent of the handlebars 4.7.10 fix)
    hbs.registerAsyncHelper('async-throwing', function (context, cb) {
      process.nextTick(function () {
        cb({ toHTML: function () { throw new Error('boom') } })
      })
    })

    app.get('/async-tohtml', function (req, res) {
      res.render('async-tohtml', { layout: false })
    })

    app.get('/async-throwing', function (req, res) {
      res.render('async-throwing', { layout: false })
    })

    app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
      res.status(500).send(err.message)
    })
  })

  // handlebars 4.7.10 escapes the JSON-sourced `toHTML` key as a plain object
  // instead of invoking it, so the advisory payload renders safely and the
  // process does not crash
  test('a non-callable toHTML async value renders safely without crashing', async () => {
    await request(app)
      .get('/async-tohtml')
      .expect(200, '[object Object]\n')
  })

  // even if escaping throws during async substitution, the promise .catch turns
  // it into a handled render error rather than an uncaught exception
  test('a throw during async substitution becomes a handled render error', async () => {
    await request(app)
      .get('/async-throwing')
      .expect(500, /boom/)
  })
})
