const uuid = require('uuid').v4;

const db = require('./db');
const { getRandomFamily } = require('./contacts');
const { getRandomDate, getWord, minDate} = require('./utils');

const getReminderId = (form, scheduledDate, placeId) => `reminder:${form}:${scheduledDate.valueOf()}:${placeId}`;

const createReminder = async () => {
  const place = await getRandomFamily();
  const form = getWord();
  const scheduledDate = getRandomDate(minDate);

  const reminderDoc = {
    _id: getReminderId(form, scheduledDate, place._id ),
    type: 'reminder',
    contact: place.contact,
    place: { _id: place._id, parent: place.parent },
    form: form,
    reported_date: new Date().getTime(),
    tasks: [{
      messages: [{
        from: getWord(),
        to: getWord(),
        message: getWord(),
        uuid: uuid(),
      }],
      state_history: [{ state: 'pending', timestamp: getRandomDate().toISOString() }],
      state: 'pending',
      form: form,
      timestamp: scheduledDate.toISOString(),
      type: 'reminder',
    }]
  };

  const result = await db.medic.put(reminderDoc);
  reminderDoc._rev = result.rev;

  return reminderDoc;
};

module.exports = {
  createReminder,
};
