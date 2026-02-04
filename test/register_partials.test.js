const path = require('node:path');
const request = require('supertest');
const express = require('express');
const hbsFactory = require('../');

describe('register partials', () => {
  test('render waits on register partials', async () => {
    const app = express();
    const hbs = hbsFactory.create();

    app.engine('hbs', hbs.__express);
    app.engine('html', hbs.__express);
    app.set('view engine', 'hbs');
    app.set('views', path.join(__dirname, 'views'));

    app.get('/', function (req, res) {
      hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
      res.render('partials', { layout: false });
    });

    await request(app)
      .get('/')
      .expect(
        'Test Partial 1Test Partial 2Test Partial 3Test Partial 4Test Partial 5',
      );
  });

  test('render waits on multiple register partials', async () => {
    const app = express();
    const hbs = hbsFactory.create();

    app.engine('hbs', hbs.__express);
    app.engine('html', hbs.__express);
    app.set('view engine', 'hbs');
    app.set('views', path.join(__dirname, 'views'));

    app.get('/', function (req, res) {
      hbs.registerPartials(path.join(__dirname, 'views', 'partials', 'subdir'));
      hbs.registerPartials(path.join(__dirname, 'views', 'partials'));
      res.render('partials', { layout: false });
    });

    await request(app)
      .get('/')
      .expect(
        'Test Partial 1Test Partial 2Test Partial 3Test Partial 4Test Partial 5',
      );
  });

  test('register partials callback', async () => {
    const hbs = hbsFactory.create();

    await new Promise((resolve, reject) => {
      hbs.registerPartials(path.join(__dirname, 'views', 'partials'), (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });

  test('register partials name', async () => {
    const app = express();
    const hbs = hbsFactory.create();

    hbs.registerPartials(path.join(__dirname, 'views', 'partials'), {
      rename: function (name) {
        return name.replace(/(^|\s)(\w)/g, function (s, p, c) {
          return p + c.toUpperCase();
        });
      },
    });

    app.engine('hbs', hbs.__express);
    app.engine('html', hbs.__express);
    app.set('view engine', 'hbs');
    app.set('views', path.join(__dirname, 'views'));

    app.get('/', function (req, res) {
      res.render('partials2', { layout: false });
    });

    await request(app)
      .get('/')
      .expect(
        'Test Partial 1Test Partial 2Test Partial 3Test Partial 4Test Partial 5',
      );
  });
});
