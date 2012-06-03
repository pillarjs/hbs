# hbs [![Build Status](https://secure.travis-ci.org/donpark/hbs.png)](http://travis-ci.org/donpark/hbs) #

[Express.js](http://github.com/visionmedia/express) view engine for
[handlebars.js](http://github.com/wycats/handlebars.js)

## Why ##

Because Handlebars.js is a nifty and simple templating language and makes a great fit for express templates.

## Installation ##

```
npm install hbs
```

## Usage ##

Using *hbs* as the default view engine requires just one line of code in your app setup. This will render `.hbs` files when `res.render` is called.

```javascript
app.set('view engine', 'hbs');
```

To use a different extension (i.e. html) for your template files:

```javascript
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
```

## Helpers and Partials ##

hbs exposes the `registerHelper` and `registerPartial` method from handlebars.

```javascript
var hbs = require('hbs');

hbs.registerHelper('helper_name', function(...) { ... });
hbs.registerPartial('partial_name', 'partial value');
```

See the [handlebars.js](http://github.com/wycats/handlebars.js) README and docs for more information.

