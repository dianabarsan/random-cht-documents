const uuid = require('uuid').v4;

const db = require('./db');
const { getRandomPerson } = require('./contacts');
const { getWord, getRandomDate, minDate, randomIndex } = require('./utils');

const taskStates = ['Draft', 'Ready', 'Cancelled', 'Completed', 'Failed'];
const randomTaskHistory = () => {
  const stateChangeCount = Math.ceil(Math.random() * 6);
  return Array
    .from({ length:stateChangeCount })
    .map(() => ({
      state: taskStates[randomIndex(taskStates)],
      timestamp: getRandomDate(minDate),
    }));
};

const createTask = async (user) => {
  const userid = user._id || user.user.id;
  const contact = await getRandomPerson();

  const date = getRandomDate(minDate).valueOf();

  const stateHistory = randomTaskHistory();

  const emissionId = uuid();
  const taskName = getWord();
  const formName = getWord();
  const task = {
    _id: `task~${userid}~${emissionId}~${taskName}~${date}`,
    type: 'task',
    authoredOn: date,
    stateHistory: stateHistory,
    user: userid,
    requester: contact._id,
    state: stateHistory[0].state, // should be last but we don't care atm
    emission: {
      _id: `${emissionId}~${taskName}`,
      title: formName,
      deleted: false,
      resolves: true,
      actions: [{
        type: 'report',
        form: formName,
        label: getWord(),
        content: {
          source: 'task',
          source_id: uuid(),
        },
      }],
      contact: {
        name: contact.name,
      },
      dueDate: getRandomDate(minDate).format('Y-M-D'),
      startDate: getRandomDate(minDate).format('Y-M-D'),
      endDate: getRandomDate(minDate).format('Y-M-D'),
      forId: contact._id,
    },
  };

  const result = await db.medic.put(task);
  task._rev = result.rev;

  return task;
};

const randomTargets = () => {
  const nbrTargets = Math.ceil(Math.random() * 20);
  return Array.from({ length: nbrTargets }).map(() => ({
    id: getWord(),
    value: {
      total: Math.ceil(Math.random() * 100),
      pass: Math.ceil(Math.random() * 100),
    },
  }));
}

const createTarget = async (user) => {
  const userid = user._id || user.user.id;
  const date = getRandomDate(minDate);
  const target = {
    _id: `target~${date.format('Y-M')}~${uuid()}~${userid}`,
    type: 'target',
    user: userid,
    owner: user.contact,
    reporting_period: date.format('Y-M'),
    updated_date: date.valueOf(),
    targets: randomTargets(),
  };

  const result = await db.medic.put(target);
  target._rev = result.rev;

  return target;
};

module.exports = {
  createTask,
  createTarget,
};
