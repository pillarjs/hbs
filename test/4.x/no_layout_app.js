// builtin
var fs = require('fs');
var assert = require('assert');
var root = process.cwd();
var path = require('path');

// 3rd party
var request = require('request');

var app = null

before(function () {
  var express = require('express')
  var hbs = require('../../')

  app = express()

  // manually set render engine, under normal circumstances this
  // would not be needed as hbs would be installed through npm
  app.engine('hbs', hbs.__express)

  // set the view engine to use handlebars
  app.set('view engine', 'hbs')
  app.set('views', path.join(__dirname, 'views'))

  app.locals.hbs = hbs

  app.set('view options', {
    layout: false
  })

  app.use(express.static(path.join(__dirname, 'public')))

  app.get('/', function (req, res) {
    res.render('no_layout', {
      title: 'Express Handlebars Test'
    })
  })

  app.get('/with_layout', function (req, res) {
    res.render('blank', {
      layout: 'layout',
      title: 'Express Handlebars Test'
    })
  })

  app.get('/layout_cache', function (req, res, next) {
    res.render('blank', {
      layout: 'layout',
      cache: true,
      title: 'Express Handlebars Test'
    }, function(error, body){
      if (error) return next(error)
      var file = path.join(root, 'test', '4.x', 'views', 'layout.hbs')
      if (hbs.cache[file]) {
        res.send(body)
      } else {
        res.send('not cached!')
      }
    })
  })
})

suite('express 4.x no layout')

test('index', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/index_no_layout.html', 'utf8');

    request('http://localhost:3000', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('index w/layout', function(done) {
  var server = app.listen(3000, function() {

    var expected = fs.readFileSync(__dirname + '/../fixtures/index_no_layout.html', 'utf8');

    request('http://localhost:3000/with_layout', function(err, res, body) {
      assert.equal(body, expected);
      server.close();
    });
  });

  server.on('close', function() {
    done();
  });
});

test('index layout cache', function(done) {
    var server = app.listen(3000, function() {

        var expected = fs.readFileSync(__dirname + '/../fixtures/index_no_layout.html', 'utf8');

        request('http://localhost:3000/layout_cache', function(err, res, body) {
            assert.equal(body, expected);
            server.close();
        });
    });

    server.on('close', function() {
        done();
    });
});

