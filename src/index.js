const { createDistrict, createHealthCenter, createFamily, createPerson} = require('./contacts');
const { createUser, getUser} = require('./users');
const { createReport } = require('./forms');
const utils = require('./utils');
const { createTask, createTarget } = require('./tasks_targets');
const { createReminder } = require('./reminders');

(async () => {
  try {
    //await utils.getWords();

    // const district = await createDistrict();
    // const healthCenter = await createHealthCenter(district);
    // const family = await createFamily(healthCenter);
    // await createPerson(family);

    // const user = await createUser();
    // const user = await getUser('branded');
    // const task = await createTask(user);
    // const target = await createTarget(user);

    // await createReport();
    //await createReminder();
  } catch (err) {
    console.error(err);
  }
})();
