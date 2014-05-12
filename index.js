/*!
* cookie-parser
* MIT Licensed
*/

/**
* Module dependencies.
*/

var cookie = require('cookie');
var parse = require('./lib/parse');

/**
 * Parse Cookie header and populate `req.cookies`
 * with an object keyed by the cookie names.
 *
 * @param {String} secret
 * @return {Function}
 * @api public
 */

module.exports = function cookieParser(secret, opt){
  return function cookieParser(req, res, next) {
    if (req.cookies) return next();
    var cookies = req.headers.cookie;

    req.secret = secret;
    req.cookies = {};
    req.signedCookies = {};

    if (cookies) {
      try {
        req.cookies = cookie.parse(cookies, opt);
        if (secret) {
          req.signedCookies = parse.signedCookies(req.cookies, secret);
          req.signedCookies = parse.JSONCookies(req.signedCookies);
        }
        req.cookies = parse.JSONCookies(req.cookies);
      } catch (err) {
        err.status = 400;
        return next(err);
      }
    }
    next();
  };
};
