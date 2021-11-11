const rpn = require('request-promise-native');

const db = require('./db');
const { createDistrict, createHealthCenter } = require('./contacts');
const { getWord } = require('./utils');

const createUser = async () => {
  const district = await createDistrict();
  const healthCenter = await createHealthCenter(district);

  const user = {
    username: getWord(),
    password: getWord() + '.123',
    place: healthCenter._id,
    contact: healthCenter.contact._id,
    roles: ['chw'],
  };

  return rpn.post({ url: `${db.apiUrl}/api/v1/users`, body: user, json: true });
};

const getUser = (name) => {
  return db.medic.get(`org.couchdb.user:${name}`);
}

module.exports = {
  createUser,
  getUser,
};
