const assert = require('assert')
const http = require('http')
const express = require('express')
const cookieParser = require('../index') // local cookie-parser

describe('Issue #128 (Express 5 integration)', function () {
  let server

  before(function (done) {
    const app = express()
    app.use(cookieParser())

    // Add a simple route
    app.get('/', (req, res) => {
      res.json({
        cookies: req.cookies,
        hasCookiesKey: Object.prototype.hasOwnProperty.call(req, 'cookies'),
        type: typeof req.cookies
      })
    })

    server = http.createServer(app).listen(4000, done)
  })

  after(function (done) {
    server.close(done)
  })

  it('should return {} when no Cookie header is present', function (done) {
    http.get('http://localhost:4000/', (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        const parsed = JSON.parse(data)
        assert.ok(parsed.hasCookiesKey, 'req should have a cookies key')
        assert.deepStrictEqual(parsed.cookies, {}, 'req.cookies should be {}')
        done()
      })
    })
  })

  it('should return {} when Cookie header is empty', function (done) {
    const opts = { hostname: 'localhost', port: 4000, path: '/', headers: { Cookie: '' } }
    http.get(opts, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        const parsed = JSON.parse(data)
        assert.deepStrictEqual(parsed.cookies, {}, 'req.cookies should be {}')
        done()
      })
    })
  })
})
