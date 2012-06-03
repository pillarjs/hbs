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

## Recipes ##

### extra scripts or styles

Sometimes it is useful to have custom scripts or stylesheets on your pages. Handlebars does not provide a way to import or extend a template, but through the use of helpers you can create a similar result.

We can take advantage of the fact that our body template is processed before the layout template. Knowing this, we can create two helpers `block` and `extend` which can be used to 'inject' custom stylesheets or scripts into the layout template. The `block` helper will act as a placeholder for values specified in earlier `extend` helpers.

See examples/extend for a working example. Note how the index.hbs file defines extra stylesheets and scripts to be injected into the layout. They are put into the head section and at the end of the body respectively. If this was not done, the stylesheet would be in the body and the script would print `foo bar` too soon.

