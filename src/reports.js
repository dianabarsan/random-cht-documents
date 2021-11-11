const convert = require('xml-js');
const _ = require('lodash');
const objectPath = require('object-path');
const moment = require('moment');
const crypto = require('crypto');

const db = require('./db');
const utils = require('./utils');
const { randomIndex } = require('./utils');
const { getRandomPerson } = require('./contacts');

let reports;

const getForms = async () => {
  const result = await db.medic.allDocs({ start_key: 'form:', end_key: 'form:\ufff0', include_docs: true, attachments: true });
  reports = result.rows
    .map(row => {
      if (row.id.startsWith('form:contact') || row.doc.type !== 'form') {
        return;
      }
      const form = row.doc;
      const buff = Buffer.from(form._attachments['model.xml'].data, 'base64');
      const model = convert.xml2js(buff.toString('ascii'), { compact: true });
      return {
        name: form.internalId,
        model: model.model.instance[0],
      }
    })
    .filter(form => form && form.model && form.model[form.name]);

  return reports;
};

const isEmptyObj = keys => {
  if (!keys.length) {
    return true;
  }

  if (keys.length === 1) {
    return keys.includes('_attributes') || keys.includes('_text');
  }

  if (keys.length === 2) {
    return keys.includes('_attributes') && keys.includes('_text');
  }

  return false;
};

const hydrate = (key, obj, patient) => {
  const keys = Object.keys(obj);
  if (isEmptyObj(keys)) {
    let text;
    switch (key) {
    case 'patient_age_in_years':
      text = moment().diff(moment(patient.date_of_birth), 'years');
      break;
    case 'patient_uuid':
      text = patient._id;
      break;
    case 'patient_id':
      text = patient.patient_id;
      break;
    case 'patient_name':
    case 'patient_short_name':
    case 'patient_short_name_start':
      text = patient.name;
      break;
    default:
      text = utils.getWord();
    }
    obj._text = text;
    return;
  }

  Object.keys(obj).forEach(subkey => {
    if (!['_attributes', '_text'].includes(subkey)) {
      hydrate(subkey, obj[subkey], patient);
    }
  });
};

const populateForm = (form, patient, submitter) => {
  const content = _.cloneDeep(form.model[form.name]);
  if (content.inputs) {
    objectPath.set(content, 'inputs.contact._id._text', submitter._id);
    objectPath.set(content, 'inputs.contact.name._text', submitter.name || 'chw');
    objectPath.set(content, 'inputs.contact.date_of_birth._text', submitter.date_of_birth || '1965-03-18');
    objectPath.set(content, 'inputs.contact.sex._text', submitter.sex || 'female');
    objectPath.set(content, 'inputs.contact.parent._id._text', submitter.parent._id);
  }

  Object.keys(content).forEach(key => {
    if (key === '_attributes' || key === 'inputs') return;
    hydrate(key, content[key], patient);
  });

  return content;
};

const hydrateFields = (report, content) => {
  report.fields = {};
  report.hidden_fields = [];

  hydrateFieldsRecursive(report, content);
};

const hydrateFieldsRecursive = (report, content, path = '') => {
  Object.keys(content).map(key => {
    if (key === '_attributes') {
      if (content.tag === 'hidden') {
        report.hidden_fields.push(key);
      }
      return;
    }

    if (key === '_text') {
      objectPath.set(report.fields, path, content._text);
      return;
    }

    hydrateFieldsRecursive(report, content[key], path ? path + '.' + key : key);
  });
};

const createReport = async (submitter, patient, form) => {
  if (!form) {
    if (!reports) {
      await getForms();
    }
    form = reports[randomIndex(reports)];
  }

  if (!submitter) {
    submitter = await getRandomPerson();
  }

  if (!patient) {
    patient = await getRandomPerson();
  }

  const report = {
    form: form.name,
    type: 'data_record',
    content_type: 'xml',
    contact: submitter,
    from: '',
    reported_date: utils.getRandomDate(moment(patient.reported_date)).valueOf(),
    _attachments: {
      content: {
        content_type: 'text/xml',
        revpos: 1,
      },
    },
  };

  const content = populateForm(form, patient, submitter);
  const xml = {};
  xml[form.name] = content;
  const contentXml = convert.js2xml(xml, { compact: true });
  const buff = Buffer.from(contentXml);
  report._attachments.content.data = buff.toString('base64');
  report._attachments.content.length = report._attachments.content.data.length;
  report._attachments.content.digest = crypto.createHash('md5').update(report._attachments.content.data).digest('hex');

  hydrateFields(report, content);

  const result = await db.medic.post(report);
  report._id = result.id;
  report._rev = result.rev;

  return report;
};

module.exports = {
  getForms,
  createReport,
};
