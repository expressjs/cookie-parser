var signature = require('cookie-signature');

/**
 * Parse signed cookies, returning an object
 * containing the decoded key/value pairs,
 * while removing the signed key from `obj`.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

exports.signedCookies = function(obj, secret){
  var ret = {}, val;
  for (var i in obj) {
    val = obj[i];
    if (0 == val.indexOf('s:')) {
      val = signature.unsign(val.slice(2), secret);
      if (val) {
        ret[i] = val;
        delete obj[i];
      }
    }
  }
  return ret;
};

/**
 * Parse JSON cookies.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

exports.JSONCookies = function(obj){
  var val, res;
  for (var i in obj) {
    val = obj[i];
    res = exports.JSONCookie(val);
    if (res) {
      obj[i] = res;
    }
  }
  return obj;
};

/**
 * Parse JSON cookie string
 *
 * @param {String} str
 * @return {Object} Parsed object or null if not json cookie
 * @api private
 */

exports.JSONCookie = function(str) {
  if (0 == str.indexOf('j:')) {
    try {
      return JSON.parse(str.slice(2));
    } catch (err) {
      // no op
    }
  }
};
