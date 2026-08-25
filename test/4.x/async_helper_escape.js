// @see https://github.com/pillarjs/hbs/security/advisories/GHSA-rg36-rxv9-2m9q

'use strict'

var assert = require('assert')
var fs = require('fs')
var os = require('os')
var path = require('path')
var rimraf = require('rimraf')

var PAYLOAD = '<script>alert(document.cookie)</script>'
var ESCAPED = '&lt;script&gt;alert(document.cookie)&lt;/script&gt;'

var tmpDir

function makeView (name, contents) {
  var view = path.join(tmpDir, name)
  fs.writeFileSync(view, contents)
  return view
}

function render (instance, viewPath, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  opts.settings = {
    views: tmpDir,
    'view options': { layout: false }
  }

  instance.__express(viewPath, opts, cb)
}

suite('async helper output escaping')

before(function () {
  // fs.mkdtempSync (Node >= 5.10) and os.tmpdir (Node >= 0.10) are not
  // available on every version in the CI matrix, so build the path by hand.
  var tmpBase = (os.tmpdir || os.tmpDir)()
  tmpDir = path.join(tmpBase, 'hbs-async-escape-' + process.pid + '-' + Date.now())
  fs.mkdirSync(tmpDir)
})

after(function (done) {
  rimraf(tmpDir, done)
})

test('sync helper output is HTML-escaped by {{...}} (baseline)', function (done) {
  var hbs = require('../../').create()
  hbs.registerHelper('userBio', function () { return PAYLOAD })
  render(hbs, makeView('sync-baseline.hbs', '{{userBio}}'), function (err, out) {
    if (err) return done(err)
    assert.strictEqual(out.trim(), ESCAPED)
    done()
  })
})

test('async helper output is HTML-escaped by {{...}} (uncached path)', function (done) {
  var hbs = require('../../').create()
  hbs.registerAsyncHelper('userBio', function (_opts, cb) { cb(PAYLOAD) })
  render(hbs, makeView('async-uncached.hbs', '{{userBio}}'), function (err, out) {
    if (err) return done(err)
    assert.strictEqual(out.trim(), ESCAPED)
    done()
  })
})

test('async helper output is HTML-escaped by {{...}} (cached path)', function (done) {
  var hbs = require('../../').create()
  hbs.registerAsyncHelper('userBio', function (_opts, cb) { cb(PAYLOAD) })
  var view = makeView('async-cached.hbs', '{{userBio}}')
  // First render populates the internal template cache.
  render(hbs, view, { cache: true }, function (err) {
    if (err) return done(err)
    assert.ok(hbs.cache[view], 'expected first render to cache the template')
    // Second render hits the cached template code path.
    render(hbs, view, { cache: true }, function (err, out) {
      if (err) return done(err)
      assert.strictEqual(out.trim(), ESCAPED)
      done()
    })
  })
})

test('async helper non-string values keep their pre-escaping text output', function (done) {
  var hbs = require('../../').create()
  hbs.registerAsyncHelper('nothing', function (_opts, cb) { cb(null) })
  hbs.registerAsyncHelper('missing', function (_opts, cb) { cb(undefined) })
  hbs.registerAsyncHelper('no', function (_opts, cb) { cb(false) })
  hbs.registerAsyncHelper('zero', function (_opts, cb) { cb(0) })
  render(hbs, makeView('async-nonstring.hbs', '[{{nothing}}][{{missing}}][{{no}}][{{zero}}]'), function (err, out) {
    if (err) return done(err)
    assert.strictEqual(out.trim(), '[null][undefined][false][0]')
    done()
  })
})

test('async helper output is HTML-escaped by {{...}} (layout path)', function (done) {
  var hbs = require('../../').create()
  hbs.registerAsyncHelper('userBio', function (_opts, cb) { cb(PAYLOAD) })
  var layout = makeView('layout.hbs', '<html><body>{{{body}}}</body></html>')
  var view = makeView('async-layout.hbs', '{{userBio}}')
  hbs.__express(view, {
    settings: {
      views: tmpDir,
      'view options': { layout: path.basename(layout, '.hbs') }
    }
  }, function (err, out) {
    if (err) return done(err)
    assert.ok(out.indexOf(ESCAPED) !== -1, 'expected escaped payload in layout output, got: ' + out)
    assert.ok(out.indexOf(PAYLOAD) === -1, 'expected raw payload absent from layout output, got: ' + out)
    done()
  })
})
