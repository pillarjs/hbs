
/**
 * Module dependencies.
 */

var express = require('express');

/**
 *  HACK: Install local `hbs` view engine for testing purpose.
 *  
 *  This shouldn't be necessary for normal use of `hbs`.
 */
var hbs = require('../../lib/hbs');
express.view.register('.hbs', hbs);

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Handlebars Test Helpers and Partials

hbs.registerHelper('link_to', function(context) {
  return "<a href='" + context.url + "'>" + context.body + "</a>";
});

hbs.registerHelper('link_to2', function(title, context) {
  return "<a href='/posts" + context.url + "'>" + title + "</a>"
});

hbs.registerHelper('link', function(context, fn) {
  return '<a href="/people/' + this.__get__("id") + '">' + fn(this) + '</a>';
});
/*
<h3>Handlebars Block Helper Test</h3>
<ul>{{#people}}<li>{{#link}}{{name}}{{/link}}</li>{{/people}}</ul>
*/
hbs.registerPartial('link2', '<a href="/people/{{id}}">{{name}}</a>');

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express Handlebars Test',
    // basic test
    name: 'Alan',
    hometown: "Somewhere, TX",
    kids: [{"name": "Jimmy", "age": "12"}, {"name": "Sally", "age": "4"}],
    // path test
    person: { "name": "Alan" }, company: {"name": "Rad, Inc." },
    // escapee test
    escapee: '<jail>escaped</jail>',
    // helper test
    posts: [{url: "/hello-world", body: "Hello World!"}],
    // helper with string
    posts2: [{url: "/hello-world", body: "Hello World!"}],
    // block helper
    people: [
      { "name": "Alan", "id": 1 },
      { "name": "Yehuda", "id": 2 }
    ],
    // partial
    
  });
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
