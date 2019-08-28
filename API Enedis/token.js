/**
 * get user's accestoken
 *
 * if the token is expired, get a new one through Enedis.
 * @param {number} id Enedis user id
 */
export const getUserAccessToken = id => {
  return getUserByEnedisId(id).then(user => {
    //test if the client exists
    if (user) {
      //test the access token validity
      if (user.expiredAt < new Date()) {
  		//if the access token is not valid, the application refreshs it
  		const postData = querystring.stringify({
    			grant_type: 'refresh_token',
    			client_id: process.env.CLIENT_ID,
    			client_secret: process.env.CLIENT_SECRET,
    			refresh_token: user.refreshToken
  		});
  		const url = `https://gw.hml.api.enedis.fr/v1/oauth2/token?redirect_uri=${process.env.REDIRECT_URI}`;

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
       			//Update user's tokens
      			updateUser(user, {
      			   accessToken: data.access_token,
      			   refreshToken: data.refresh_token,
      			   usagePointId,
      			   expiresAt,
      			});
    		  });
      	});
      }
      console.log('user accessToken : ', user.accessToken);
      return user.accessToken;
    }
    throw new Error('User not found');
  });
};
