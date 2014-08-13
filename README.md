# cookie-parser

[![NPM Version](https://badge.fury.io/js/cookie-parser.svg)](https://badge.fury.io/js/cookie-parser)
[![Build Status](https://travis-ci.org/expressjs/cookie-parser.svg?branch=master)](https://travis-ci.org/expressjs/cookie-parser)
[![Coverage Status](https://img.shields.io/coveralls/expressjs/cookie-parser.svg?branch=master)](https://coveralls.io/r/expressjs/cookie-parser)

Parse `Cookie` header and populate `req.cookies` with an object keyed by the cookie
names. Optionally you may enable signed cookie support by passing a `secret` string,
which assigns `req.secret` so it may be used by other middleware.

## Installation

```sh
$ npm install cookie-parser
```

## API

```js
var express      = require('express')
var cookieParser = require('cookie-parser')

var app = express()
app.use(cookieParser())
```

### cookieParser(secret, options)

- `secret` a string used for signing cookies. This is optional and if not specified, will not parse signed cookies.
- `options` an object that is passed to `cookie.parse` as the second option. See [cookie](https://www.npmjs.org/package/cookie) for more information.
  - `decode` a function to decode the value of the cookie

### cookieParser.JSONCookie(str)

Parse a cookie value as a JSON cookie. This will return the parsed JSON value if it was a JSON cookie, otherwise it will return the passed value.

### cookieParser.JSONCookies(cookies)

Given an object, this will iterate over the keys and call `JSONCookie` on each value. This will return the same object passed in.

### cookieParser.signedCookie(str, secret)

Parse a cookie value as a signed cookie. This will return the parsed unsigned value if it was a signed cookie and the signature was valid, otherwise it will return the passed value.

### cookieParser.signedCookies(cookies, secret)

Given an object, this will iterate over the keys and check if any value is a signed cookie. If it is a signed cookie and the signature is valid, the key will be deleted from the object and added to the new object that is returned.

## Examples

```js
var http         = require('http')
var express      = require('express')
var cookieParser = require('cookie-parser')
var port         = process.env.PORT || 8080
var server       = null

var app = express()
app.use(cookieParser())

app.get('/', function(req, res) {
  console.log("Cookies: ", req.cookies)
  res.end()
})

server = http.createServer(app)
server.listen(port, function() {
  console.log("Listening on port: ", port)
})

// curl command that sends an HTTP request with two cookies
// curl http://127.0.0.1:8080 --cookie "Cho=Kim;Greet=Hello"
```

### [The MIT License (MIT)](LICENSE)