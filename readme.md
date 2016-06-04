A simple nodejs OAuth2 auth-code wrapper library.

## How to Create the Redirect

```js
var oauth2 = require('oauth2-nodejs'),
	systemRedirectUri = oauth2.CreateRedirect(
		{
			clientId: 'my-client-id',
			scope: 'email',
			authUri: 'https://graph.facebook.com/oauth/authorize'
		},
		'https://awesome-domain.com/my-awesome-oauth-callback',
		'en');
```

This will give you a URI you can just forward the user too. They will sign in and give the app access, which will redirect back to: `https://awesome-domain.com/my-awesome-oauth-callback?code=XXX`

## How to Authenticate by Code

```js
var oauth2 = require('oauth2-nodejs');

oauth2.AuthenticateByCode(
	{
		clientId: 'my-client-id',
		clientSecret: 'my-client-secret',
		scope: 'email',
		accessTokenUri: 'https://graph.facebook.com/oauth/access_token'
	},
	'https://awesome-domain.com/my-awesome-oauth-callback',
	'code-from-provider',
	function (res) {
		// res.accessToken
		// res.expires
	}
);
```

The library will make a web request to the provider with the auth code given and, hopefully, return with a valid access token. You are now authorized with the given provider.