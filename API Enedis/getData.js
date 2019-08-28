/**
 *
 * @param {string} URLType can be consumption_load_curve, consumption_max_power, daily_consumption, daily_production
 * @param {obj} req
 * @param {obj} res
 */
const getDataFromEnedis = (URLType, req, res) => {
  const url =
    `https://gw.hml.api.enedis.fr/v3/metering_data/${URLType}` +
    '?' +
    `start=${createDateStrings().start}` +
    `&end=${createDateStrings().end}` +
    `&usage_point_id=${req.user.usagePointId}`;

  console.log(url);
  getUserAccessToken(req.user.id)
    .then(accessToken => {
      const options = {
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken || process.env.ACCESS_TOKEN}`,
        },
      };

      return axios.get(url, options);
})
