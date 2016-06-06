/**
 * @file
 * oauth2-nodejs, a simple nodejs OAuth2 auth-code wrapper library.
 *
 * @author
 * Stian Hanger (pdnagilum@gmail.com)
 */

'use strict';

var https = require('https'),
    querystring = require('querystring');

/**
 * Construct a OAuth2 forwarding URI to redirect with.
 *
 * @param provider json
 *   OAuth2 provider wrapper.
 * @param redirectUri string
 *   URI to redirect back to the system.
 * @param locale string
 *   Language locale for provider interface. Defaults to 'en'.
 *
 * @returns string
 *   URI to redirect system to, for user authorization.
 */
exports.CreateRedirect = function (provider, redirectUri, locale) {
  if (!locale)
    locale = 'en';

  var parameters = {
    'client_id': provider.clientId,
    'display': 'page',
    'locale': locale,
    'redirect_uri': redirectUri,
    'response_type': 'code'
  };

  if (provider.offline)
    parameters.access_type = 'offline';

  if (provider.scope)
    parameters.scope = provider.scope;

  if (provider.state)
    parameters.state = provider.state;

  return provider.authUri + '?' + buildQueryString(parameters);
}

/**
 * Request a access token by exchanging a auth code.
 *
 * @param provider json
 *   OAuth2 provider wrapper.
 * @param redirectUri string
 *   URI to redirect back to the system.
 * @param code string
 *   Authorization code.
 * @param callback function
 *   Function to call with the resulting content.
 */
exports.AuthenticateByCode = function (provider, redirectUri, code, callback) {
  var parameters = {
    'client_id': provider.clientId,
    'client_secret': provider.clientSecret,
    'redirect_uri': redirectUri,
    'code': code,
    'grant_type': 'authorization_code'
  };

  if (provider.scope)
    parameters.scope = provider.scope;

  if (provider.state)
    parameters.state = provider.state;

  var reply = request(
    provider.accessTokenUri,
    'POST',
    buildQueryString(parameters),
    callback,
    true);
}

/**
 * Request a new access token by refreshing an old.
 *
 * @param provider json
 *   OAuth2 provider wrapper.
 * @param refreshToken string
 *   Access/refresh token to use.
 * @param callback function
 *   Function to call with the resulting content.
 */
exports.AuthenticateByToken = function (provider, refreshToken, callback) {
  var parameters = {
    'client_id': provider.clientId,
    'client_secret': provider.clientSecret,
    'refresh_token': refreshToken,
    'grant_type': 'refresh_token'
  };

  if (provider.scope)
    parameters.scope = provider.scope;

  if (provider.state)
    parameters.state = provider.state;

  var reply = request(
    provider.accessTokenUri,
    'POST',
    buildQueryString(parameters),
    callback,
    true);
}

/**
 * Get user info from the providers user endpoint.
 *
 * @param provider json
 *   OAuth2 provider wrapper.
 * @param accessToken string
 *   Access token to use.
 * @param callback function
 *   Function to call with the resulting content.
 */
exports.GetUserInfo = function (provider, accessToken, callback) {
  var parameters = {
    'access_token': accessToken
  };

  return request(
    provider.userInfoUri,
    'GET',
    buildQueryString(parameters),
    callback);
}

/**
 * Construct a query-string from dictionary.
 *
 * @param parameters dictionary
 *   Set of parameters in dictionary form to construct from.
 *
 * @returns string
 *   Query-string.
 */
function buildQueryString(parameters) {
  Object.keys(parameters).forEach(function (key) {
    parameters[key] = encodeURIComponent(parameters[key]);
  });

  return querystring.stringify(parameters);
}

/**
 * Interpret the reply from the auth-call.
 *
 * @param reply string
 *   The string body from the web-request.
 *
 * @returns json
 *   Authentication response object.
 */
function interpretReply(reply) {
  var response = {
    accessToken: null,
    refreshToken: null,
    expires: null
  };

  try {
    reply = JSON.parse(reply);
  }
  catch (e) {
    // ignore
  }

  if (reply['access_token']) response.accessToken = reply['access_token'];
  if (reply['refresh_token']) response.refreshToken = reply['refresh_token'];
  if (reply['state']) response.refreshToken = reply['state'];
  if (reply['expires']) response.expires = reply['expires'];
  if (reply['expires_in']) response.expires = reply['expires_in'];

  return response;
}

/**
 * Make a web-request and return response string.
 *
 * @param uri string
 *   URI to contact.
 * @param method string
 *   HTTP method to use. Defaults to 'POST'.
 * @param payload string
 *   Payload to deliver via query-string or body.
 * @param callback function
 *   Function to call with the resulting content.
 * @param interpretBody bool
 *   Whether or not to interpret the body before callback.
 */
function request(uri, method, payload, callback, interpretBody) {
  if (!method)
    method = 'POST';

  uri = uri.replace('https://', '');

  var options = {
        'host': uri.substring(0, uri.indexOf('/')),
        'path': uri.substring(uri.indexOf('/')),
        'port': 443,
        'method': method,
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': (method === 'POST' ? Buffer.byteLength(payload) : 0)
      },
      req = https.request(
        options,
        (res) => {
          var body = '';

          res.on('data', function (d) {
            body += d;
          });

          res.on('end', function () {
            if (interpretBody) {
              callback(interpretReply(body));
            }
            else {
              callback(body);
            }
          });
        });

  if (method === 'POST')
    req.write(payload);

  req.end();
}