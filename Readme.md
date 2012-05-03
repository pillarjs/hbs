# hbs #

[Express.js](http://github.com/visionmedia/express) view engine wrapper for
[handlebars.js](http://github.com/wycats/handlebars.js), an extension of
[Mustache](http://mustache.github.com/) template language.

[![Build Status](https://secure.travis-ci.org/donpark/hbs.png)](http://travis-ci.org/donpark/hbs)

## Why ##

While Handlbars.js is already a Node.js module, it cannot be used directly as
an Express.js view engine. This module will fill that role until Handlebars.js
adds Express.js view engine support directly.

## Installation ##

```
npm install hbs
```

## Usage ##

To set *hbs* as default view engine:

```javascript
app.set("view engine", "hbs");
```

## Examples ##

See `test/2.x/app.js` or `test/3.x/app.js` depending on your version of express.

## Issues ##

`__get__` function is not supported within block helper functions.

## Migrating to 1.0.0 ##

* Version number bumped to 1.0.0 to match `Handlebars` version.
* `Handlebars` is now loaded using `require` and is longer embedded.
* `hbs.handlebarsPath` was removed
* `registerHelper` and `registerPartial` methods are exported.

## Migrating from 0.0.3 from 0.0.2 ##

Handlebars' block-helpers now needs to be in `blockHelpers` (see example above) instead of `locals`.
