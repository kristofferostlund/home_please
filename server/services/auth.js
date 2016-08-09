'use strict';

var _ = require('lodash');
var compose = require('composable-middleware');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

var User = require('./../models/user/user.model');
var config = require('./../config');
var utils = require('./../utils/general.utils');

/**
 * Validates *email* address format and returns a Boolean value.
 *
 * @param {String} email Email address to validate
 * @return {Boolean}
 */
function validateEmail(email) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
}

/**
 * Finds the token from either query params, headers or cookies
 * and return it token.
 *
 * If 'Bearer ' is part it of the token, it's stripped out.
 *
 * @param {Object} req Express request object
 * @return {String}
 */
function findToken(req) {
  // Find the token from any of these sources
  var _appToken = _.find([
    _.get(req, 'query.token'),
    _.get(req, 'query.access_token'),
    _.get(req, 'headers.token'),
    _.get(req, 'headers.authorization'),
    _.get(req, 'headers.Authorization'),
    _.get(req, 'cookies.token'),
    _.get(req, 'cookies.access_token'),
    _.get(req, 'cookies.authorization'),
    _.get(req, 'cookies.Authorization'),
  ], function (token) { return !!token });

  // Remove Bearer from token if it's there
  if (/^Bearer /i.test(_appToken)) {
    _appToken = _appToken.split(' ')[1];
  }

  // Return it
  return _appToken;
}

/**
 * Middlewhare for ensuring authentication.
 *
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next function
 */
function isAuthenticated (req, res, next) {
  var _token;

  return compose().use(function (req, res, next) {
    // Find the token
    _token = findToken(req);

    // Get the decoded data
    var _decoded = decodeToken(_token);

    var _userId = !!_decoded ? _decoded._id : null;

    // If no userId was found, return a response of 401, Unauthorized.
    if (_userId === null) {
      return res.status(401).send('Unauthorized');
    }

    // // Find the user and attach it to the response object
    return User.findById(_userId)
    .then(function (user) {
      // Add the user to the response
      req.user = user;

      // If there is no registered user, return a 401 unauthorized
      if (!_.get(user, '_id')) {
        return res.status(401).send('Unauthorized');
      }

      next();
    })
    .catch(function (err) {
      return utils.handleError(res, err);
    });
  });
}

/**
 * Signs a token and returns it.
 *
 * @param {Data} data Data to sign into the token
 * @return {String} token
 */
function signToken(data) {
  return jwt.sign(data, config.app_secret, { expiresIn: 60 * 60 * 24 * 365 });
}

/**
 * Decodes a token and returns the result.
 *
 * @param {Stirng} token
 * @return {String} token
 */
function decodeToken (token) {
  // Return the decoded token.
  return jwt.decode(token, config.app_secret);
}

/**
 * Returns an encrypted password.
 *
 * @param {String} plainPassword The password to encrypt
 * @return {String}
 */
function encryptPassword (plainPassword) {
  return bcrypt.hashSync(plainPassword, bcrypt.genSaltSync(10));
}

/**
 * Returns true or false for whether the *plainPassword* is valid against *hashedPassword*.
 *
 * @param {String} hashedPassword The hashed password to compare against
 * @param {String} plainPassword The plain password to compare against *hashedPassword*
 * @return {Boolean}
 */
function validatePassword (hashedPassword, plainPassword) {
  return bcrypt.compareSync(plainPassword, hashedPassword);
}

module.exports = {
  isAuthenticated: isAuthenticated,
  validateEmail: validateEmail,
  signToken: signToken,
  decodeToken: decodeToken,
  encryptPassword: encryptPassword,
  validatePassword: validatePassword,
}
