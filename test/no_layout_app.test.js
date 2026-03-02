const path = require('node:path');
const fs = require('node:fs');
const request = require('supertest');
const express = require('express');
const hbs = require('../');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('express 4.x no layout', () => {
  let app;

  beforeAll(() => {
    app = express();

    // manually set render engine, under normal circumstances this
    // would not be needed as hbs would be installed through npm
    app.engine('hbs', hbs.__express);

    // set the view engine to use handlebars
    app.set('view engine', 'hbs');
    app.set('views', path.join(__dirname, 'views'));

    app.locals.hbs = hbs;

    app.set('view options', {
      layout: false,
    });

    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', function (req, res) {
      res.render('no_layout', {
        title: 'Express Handlebars Test',
      });
    });

    app.get('/with_layout', function (req, res) {
      res.render('blank', {
        layout: 'layout',
        title: 'Express Handlebars Test',
      });
    });

    app.get('/layout_cache', function (req, res, next) {
      res.render(
        'blank',
        {
          layout: 'layout',
          cache: true,
          title: 'Express Handlebars Test',
        },
        function (error, body) {
          if (error) return next(error);
          const file = path.join(process.cwd(), 'test', 'views', 'layout.hbs');
          if (hbs.cache[file]) {
            res.send(body);
          } else {
            res.send('not cached!');
          }
        },
      );
    });
  });

  test('index', async () => {
    const expected = fs.readFileSync(
      path.join(FIXTURES_DIR, 'index_no_layout.html'),
      'utf8',
    );
    await request(app).get('/').expect(expected);
  });

  test('index w/layout', async () => {
    const expected = fs.readFileSync(
      path.join(FIXTURES_DIR, 'index_no_layout.html'),
      'utf8',
    );
    await request(app).get('/with_layout').expect(expected);
  });

  test('index layout cache', async () => {
    const expected = fs.readFileSync(
      path.join(FIXTURES_DIR, 'index_no_layout.html'),
      'utf8',
    );
    await request(app).get('/layout_cache').expect(expected);
  });
});
