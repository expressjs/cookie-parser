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
  var cookies = Object.keys(obj);
  var key;
  var ret = {};
  var val;

  for (var i = 0; i < cookies.length; i++) {
    key = cookies[i];
    val = obj[key];

    if (val.substr(0, 2) === 's:') {
      val = signature.unsign(val.slice(2), secret);

      if (val) {
        ret[key] = val;
        delete obj[key];
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
  var cookies = Object.keys(obj);
  var key;
  var val;

  for (var i = 0; i < cookies.length; i++) {
    key = cookies[i];
    val = exports.JSONCookie(obj[key]);

    if (val) {
      obj[key] = val;
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
  if (!str || str.substr(0, 2) !== 'j:') return;

  try {
    return JSON.parse(str.slice(2));
  } catch (err) {
    // no op
  }
};
