unreleased
==========

  * deps: handlebars@4.5.3
    - 4.5.3
      - Fix: add "no-prototype-builtins" eslint-rule and fix all occurences
      - Fix: add more properties required to be enumerable
      - Security: The properties __proto__, __defineGetter__, __defineSetter__ and __lookupGetter__ have been added to the list of "properties that must be enumerable". If a property by that name is found and not enumerable on its parent, it will silently evaluate to undefined. This is done in both the compiled template and the "lookup"-helper. This will prevent new Remote-Code-Execution exploits that have been published recently.
    - 4.5.2
      - Fix: use String(field) in lookup when checking for "constructor"
    - 4.5.1
      - Fix: move "eslint-plugin-compat" to devDependencies
    - 4.5.0
      - Fix: Use objects for hash value tracking
    - 4.4.5
      - Fix: Contents of raw-blocks must be matched with non-eager regex-matching
    - 4.4.4
      - Fix: prevent zero length tokens in raw-blocks
    - https://www.npmjs.com/advisories/1300
    - https://www.npmjs.com/advisories/1316
    - https://www.npmjs.com/advisories/1324
    - https://www.npmjs.com/advisories/1325

4.0.6 / 2019-10-09
==================

  deps: handlebars@4.3.5
    - Fix error object inheritance
    - Fix work-around for `constructor` blocking

4.0.5 / 2019-09-27
==================

  * Fix async helpers not working when cache enabled
  * Fix handling of exceptions from layout
  * Fix handling of exceptions when cache enabled
  * deps: handlebars@4.3.3
    - Block calling `helperMissing` and `blockHelperMissing` from templates
    - Fix work-around for `constructor` blocking
  * deps: walk@2.3.14

4.0.4 / 2019-04-14
==================

  * deps: handlebars@4.0.14
    - Block `constructor` property using `lookup`

4.0.3 / 2019-03-01
==================

  * Fix path for partials multiple dirs deep on Windows

4.0.2 / 2019-02-18
==================

  * deps: handlebars@4.0.13

4.0.1 / 2016-09-18
==================

  * Support params for async helper
  * deps: handlebars@4.0.5
  * deps: walk@2.3.9

4.0.0 / 2015-11-02
==================

  * Fix caching of non default filename layouts
  * deps: handlebars@4.0.3

3.1.1 / 2015-09-11
==================

  * Fix `localsAsTemplateData` when cache is enabled

3.1.0 / 2015-06-10
==================

  * Make `@data` available to layouts

3.0.1 / 2015-03-12
==================

  * Fix using custom extensions when using view engine layouts

3.0.0 / 2015-03-09
==================

  * deps: handlebars@3.0.0

2.9.0 / 2015-03-06
==================

  * Scope internal async tracker to per middleware
  * Support multiple view folders from Express

2.8.0 / 2014-12-26
==================

  * Scope internal async tracker to per hbs instance
  * deps: handlebars@2.0.0

2.7.0 / 2014-06-02
==================

  * Fix registering directories of partials on Windows
  * Add API to expose locals as template data

2.6.0 / 2014-04-06
==================

  * Fix support for custom handlebars instance

2.5.0 / 2014-02-19
==================

  * deps: handlebars@1.3.0

2.4.0 / 2013-09-13
==================

  * Add support for multi-level partial paths

2.3.1 / 2013-08-01
==================

  * deps: after@0.8.1
  * deps: handlebars@1.0.12

2.3.0 / 2013-05-30
==================

  * Add `registerPartials`

2.1.0 / 2013-03-19
==================

  * Add `create` for multiple instances

2.0.2 / 2013-02-21
==================

  * deps: handlebars@1.0.9

2.0.1 / 2012-11-30
==================

  * Ignore layout error when not using layout

2.0.0 / 2012-11-21
==================

  * deps: handlebars@1.0.7
