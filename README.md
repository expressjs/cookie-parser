# cookie-parser [![Build Status](https://travis-ci.org/expressjs/cookie-parser.svg?branch=master)](https://travis-ci.org/expressjs/cookie-parser) [![NPM Version](https://badge.fury.io/js/cookie-parser.svg)](https://badge.fury.io/js/cookie-parser)

Parse `Cookie` header and populate `req.cookies` with an object keyed by the cookie
names. Optionally you may enabled signed cookie support by passing a `secret` string,
which assigns `req.secret` so it may be used by other middleware.

## Install

```sh
$ npm install cookie-parser
```

## API

```js
var cookieParser = require('cookie-parser')
```

### cookieParser(secret)

- `secret` a string used for signing cookies. This is optional and if not specified, will not parse signed cookies.

## Example

```js
var cookieParser = require('cookie-parser');

connect()
 .use(cookieParser('optional secret string'))
 .use(function(req, res, next){
   res.end(JSON.stringify(req.cookies));
 })
```

## License

MIT
