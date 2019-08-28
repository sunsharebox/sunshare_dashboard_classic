
/**
 * Client login
 */
const login = (req, res) => {
  //initialization of the state parameter with a random string
  req.session.state = (Math.random() + 1).toString(36).substring(7);

  // Add test client number (from 0 to 4) to the end of state (cf documentation)
  if (req.query.testClientId) { // testClentId is a number from 0 to 4. It is sended by the front end.
    req.session.state = req.session.state + req.query.testClientId;
  } else {
    // if no specific client is specified, default to client 0
    req.session.state = req.session.state + '0';
  }
  req.session.save();

  console.log(req.sessionID);
  // Redirect user to login page on Enedis
  const redirectUrl =
    'https://gw.hml.api.enedis.fr/group/espace-particuliers/consentement-linky/oauth2/authorize' +
    '?' +
    `client_id=${process.env.CLIENT_ID}` +
    `&state=${req.session.state}` +
    `&duration=${process.env.DURATION}` + // duration est la durée du consentement que vous souhaitez obtenir : cette durée est à renseigner au format ISO 8601 (exemple : « P6M » pour une durée de 6 mois),
    '&response_type=code' +
    `&redirect_uri=${process.env.REDIRECT_URI}`;
  console.log('Redirect URL : ' + redirectUrl);
  return res.redirect(redirectUrl);
};

// This function catches the redirection of Enedis after login
const redirect = (req, res) => {
  // verify that the state is correct
  if (req.session.state !== req.query.state) {
    return res.sendStatus(httpStatus.FORBIDDEN);
  }

  const usagePointId = req.query.usage_point_id;
  const postData = querystring.stringify({
    code: req.query.code,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    grant_type: 'authorization_code',
  });

  const url = `https://gw.hml.api.enedis.fr/v1/oauth2/token?redirect_uri=${
    process.env.REDIRECT_URI
  }`;

  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  axios
    .post(url, postData, options)
    .then(r => {
      if (r.status === 200) return r.data;
      throw new Error(r.status);
    })
    .then(data => {
      const expiresAt = new Date(
        parseInt(data.expires_in, 10) * 1000 + parseInt(data.issued_at, 10),
      );

      // get user information from Enedis to create user
      getUserFromEnedis(data.access_token, usagePointId).then(client => {
        return findOrCreateUser(
          client.identity.natural_person.firstname,
          client.identity.natural_person.lastname,
          client.customer_id,
          data.access_token,
          data.refresh_token,
          usagePointId,
          expiresAt,
        ).spread((user, created) => {
          updateUser(user, {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            usagePointId,
            expiresAt,
          });
          // redirect for the phone to catch this route
          return res.redirect(
            `enedis-third-party-app://auth_complete?user=${jwt.sign(
              { id: user.id, usagePointId: user.usagePointId },
              process.env.JWT_SECRET,
            )}`,
          );
        });
      });
    })
    .catch(err => console.log(err));
};
