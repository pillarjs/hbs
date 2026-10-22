# hbs

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Linux Build][github-actions-ci-image]][github-actions-ci-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![Test Coverage][coveralls-image]][coveralls-url]

[Express.js](https://expressjs.com/) view engine for
[handlebars.js](https://handlebarsjs.com/)

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```bash
$ npm install hbs
```

## Use ##

Using *hbs* as the default view engine requires just one line of code in your app setup. This will render `.hbs` files when `res.render` is called.

```javascript
app.set('view engine', 'hbs');
```

To use a different extension (i.e. html) for your template files:

```javascript
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
```

## Security ##

hbs is a thin wrapper around [handlebars](https://handlebarsjs.com/), so its
[prototype-access security options](https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access)
apply. Two points are worth calling out:

- **Prototype access.** For backward compatibility, hbs 4.x renders with
  `allowProtoMethodsByDefault` and `allowProtoPropertiesByDefault` set to `true`,
  which is less strict than handlebars' own defaults (`false`). Unless your
  templates need to read inherited (prototype) members from the data, restore the
  safer defaults by setting both to `false` through [Runtime options](#runtime-options).
  These defaults are expected to change in the next major version of hbs.
- **HTML escaping.** `{{expression}}` output is HTML-escaped by default. Do not
  enable `noEscape` (see [Compile options](#compile-options)) for untrusted data.

In all cases, treat both the template and the template context as trusted input:
do not compile templates from, or render untrusted data through, untrusted sources.

## Helpers and Partials ##

hbs exposes the `registerHelper` and `registerPartial` method from handlebars.

```javascript
var hbs = require('hbs');

hbs.registerHelper('helper_name', function (options) { return 'helper value'; });
hbs.registerPartial('partial_name', 'partial value');
```

For convenience, `registerPartials` provides a quick way to load all partials from a specific directory:

```javascript
var hbs = require('hbs');

hbs.registerPartials(__dirname + '/views/partials', function (err) {});
```

Partials that are loaded from a directory are named based on their filename, where spaces and hyphens are replaced with an underscore character:

```
template.html      -> {{> template}}
template 2.html    -> {{> template_2}}
login view.hbs     -> {{> login_view}}
template-file.html -> {{> template_file}}
```

See the [handlebars.js documentation](https://handlebarsjs.com/) for more
information.

The way the file is renamed to a partial name can be adjusted by providing a `rename` option. The function will receive the file path relative to the registered directory and without the file extension. If the returned value contains any whitespace, those characters are replaced with a corresponding underscore character.

```js
var hbs = require('hbs')

hbs.registerPartials(path.join(__dirname, '/views/partials'), {
  rename: function (name) {
    // all non-word characters replaced with underscores
    return name.replace(/\W/g, '_')
  }
})
```

**Note:** This method is async; meaning that the directory is walked in a non-blocking manner to app startup.

## Layouts ##

When a `layout` file with the same extension as the view (for example `views/layout.hbs`) exists in one of your `views` directories, hbs renders the view first and then renders the layout with the view's output available as `body`. Use the triple-stash so the HTML is not escaped:

```handlebars
<html>
  <head><title>{{title}}</title></head>
  <body>{{{body}}}</body>
</html>
```

The layout receives the same locals as the view, so `title` above can be set from `res.render`. If no default layout file exists the view is rendered on its own.

The `layout` option controls this behaviour. It can be set per render, or app-wide through Express' `view options`; a value given to `res.render` wins over the app-wide one.

```javascript
// use views/admin.hbs as the layout for this render
res.render('dashboard', { layout: 'admin' });

// render this view without any layout
res.render('home', { layout: false });

// turn the automatic layout off for every view
app.set('view options', { layout: false });

// use views/main.hbs as the layout for every view
app.set('view options', { layout: 'main' });
```

A layout name is resolved relative to each `views` directory, and the view extension is appended unless the name already has one. Asking for a layout that does not exist is a render error, while a missing default `layout` file is silently skipped.

## Template inheritance ##

Handlebars supports template inheritance natively through [partial blocks](https://handlebarsjs.com/guide/partials.html#partial-blocks) and [inline partials](https://handlebarsjs.com/guide/partials.html#inline-partials), so you can build reusable, nested layouts without any extra hbs feature. Register your base layouts as partials, expose override points with `{{#> block}}`, and let child views fill them with `{{#*inline "block"}}`.

Register a `base` layout as a partial (for example from your partials directory, see [Helpers and Partials](#helpers-and-partials)):

```handlebars
<html>
  <head><title>{{title}}</title></head>
  <body>
    <main>{{#> content}}Default content{{/content}}</main>
  </body>
</html>
```

A child view inherits it and overrides the `content` block:

```handlebars
{{#> base title="Home"}}
  {{#*inline "content"}}<h1>Welcome {{name}}</h1>{{/inline}}
{{/base}}
```

A child that inherits from a partial layout already renders the whole page, so turn the automatic [layout](#layouts) off to avoid wrapping it twice, either per render:

```javascript
res.render('home', { layout: false, name: 'Alan' });
```

or for the whole app:

```javascript
app.set('view options', { layout: false });
```

Blocks a child does not override keep the parent default, and because partials can include other partials, layouts nest to any depth. For example, a `two-column` partial can inherit from `base`, fill its `content` block and expose `sidebar` and `main` blocks of its own:

```handlebars
{{#> base}}
  {{#*inline "content"}}
    <aside>{{#> sidebar}}Default sidebar{{/sidebar}}</aside>
    <section>{{#> main}}{{/main}}</section>
  {{/inline}}
{{/base}}
```

A view can then inherit from `two-column` and fill those blocks:

```handlebars
{{#> two-column title="Docs"}}
  {{#*inline "sidebar"}}<nav>Docs menu</nav>{{/inline}}
  {{#*inline "main"}}<h1>Welcome {{name}}</h1>{{/inline}}
{{/two-column}}
```

## Exposing locals as template data ##

hbs has the ability to expose the application and request locals within any context inside a view. To enable this functionality, simply call the `localsAsTemplateData` method and pass in your Express application instance.

```javascript
var hbs = require('hbs');
var express = require('express');

var app = express();
hbs.localsAsTemplateData(app);

app.locals.foo = "bar";
```

The local data can then be accessed using the `@property` syntax:

```
top level: {{@foo}}
{{#each items}}
  {{label}}: {{@foo}}
{{/each}}
```
Note: In partials and templates, local data can be accessed without using `@` prefix.

## Reserved render data keys ##

A few keys in the data you pass to `res.render` are used internally by Express or by hbs, so avoid using them as your own template data:

- `settings`: Express's application settings; hbs reads the views directory from it to locate layouts.
- `cache`: Express's view-cache flag.
- `_locals`: Express's per-request locals.
- `layout`: hbs's [layout](#layouts) option.

If a `settings` property in your render data overwrites Express's, hbs cannot resolve your layout and throws a descriptive error. Rename the conflicting property.

## handlebars ##

The handlebars require used by hbs can be accessed via the `handlebars` property on the `hbs` module.

If you wish to use handlebars methods like `SafeString` please do so on this property. Do not register helpers or partials in this way.

```
// hbs.handlebars is the handlebars module
hbs.handlebars === require('handlebars');
```

## Compile options ##

Options for [`handlebars.compile()`](https://handlebarsjs.com/api-reference/compilation.html)
(such as `strict`, `noEscape` or `preventIndent`) can be set per instance. They apply to
every view and layout compiled by that instance.

```
var hbs = require('hbs');

var instance = hbs.create(null, {
  compileOptions: { strict: true }
});

app.engine('hbs', instance.__express);
```

Note that `noEscape: true` disables HTML escaping for every `{{expression}}` rendered by the
instance, so only use it when the data is trusted.

The options are also exposed as the `compileOptions` property, which can be changed at any
time (compiled templates already in the cache are not affected):

```
hbs.compileOptions = { noEscape: true };
```

## Runtime options ##

[Runtime options](https://handlebarsjs.com/api-reference/runtime-options.html) passed to the
compiled template at render time can be set per instance. The most relevant ones are the
prototype-access controls.

For backward compatibility, hbs renders with `allowProtoMethodsByDefault: true` and
`allowProtoPropertiesByDefault: true`, which is less strict than handlebars' own defaults
(`false`). If your templates do not need to read inherited (prototype) properties or methods
from the data, you can restore the safer handlebars defaults:

```
var hbs = require('hbs');

var instance = hbs.create(null, {
  runtimeOptions: {
    allowProtoMethodsByDefault: false,
    allowProtoPropertiesByDefault: false
  }
});

app.engine('hbs', instance.__express);
```

To keep the safer defaults but still allow a few known inherited members, use handlebars'
`allowedProtoProperties` / `allowedProtoMethods` allowlists instead of re-enabling everything:

```
hbs.create(null, {
  runtimeOptions: {
    allowProtoPropertiesByDefault: false,
    allowedProtoProperties: { myField: true }
  }
});
```

As with `compileOptions`, the options are exposed as the `runtimeOptions` property and can be
changed at any time:

```
hbs.runtimeOptions = { allowProtoPropertiesByDefault: false };
```

Regardless of these options, do not render untrusted data as the template context.

## Recipes ##

### more than one instance ###
You can create isolated instances of hbs using the `create()` function on the module object.

```
var hbs = require('hbs');

var instance1 = hbs.create();
var instance2 = hbs.create();

app.engine('html', instance1.__express);
app.engine('hbs', instance2.__express);
```

Each instance has the same methods/properties as the `hbs` module object. The module object is actually just an instance created for you automatically.

### extra scripts or styles ##
Sometimes it is useful to have custom scripts or stylesheets on your pages. If your layout is a partial, use a partial block for this (see [Template inheritance](#template-inheritance)). If you rely on hbs's automatic layout instead, the layout is not a partial, so a pair of helpers can create a similar result.

We can take advantage of the fact that our body template is processed before the layout template. Knowing this, we can create two helpers `block` and `extend` which can be used to 'inject' custom stylesheets or scripts into the layout template. The `block` helper will act as a placeholder for values specified in earlier `extend` helpers.

See examples/extend for a working example. Note how the index.hbs file defines extra stylesheets and scripts to be injected into the layout. They are put into the head section and at the end of the body respectively. If this was not done, the stylesheet would be in the body and the script would print `foo bar` too soon.

## Helpful Modules ##

- **[hbs-utils](https://www.npmjs.com/package/hbs-utils)**: A small utility
  library that provides helpers for registering and compiling partials
  including automatic updates when partials are changed.

[appveyor-image]: https://badgen.net/appveyor/ci/dougwilson/nodejs-hbs/master?label=windows
[appveyor-url]: https://ci.appveyor.com/project/dougwilson/nodejs-hbs
[coveralls-image]: https://badgen.net/coveralls/c/github/pillarjs/hbs/master
[coveralls-url]: https://coveralls.io/r/pillarjs/hbs?branch=master
[github-actions-ci-image]: https://badgen.net/github/checks/pillarjs/hbs/master?label=linux
[github-actions-ci-url]: https://github.com/pillarjs/hbs/actions?query=workflow%3Aci
[node-image]: https://badgen.net/npm/node/hbs
[node-url]: https://nodejs.org/en/download/
[npm-downloads-image]: https://badgen.net/npm/dm/hbs
[npm-url]: https://npmjs.org/package/hbs
[npm-version-image]: https://badgen.net/npm/v/hbs
