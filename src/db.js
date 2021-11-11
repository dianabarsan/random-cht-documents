const PouchDB = require('pouchdb-core');
PouchDB.plugin(require('pouchdb-mapreduce'));
PouchDB.plugin(require('pouchdb-adapter-http'));

const url = process.env.COUCH_URL || 'http://admin:pass@127.0.0.1:5988/medic';
const couchUrl = url.replace(/\/$/, '');
const medic = new PouchDB(couchUrl);
const sentinel = new PouchDB(`${couchUrl}-sentinel`);

module.exports = {
  apiUrl: couchUrl.slice(0, couchUrl.lastIndexOf('/')),
  medic,
  sentinel,
};
