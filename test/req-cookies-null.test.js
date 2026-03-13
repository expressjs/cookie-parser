const express = require('express');
const request = require('supertest');
const cookieParser = require('..');

describe('Issue #128 - req.cookies showing null', function () {
  it('should default req.cookies to {} when no Cookie header is sent', function (done) {
    const app = express();
    app.use(cookieParser());

    app.get('/', (req, res) => res.json(req.cookies));

    request(app)
      .get('/')
      .expect(200, {}, done);
  });

  it('should default req.cookies to {} when Cookie header is empty', function (done) {
    const app = express();
    app.use(cookieParser());

    app.get('/', (req, res) => res.json(req.cookies));

    request(app)
      .get('/')
      .set('Cookie', '')
      .expect(200, {}, done);
  });
});
