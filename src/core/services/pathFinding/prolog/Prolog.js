// const pl = require('tau-prolog');
// require('tau-prolog/modules/lists')(pl);

import 'tau-prolog/modules/core';
const pl = window.pl;
console.log(pl);

import loader from 'tau-prolog/modules/lists';
loader(pl);

class Prolog {
  session = pl.create();

  constructor(limit) {}

  async consult(program) {
    return new Promise((res, rej) => {
      this.session.consult(program, {
        success: function () {
          res();
        },
        error: function (err) {
          rej(err);
        },
      });
    });
  }

  async query(query) {
    return new Promise((res, rej) => {
      this.session.query(query, {
        success: function (goal) {
          res(goal);
        },
        error: function (err) {
          rej(err);
        },
      });
    });
  }

  async answer() {
    return new Promise((res, rej) => {
      this.session.answer({
        success: function (answer) {
          //Parsing To JSON
          const str = pl.format_answer(answer);

          if (str === 'true ;') return res(true);

          const json = JSON.parse(
            '{"' +
              str
                .replace(' ;', '')
                .replace(/, /g, '", "')
                .replace(/ = /g, '": "') +
              '"}',
          );

          res(json);
        },
        error: function (err) {
          rej(err);
        },
        fail: function () {
          /* No more answers */
          res(null);
        },
        limit: function () {
          /* Limit exceeded */
        },
      });
    });
  }
}

export default Prolog;
