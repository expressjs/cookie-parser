
var assert = require('assert')
var cookieParser = require('..')
var http = require('http')
var request = require('supertest')
var signature = require('cookie-signature')
var cipher = require('symmetric-cipher.js')
/**
 * 'foobarbaz' encrypted and signed with 'keyboard cat'
 */
var signedCipher1 = '6JQ2n1bwxiuAUPaFpkBtqw==:FN4NRkW8yzMVti4WsN5c5Q==.F3J2iQnR3hnEpAukADFQdUgFjbdQnv50g+Yw1+IlYlk'
/**
 * 'foobar' encrypted and signed with 'keyboard cat'
 */
var signedCipher2 = 'dQgKRe263NFi8g1i2nS6YQ==:IqLvIuFB/0Ish5NlmI/tYw==.2Ge32QKb5pQR2XQQ0uD8iUNpKwfPniru9xOy2LZTYd4'
/**
 * 'foobar' encrypted and signed with 'nyan cat'
 */
var signedCipher3 = 'CQRD3Ccd327E9exNxBMCrQ==:v7CAQBa4umh7MFcCBPD7yA==.l1T6Rp6Rjs+GMuWU9cN5i4V4RUDsVwG7cp0KXRds2I8'

/**
 * cipher from signedCipher1 tampered and resigned
 */
var tamperedCipher = '6JQ2n1bwxiuAUPaFpkBtqw==:FN4NRkW8yzMVti4WsN5c12==.NfOQXrzxfUD8DyD2sk0E9iVq7OwS931eUza7HUEvYXo'

describe('cookieParser()', function () {
  it('should export JSONCookies function', function () {
    assert(typeof cookieParser.JSONCookies, 'function')
  })

  describe('when no cookies are sent', function () {
    it('should default req.cookies to {}', function (done) {
      request(createServer('keyboard cat'))
        .get('/')
        .expect(200, '{}', done)
    })

    it('should default req.signedCookies to {}', function (done) {
      request(createServer('keyboard cat'))
        .get('/signed')
        .expect(200, '{}', done)
    })
  })

  describe('when cookies are sent', function () {
    it('should populate req.cookies', function (done) {
      request(createServer('keyboard cat'))
        .get('/')
        .set('Cookie', 'foo=bar; bar=baz')
        .expect(200, '{"foo":"bar","bar":"baz"}', done)
    })

    it('should inflate JSON cookies', function (done) {
      request(createServer('keyboard cat'))
        .get('/')
        .set('Cookie', 'foo=j:{"foo":"bar"}')
        .expect(200, '{"foo":{"foo":"bar"}}', done)
    })

    it('should not inflate invalid JSON cookies', function (done) {
      request(createServer('keyboard cat'))
        .get('/')
        .set('Cookie', 'foo=j:{"foo":')
        .expect(200, '{"foo":"j:{\\"foo\\":"}', done)
    })
  })

  describe('when req.cookies exists', function () {
    it('should do nothing', function (done) {
      var _parser = cookieParser()
      var server = http.createServer(function (req, res) {
        req.cookies = { fizz: 'buzz' }
        _parser(req, res, function (err) {
          if (err) {
            res.statusCode = 500
            res.end(err.message)
            return
          }

          res.end(JSON.stringify(req.cookies))
        })
      })

      request(server)
        .get('/')
        .set('Cookie', 'foo=bar; bar=baz')
        .expect(200, '{"fizz":"buzz"}', done)
    })
  })

  describe('when a secret is given', function () {
    var val = signature.sign('foobarbaz', 'keyboard cat')
    // TODO: "bar" fails...

    it('should populate req.signedCookies', function (done) {
      request(createServer('keyboard cat'))
        .get('/signed')
        .set('Cookie', 'foo=s:' + val)
        .expect(200, '{"foo":"foobarbaz"}', done)
    })

    it('should remove the signed value from req.cookies', function (done) {
      request(createServer('keyboard cat'))
        .get('/')
        .set('Cookie', 'foo=s:' + val)
        .expect(200, '{}', done)
    })

    it('should omit invalid signatures', function (done) {
      var server = createServer('keyboard cat')

      request(server)
        .get('/signed')
        .set('Cookie', 'foo=' + val + '3')
        .expect(200, '{}', function (err) {
          if (err) return done(err)
          request(server)
            .get('/')
            .set('Cookie', 'foo=' + val + '3')
            .expect(200, '{"foo":"foobarbaz.CP7AWaXDfAKIRfH49dQzKJx7sKzzSoPq7/AcBBRVwlI3"}', done)
        })
    })

    describe('when the cookies are encrypted', function () {
      it('should populate req.signedCookies', function (done) {
        request(createServer('keyboard cat'))
          .get('/encrypted')
          .set('Cookie', 'foo=e:' + signedCipher1)
          .expect(200, '{"foo":"foobarbaz"}', done)
      })

      it('should remove the encrypted value from req.cookies', function (done) {
        request(createServer('keyboard cat'))
          .get('/')
          .set('Cookie', 'foo=e:' + signedCipher1)
          .expect(200, '{}', done)
      })

      it('should omit invalid ciphers', function (done) {
        var server = createServer('keyboard cat')

        request(server)
          .get('/encrypted')
          .set('Cookie', 'foo=' + signedCipher1 + '3')
          .expect(200, '{}', function (err) {
            if (err) return done(err)
            request(server)
              .get('/')
              .set('Cookie', 'foo=' + signedCipher1 + '3')
              .expect(200, '{"foo":"' + signedCipher1 + '3"}', done)
          })
      })

      describe('when key encoding is specified', function () {
        /**
         * 'foobarbaz' encrypted with base64 version of 'keboard cat' (a2V5Ym9hcmQgY2F0)
         */
        var cipherText = 'dQgKRe263NFi8g1i2nS6YQ==:IqLvIuFB/0Ish5NlmI/tYw=='
        /**
         * 'keyboard cat' in base64 (a2V5Ym9hcmQgY2F0)
         */
        var base64Secret = cipher.decodeKey('keyboard cat').toString('base64')

        it('should populate req.signedCookies', function (done) {
          request(createServer(base64Secret, { secretEncoding: 'base64' }))
            .get('/encrypted')
            .set('Cookie', 'foo=e:' + signature.sign(cipherText, base64Secret))
            .expect(200, '{"foo":"foobar"}', done)
        })

        it('should omit unmatching secret encoding', function (done) {
          // No secret encoding specified is equivalent to passing utf8
          request(createServer(base64Secret))
            .get('/encrypted')
            .set('Cookie', 'foo=e:' + signature.sign(cipherText, base64Secret))
            .expect(200, '{"foo":false}', done)
        })
      })
    })
  })

  describe('when multiple secrets are given', function () {
    it('should populate req.signedCookies', function (done) {
      request(createServer(['keyboard cat', 'nyan cat']))
        .get('/signed')
        .set('Cookie', 'buzz=s:foobar.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE; fizz=s:foobar.JTCAgiMWsnuZpN3mrYnEUjXlGxmDi4POCBnWbRxse88; bar=e:' + signedCipher2 + '; baz=e:' + signedCipher3 + ';')
        .expect(200, '{"buzz":"foobar","fizz":"foobar","bar":"foobar","baz":"foobar"}', done)
    })
  })

  describe('when no secret is given', function () {
    var server
    before(function () {
      server = createServer()
    })

    it('should populate req.cookies', function (done) {
      request(server)
        .get('/')
        .set('Cookie', 'foo=bar; bar=baz')
        .expect(200, '{"foo":"bar","bar":"baz"}', done)
    })

    it('should not populate req.signedCookies', function (done) {
      var val = signature.sign('foobarbaz', 'keyboard cat')
      request(server)
        .get('/signed')
        .set('Cookie', 'foo=s:' + val)
        .expect(200, '{}', done)
    })
  })
})

describe('cookieParser.JSONCookie(str)', function () {
  it('should return undefined for non-string arguments', function () {
    assert.strictEqual(cookieParser.JSONCookie(), undefined)
    assert.strictEqual(cookieParser.JSONCookie(undefined), undefined)
    assert.strictEqual(cookieParser.JSONCookie(null), undefined)
    assert.strictEqual(cookieParser.JSONCookie(42), undefined)
    assert.strictEqual(cookieParser.JSONCookie({}), undefined)
    assert.strictEqual(cookieParser.JSONCookie([]), undefined)
    assert.strictEqual(cookieParser.JSONCookie(function () {}), undefined)
  })

  it('should return undefined for non-JSON cookie string', function () {
    assert.strictEqual(cookieParser.JSONCookie(''), undefined)
    assert.strictEqual(cookieParser.JSONCookie('foo'), undefined)
    assert.strictEqual(cookieParser.JSONCookie('{}'), undefined)
  })

  it('should return object for JSON cookie string', function () {
    assert.deepEqual(cookieParser.JSONCookie('j:{"foo":"bar"}'), { foo: 'bar' })
  })

  it('should return undefined on invalid JSON', function () {
    assert.strictEqual(cookieParser.JSONCookie('j:{foo:"bar"}'), undefined)
  })
})

describe('cookieParser.signedCookie(str, secret, secretEncoding)', function () {
  it('should return undefined for non-string arguments', function () {
    assert.strictEqual(cookieParser.signedCookie(undefined, 'keyboard cat'), undefined)
    assert.strictEqual(cookieParser.signedCookie(null, 'keyboard cat'), undefined)
    assert.strictEqual(cookieParser.signedCookie(42, 'keyboard cat'), undefined)
    assert.strictEqual(cookieParser.signedCookie({}, 'keyboard cat'), undefined)
    assert.strictEqual(cookieParser.signedCookie([], 'keyboard cat'), undefined)
    assert.strictEqual(cookieParser.signedCookie(function () {}, 'keyboard cat'), undefined)
  })

  it('should pass through non-signed string', function () {
    assert.strictEqual(cookieParser.signedCookie('', 'keyboard cat'), '')
    assert.strictEqual(cookieParser.signedCookie('foo', 'keyboard cat'), 'foo')
    assert.strictEqual(cookieParser.signedCookie('j:{}', 'keyboard cat'), 'j:{}')
  })

  it('should return false for tampered signed string', function () {
    assert.strictEqual(cookieParser.signedCookie('s:foobaz.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE', 'keyboard cat'), false)
    assert.strictEqual(cookieParser.signedCookie('e:' + signedCipher1 + '1', 'keyboard cat'), false)
  })

  it('should return false for tampered cipher', function () {
    assert.strictEqual(cookieParser.signedCookie('e:' + tamperedCipher, 'keyboard cat'), false)
  })

  it('should return unsigned value for signed string', function () {
    assert.strictEqual(cookieParser.signedCookie('s:foobar.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE', 'keyboard cat'), 'foobar')
  })

  it('should return unsigned and unencrypted value for encrypted string', function () {
    assert.strictEqual(cookieParser.signedCookie('e:' + signedCipher2, 'keyboard cat'), 'foobar')
  })

  describe('when secret is an array', function () {
    it('should return false for tampered signed string', function () {
      assert.strictEqual(cookieParser.signedCookie('s:foobaz.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE', [
        'keyboard cat',
        'nyan cat'
      ]), false)
    })

    it('should return false for tampered cipher', function () {
      assert.strictEqual(cookieParser.signedCookie('e:' + tamperedCipher, [
        'keyboard cat',
        'nyan cat'
      ]), false)
    })

    it('should return unsigned value for first secret', function () {
      assert.strictEqual(cookieParser.signedCookie('s:foobar.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE', [
        'keyboard cat',
        'nyan cat'
      ]), 'foobar')
    })

    it('should return unsigned and unencrypted value for first secret', function () {
      assert.strictEqual(cookieParser.signedCookie('e:' + signedCipher2, [
        'keyboard cat',
        'nyan cat'
      ]), 'foobar')
    })

    it('should return unsigned value for second secret', function () {
      assert.strictEqual(cookieParser.signedCookie('s:foobar.JTCAgiMWsnuZpN3mrYnEUjXlGxmDi4POCBnWbRxse88', [
        'keyboard cat',
        'nyan cat'
      ]), 'foobar')
    })

    it('should return unsigned and unencrypted value for second secret', function () {
      assert.strictEqual(cookieParser.signedCookie('e:' + signedCipher3, [
        'keyboard cat',
        'nyan cat'
      ]), 'foobar')
    })
  })

  describe('when secret encoding is specified', function () {
    it('should return false for same key but different specified encoding', function () {
      assert.strictEqual(cookieParser.signedCookie('e:' + signedCipher2, 'keyboard cat', 'base64'), false)
    })

    it('should return unencrypted string for same key with same encoding', function () {
      assert.strictEqual(cookieParser.signedCookie('e:' + signedCipher2, 'keyboard cat', 'utf8'), 'foobar')
    })

    it('should return unencrypted string for same key in different encoding', function () {
      // Will be signed with the key as utf8 but encrypted and decrypted with the key as base64
      var cipherText = 'dQgKRe263NFi8g1i2nS6YQ==:IqLvIuFB/0Ish5NlmI/tYw=='
      /**
       * 'keyboard cat' in base64 (a2V5Ym9hcmQgY2F0)
       */
      var base64Secret = cipher.decodeKey('keyboard cat').toString('base64')
      assert.strictEqual(cookieParser.signedCookie('e:' + signature.sign(cipherText, 'keyboard cat'), 'keyboard cat', 'utf8'), 'foobar')
      assert.strictEqual(cookieParser.signedCookie('e:' + signature.sign(cipherText, base64Secret), base64Secret, 'base64'), 'foobar')
    })
  })
})

describe('cookieParser.signedCookies(obj, secret, secretEncoding)', function () {
  it('should ignore non-signed strings', function () {
    assert.deepEqual(cookieParser.signedCookies({}, 'keyboard cat'), {})
    assert.deepEqual(cookieParser.signedCookies({ foo: 'bar' }, 'keyboard cat'), {})
  })

  it('should include tampered strings as false', function () {
    assert.deepEqual(cookieParser.signedCookies({ foo: 's:foobaz.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE' }, 'keyboard cat'), {
      foo: false
    })
    assert.deepEqual(cookieParser.signedCookies({ foo: 'e:' + signedCipher2 + '1' }, 'keyboard cat'), {
      foo: false
    })
    assert.deepEqual(cookieParser.signedCookies({ foo: 'e:' + tamperedCipher }, 'keyboard cat'), {
      foo: false
    })
  })

  it('should include unsigned strings', function () {
    assert.deepEqual(cookieParser.signedCookies({ foo: 's:foobar.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE' }, 'keyboard cat'), {
      foo: 'foobar'
    })
  })

  it('should include unencrypted strings', function () {
    assert.deepEqual(cookieParser.signedCookies({ foo: 'e:' + signedCipher2 }, 'keyboard cat'), {
      foo: 'foobar'
    })
  })

  it('should remove signed and encrypted strings from original object', function () {
    var obj = {
      foo: 's:foobar.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE',
      bar: 'e:' + signedCipher2
    }

    assert.deepEqual(cookieParser.signedCookies(obj, 'keyboard cat'), { foo: 'foobar', bar: 'foobar' })
    assert.deepEqual(obj, {})
  })

  it('should remove tampered strings from original object', function () {
    var obj = {
      foo: 's:foobaz.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE',
      bar: 'e:' + signedCipher2 + '1',
      baz: 'e:' + tamperedCipher
    }

    assert.deepEqual(cookieParser.signedCookies(obj, 'keyboard cat'), { foo: false, bar: false, baz: false })
    assert.deepEqual(obj, {})
  })

  it('should leave unsigned and unencrypted strings in original object', function () {
    var obj = {
      fizz: 'buzz',
      foo: 's:foobar.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE',
      bar: 'e:' + signedCipher2
    }

    assert.deepEqual(cookieParser.signedCookies(obj, 'keyboard cat'), { foo: 'foobar', bar: 'foobar' })
    assert.deepEqual(obj, { fizz: 'buzz' })
  })

  describe('when secret is an array', function () {
    it('should include unsigned and unencrypted strings for matching secrets', function () {
      var obj = {
        buzz: 's:foobar.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE',
        fizz: 's:foobar.JTCAgiMWsnuZpN3mrYnEUjXlGxmDi4POCBnWbRxse88',
        bar: 'e:' + signedCipher2,
        baz: 'e:' + signedCipher3
      }

      assert.deepEqual(cookieParser.signedCookies(obj, ['keyboard cat']), {
        buzz: 'foobar',
        fizz: false,
        bar: 'foobar',
        baz: false
      })
    })

    it('should include unsigned and unencrypted strings for all secrets', function () {
      var obj = {
        buzz: 's:foobar.N5r0C3M8W+IPpzyAJaIddMWbTGfDSO+bfKlZErJ+MeE',
        fizz: 's:foobar.JTCAgiMWsnuZpN3mrYnEUjXlGxmDi4POCBnWbRxse88',
        bar: 'e:' + signedCipher2,
        baz: 'e:' + signedCipher3
      }

      assert.deepEqual(cookieParser.signedCookies(obj, ['keyboard cat', 'nyan cat']), {
        buzz: 'foobar',
        fizz: 'foobar',
        bar: 'foobar',
        baz: 'foobar'
      })
    })
  })
})

function createServer (secret, options = {}) {
  var _parser = cookieParser(secret, options)
  return http.createServer(function (req, res) {
    _parser(req, res, function (err) {
      if (err) {
        res.statusCode = 500
        res.end(err.message)
        return
      }

      var cookies = ['/signed', '/encrypted'].includes(req.url)
        ? req.signedCookies
        : req.cookies
      res.end(JSON.stringify(cookies))
    })
  })
}
