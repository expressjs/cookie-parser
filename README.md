# cookie-parser

[![NPM Version][npm-version-image]][npm-url]
[![NPM Downloads][npm-downloads-image]][npm-url]
[![Build Status][ci-image]][ci-url]
[![Test Coverage][coveralls-image]][coveralls-url]

## Features
- Parse `Cookie` header and populate `req.cookies` with an object keyed by the
cookie names.
- JSON cookie parsing support

Optionally, when `secret` is provided:
- Signed cookie parsing support
- Encrypted cookie parsing support
- Multiple secrets support
- The `secret` is assigned to `req.secret` so it may be used by other middleware.
- The `secretEncoding`, if provided, is assigned to `req.secretEncoding` so it may be used by other middleware.

## Installation

```sh
$ npm install cookie-parser
```

Yarn
```sh
$ yarn add cookie-parser
```

## API

```js
var cookieParser = require('cookie-parser')
```

ESM
```js
import cookieParser from 'cookie-parser'
```

### **cookieParser(secret, options)**

Create a new cookie parser middleware function using the given `secret` and
`options`.

- `secret` (string | array) *Optional* - used for signing cookies. If not
  specified, signed and encrypted cookies will not be parsed. If a string is
  provided, this is used as the secret. If an array is provided, an attempt
  will be made to unsign the cookie with each secret in order.
- `options` (object) passed to `cookie.parse` as the second option. See
  [cookie](https://www.npmjs.org/package/cookie) for more information.
  - `decode` a function to decode the value of the cookie
  - `secretEncoding` the string encoding scheme for all the secrets. Default is
  'utf8'. Examples: 'hex', 'utf8', 'base64'. See
  [Nodejs crypto.BufferEncoding](https://nodejs.org/api/buffer.html#buffers-and-character-encodings) for more info.

The middleware will parse the `Cookie` header on the request and expose the
cookie data as the property `req.cookies` and, if a `secret` was provided, as
the property `req.signedCookies`. These properties are name value pairs of the
cookie name to cookie value.

When `secret` is provided, this module will unsign and validate any signed cookie
values, decrypt them if they were encrypted, and move those name value pairs from `req.cookies` into `req.signedCookies`.
A signed cookie is a cookie that has a value prefixed with `s:`. An encrypted cookie
has the prefix `e:`. Signed cookies that fail signature validation will have the value `false` instead of the tampered value. Encrypted cookies are also expected to be signed
and will return false if signature validation or decryption returns false.

In addition, this module supports special "JSON cookies". These are cookie where
the value is prefixed with `j:`. When these values are encountered, the value will
be exposed as the result of `JSON.parse`. If parsing fails, the original value will
remain.

### **cookieParser.JSONCookie(str)**

Parse a cookie value as a JSON cookie. This will return the parsed JSON value
if it was a JSON cookie, otherwise, it will return the passed value.

### **cookieParser.JSONCookies(cookies)**

Given an object, this will iterate over the keys and call `JSONCookie` on each
value, replacing the original value with the parsed value. This returns the
same object that was passed in.

### **cookieParser.signedCookie(str, secret, secretEncoding)**

Parse a cookie value as a signed cookie. This will return the parsed unsigned
value if it was a signed cookie and the signature was valid. If the value was
not signed, the original value is returned. If the value was signed but the
signature could not be validated, `false` is returned. If the value was
encrypted and did not pass signature validation or decryption, `false` is
returned.

- `str` (string) cookie value to parse
- `secret` (array | string) If a string is provided, this is used as the secret.
If an array is provided, an attempt will be made to unsign the cookie with each
secret in order.
- `secretEncoding` (string) *Optional*: the string encoding scheme for the secret(s).
  Default is 'utf8'. Examples: 'hex', 'utf8', 'base64'. See
  [Nodejs crypto.BufferEncoding](https://nodejs.org/api/buffer.html#buffers-and-character-encodings) for more info.

### **cookieParser.signedCookies(cookies, secret, secretEncoding)**

Given an object, this will iterate over the keys and check if any value is a
signed or encrypted cookie. If it is a signed cookie and the signature is valid,
or it is an encrypted cookie, whose signature is valid and can be decrypted by the
secret(s) provided, the key will be deleted from the object and added to the new object that is returned.

- `cookies` (object) object to iterate over
- `secret` (array | string) If a string is provided, this
is used as the secret. If an array is provided, an attempt will be made to
unsign the cookie with each secret in order.
- `secretEncoding` (string) *Optional*: the string encoding scheme for the secret(s).
  Default is 'utf8'. Examples: 'hex', 'utf8', 'base64'. See
  [Nodejs crypto.BufferEncoding](https://nodejs.org/api/buffer.html#buffers-and-character-encodings) for more info.
## Example

```js
var express = require('express')
var cookieParser = require('cookie-parser')

var app = express()
app.use(cookieParser())

app.get('/', function (req, res) {
  // Cookies that have not been signed
  console.log('Cookies: ', req.cookies)

  // Cookies that have been signed
  console.log('Signed Cookies: ', req.signedCookies)
})

app.listen(8080)

// curl command that sends an HTTP request with two cookies
// curl http://127.0.0.1:8080 --cookie "Cho=Kim;Greet=Hello"
```

## License

[MIT](LICENSE)

[ci-image]: https://badgen.net/github/checks/expressjs/cookie-parser/master?label=ci
[ci-url]: https://github.com/expressjs/cookie-parser/actions?query=workflow%3Aci
[coveralls-image]: https://badgen.net/coveralls/c/github/expressjs/cookie-parser/master
[coveralls-url]: https://coveralls.io/r/expressjs/cookie-parser?branch=master
[npm-downloads-image]: https://badgen.net/npm/dm/cookie-parser
[npm-url]: https://npmjs.org/package/cookie-parser
[npm-version-image]: https://badgen.net/npm/v/cookie-parser
