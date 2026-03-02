const path = require('node:path');
const fs = require('node:fs');
const request = require('supertest');
const express = require('express');
const hbsFactory = require('../');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('express 4.x async helpers', () => {
  let app;

  beforeAll(() => {
    const hbs = hbsFactory.create();

    app = express();

    // manually set render engine, under normal circumstances this
    // would not be needed as hbs would be installed through npm
    app.engine('hbs', hbs.__express);

    // set the view engine to use handlebars
    app.set('view cache', true);
    app.set('view engine', 'hbs');
    app.set('views', path.join(__dirname, 'views'));

    app.use(express.static(path.join(__dirname, 'public')));

    // value for async helper
    // it will be called a few times from the template
    let indx = 0;
    const vals = ['foo', 'bar', 'baz'];
    hbs.registerAsyncHelper('async', function (context, cb) {
      const prefix = this.prefix || '';

      process.nextTick(function () {
        cb(prefix + vals[indx++ % 3]);
      });
    });

    hbs.registerAsyncHelper('async-title', function (context, cb) {
      process.nextTick(function () {
        cb('Async Title');
      });
    });

    hbs.registerAsyncHelper('async-with-params', function (a, b, ctx, cb) {
      process.nextTick(function () {
        const val = a + b;
        cb(val);
      });
    });

    // fake async helper, returns immediately
    // although a regular helper could have been used we should support this use case
    let count = 0;
    hbs.registerAsyncHelper('fake-async', function (context, cb) {
      const val = 'instant' + count++;
      cb(val);
    });

    app.get('/', function (req, res) {
      res.render('async', {
        layout: false,
        prefix: '* ',
      });
    });

    app.get('/fake-async', function (req, res) {
      res.render('fake-async', {
        layout: false,
      });
    });

    app.get('/async-with-params', function (req, res) {
      res.render('async-with-params', {
        layout: false,
      });
    });

    app.get('/async-with-layout', function (req, res) {
      res.render('async');
    });

    app.get('/layout-with-async', function (req, res) {
      res.render('async', {
        layout: 'layout_async',
      });
    });
  });

  test('index', async () => {
    const expected = fs.readFileSync(
      path.join(FIXTURES_DIR, 'async.html'),
      'utf8',
    );
    await request(app).get('/').expect(expected);
  });

  test('async', async () => {
    const expected = fs.readFileSync(
      path.join(FIXTURES_DIR, 'fake-async.html'),
      'utf8',
    );
    await request(app).get('/fake-async').expect(expected);
  });

  test('cached', async () => {
    const expected = fs.readFileSync(
      path.join(FIXTURES_DIR, 'async.html'),
      'utf8',
    );
    await request(app).get('/').expect(expected);
  });

  test('async-with-params', async () => {
    const expected = fs.readFileSync(
      path.join(FIXTURES_DIR, 'async-with-params.html'),
      'utf8',
    );
    await request(app).get('/async-with-params').expect(expected);
  });

  test('async-with-layout', async () => {
    const expected = fs.readFileSync(
      path.join(FIXTURES_DIR, 'async-with-layout.html'),
      'utf8',
    );
    await request(app).get('/async-with-layout').expect(expected);
  });

  test('layout-with-async', async () => {
    const expected = fs.readFileSync(
      path.join(FIXTURES_DIR, 'layout-with-async.html'),
      'utf8',
    );
    await request(app).get('/layout-with-async').expect(expected);
  });
});
