const rpn = require('request-promise-native');
const fs = require('fs');
const moment = require('moment');

let words = require('./words.json');

const getRandomWords = (number = 1) => {
  const url = 'https://random-word-api.herokuapp.com/word';
  return rpn.get(url, { qs: { number }, json: true });
};

const getWords = async () => {
  words = await getRandomWords(10000);
  await fs.promises.writeFile('./words.json', JSON.stringify(words));
};

const getWord = () => {
  if (!words || !words.length) {
    getWords();
    return 'no words lol, get your words first';
  }

  const idx = randomIndex(words);
  return words[idx];
};

const randomIndex = array => Math.floor(Math.random() * array.length);

const minDate = moment().subtract(1, 'year');
const minAge = moment().subtract(60, 'year');

const getRandomDate = (start = minDate, end = moment()) => {
  return moment(start.valueOf() + Math.random() * (end.valueOf() - start.valueOf()));
};

module.exports = {
  randomIndex,
  getWords,
  getWord,
  getRandomDate,
  minDate,
  minAge,
};

