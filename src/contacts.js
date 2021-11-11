const uuid = require('uuid').v4;
const moment = require('moment');
const db = require('./db');
const utils = require('./utils');

const createPerson = async (parent) => {
  if (!parent.reported_date) {
    const parentDoc = await db.medic.get(parent._id);
    parent.reported_date = parentDoc.reported_date;
  }

  const person = {
    name: utils.getWord(),
    type: 'person',
    patient_id: utils.getWord(),
    parent: { _id: parent._id, parent: parent.parent },
    reported_date: utils.getRandomDate(moment(parent.reported_date)).valueOf(),
    date_of_birth: utils.getRandomDate(utils.minAge).format('Y-MM-DD'),
    date_of_birth_method: 'approx',
    sex: 'female',
    role: 'patient',
  };

  const result = await db.medic.post(person);
  person._id = result.id;
  person._rev = result.rev;

  return person;
};

const createPlace = async (parent, type) => {
  const place = {
    _id: uuid(),
    name: utils.getWord(),
    type: type,
    parent: parent ? { _id: parent._id, parent: parent.parent } : {},
    reported_date: utils.getRandomDate(utils.minDate),
  };

  const person = await createPerson(place);
  place.contact = {
    _id: person._id,
    parent: person.parent,
  };

  const result = await db.medic.put(place);
  place._rev = result.rev;

  return place;
};

const createFamily = (parent) => createPlace(parent, 'clinic');
const createHealthCenter = (parent) => createPlace(parent, 'health_center');
const createDistrict = () => createPlace(null, 'district_hospital');

const getRandomContactByType = async type => {
  const contacts = await db.medic.query('medic-client/doc_by_type', { key: [type], limit: 1000 });
  const idx = utils.randomIndex(contacts.rows);

  return db.medic.get(contacts.rows[idx].id);
}

const getRandomPerson = () => getRandomContactByType('person');
const getRandomFamily = () => getRandomContactByType('clinic');

module.exports = {
  createPlace,
  createHealthCenter,
  createDistrict,
  createPerson,
  createFamily,
  getRandomPerson,
  getRandomFamily,
}
