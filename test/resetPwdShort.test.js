
/* global assert, describe, it */
/* eslint  no-shadow: 0, no-var: 0, one-var: 0, one-var-declaration-per-line: 0,
no-unused-vars: 0 */

const assert = require('chai').assert;
const feathersStubs = require('./../test/helpers/feathersStubs');
const verifyResetService = require('../lib/index').service;
const SpyOn = require('./helpers/basicSpy');

// user DB

const now = Date.now();
const usersDb = [
  // The added time interval must be longer than it takes to run ALL the tests
  { _id: 'a', email: 'a', username: 'aa', isVerified: true, resetToken: '000', resetShortToken: '00099', resetExpires: now + 200000 },
  { _id: 'b', email: 'b', username: 'bb', isVerified: true, resetToken: null, resetShortToken: null, resetExpires: null },
  { _id: 'c', email: 'c', username: 'cc', isVerified: true, resetToken: '111', resetShortToken: '11199', resetExpires: now - 200000 },
  { _id: 'd', email: 'd', username: 'dd', isVerified: false, resetToken: '222', resetShortToken: '22299', resetExpires: now - 200000 },
];

// Tests
['_id', 'id'].forEach(idType => {
  ['paginated', 'non-paginated'].forEach(pagination => {
    describe(`resetPwdWithShortToken ${pagination} ${idType}`, function () {
      this.timeout(5000);
      const ifNonPaginated = pagination === 'non-paginated';

      describe('basic', () => {
        var db;
        var app;
        var users;
        var verifyReset;
        const password = '123456';

        beforeEach(() => {
          db = clone(usersDb);
          app = feathersStubs.app();
          users = feathersStubs.users(app, db, ifNonPaginated, idType);
          verifyResetService({
            userPropsForShortToken: ['email', 'username']
          }).call(app); // define and attach verifyReset service
          verifyReset = app.service('verifyReset'); // get handle to verifyReset
        });

        it('verifies valid token', (done) => {
          const resetShortToken = '00099';
          const i = 0;

          verifyReset.create({ action: 'resetPwdShort', value: {
            token: resetShortToken, password, user: { email: db[i].email }
          } }, {}, (err, user) => {
            assert.strictEqual(err, null, 'err code set');

            assert.strictEqual(user.isVerified, true, 'user.isVerified not true');

            assert.strictEqual(db[i].isVerified, true, 'isVerified not true');
            assert.strictEqual(db[i].resetToken, null, 'resetToken not null');
            assert.strictEqual(db[i].resetShortToken, null, 'resetShortToken not null');
            assert.strictEqual(db[i].resetExpires, null, 'resetExpires not null');

            assert.isString(db[i].password, 'password not a string');
            assert.equal(db[i].password.length, 60, 'password wrong length');

            done();
          });
        });

        it('user is sanitized', (done) => {
          const resetShortToken = '00099';
          const i = 0;

          verifyReset.create({ action: 'resetPwdShort', value: {
            token: resetShortToken, password, user: { username: db[i].username }
          } }, {}, (err, user) => {
              assert.strictEqual(err, null, 'err code set');

              assert.strictEqual(user.isVerified, true, 'isVerified not true');
              assert.strictEqual(user.resetToken, undefined, 'resetToken not undefined');
              assert.strictEqual(user.resetShortToken, undefined, 'resetShortToken not undefined');
              assert.strictEqual(user.resetExpires, undefined, 'resetExpires not undefined');

              assert.isString(db[i].password, 'password not a string');
              assert.equal(db[i].password.length, 60, 'password wrong length');

              done();
            });
        });

        it('handles multiple user ident', (done) => {
          const resetShortToken = '00099';
          const i = 0;

          verifyReset.create({ action: 'resetPwdShort', value: {
            token: resetShortToken, password, user: { email: db[i].email, username: db[i].username }
          } }, {}, (err, user) => {
            assert.strictEqual(err, null, 'err code set');

            assert.strictEqual(user.isVerified, true, 'isVerified not true');
            assert.strictEqual(user.resetToken, undefined, 'resetToken not undefined');
            assert.strictEqual(user.resetShortToken, undefined, 'resetShortToken not undefined');
            assert.strictEqual(user.resetExpires, undefined, 'resetExpires not undefined');

            assert.isString(db[i].password, 'password not a string');
            assert.equal(db[i].password.length, 60, 'password wrong length');

            done();
          });
        });

        it('requires user ident', (done) => {
          const resetShortToken = '00099';
          const i = 0;

          verifyReset.create({ action: 'resetPwdShort', value: {
            token: resetShortToken, password, user: {}
          } }, {}, (err, user) => {
            assert.isString(err.message);
            assert.isNotFalse(err.message);

            done();
          });
        });

        it('throws on non-configured user ident', (done) => {
          const resetShortToken = '00099';
          const i = 0;

          verifyReset.create({ action: 'resetPwdShort', value: {
            token: resetShortToken, password, user: { email: db[i].email, resetShortToken }
          } }, {}, (err, user) => {
            assert.isString(err.message);
            assert.isNotFalse(err.message);

            done();
          });
        });

        it('error on unverified user', (done) => {
          const resetShortToken = '22299';
          const i = 3;

          verifyReset.create({ action: 'resetPwdShort', value: {
            token: resetShortToken, user: { email: db[i].email }, password
          } }, {}, (err, user) => {
            assert.isString(err.message);
            assert.isNotFalse(err.message);

            done();
          });
        });

        it('error on expired token', (done) => {
          const resetShortToken = '11199';
          const i = 2;

          verifyReset.create({ action: 'resetPwdShort', value: {
            token: resetShortToken, user: { username: db[i].username }, password }
          }, {}, (err, user) => {
            assert.isString(err.message);
            assert.isNotFalse(err.message);

            done();
          });
        });

        it('error on user not found', (done) => {
          const resetShortToken = '999';
          verifyReset.create({ action: 'resetPwdShort', value: {
            token: resetShortToken, user: { email: '999' }, password
          } }, {}, (err, user) => {
              assert.isString(err.message);
              assert.isNotFalse(err.message);

              done();
            });
        });

        it('error incorrect token', (done) => {
          const resetShortToken = '999';
          const i = 0;

          verifyReset.create({ action: 'resetPwdShort', value: {
            token: resetShortToken, user: { email: db[i].email }, password
          } }, {}, (err, user) => {
            assert.isString(err.message);
            assert.isNotFalse(err.message);

            done();
          });
        });
      });


      describe('with email', () => {
        var db;
        var app;
        var users;
        var spyEmailer;
        var verifyReset;
        const password = '123456';

        beforeEach(() => {
          db = clone(usersDb);
          app = feathersStubs.app();
          users = feathersStubs.users(app, db, ifNonPaginated, idType);
          spyEmailer = new SpyOn(emailer);

          verifyResetService({
            // maybe reset userPropsForShortToken
            emailer: spyEmailer.callWithCb,
            testMode: true
          }).call(app);
          verifyReset = app.service('verifyReset'); // get handle to verifyReset
        });
  
        it('verifies valid token', (done) => {
          const resetShortToken = '00099';
          const i = 0;
    
          verifyReset.create({
              action: 'resetPwdShort',
              value: { token: resetShortToken, user: { email: db[i].email }, password } },
            {},
            (err, user) => {
              assert.strictEqual(err, null, 'err code set');
        
              assert.strictEqual(user.isVerified, true, 'user.isVerified not true');
        
              assert.strictEqual(db[i].isVerified, true, 'isVerified not true');
              assert.strictEqual(db[i].resetToken, null, 'resetToken not null');
              assert.strictEqual(db[i].resetExpires, null, 'resetExpires not null');
        
              const hash = db[i].password;
              assert.isString(hash, 'password not a string');
              assert.equal(hash.length, 60, 'password wrong length');
        
              assert.deepEqual(spyEmailer.result(), [{
                args: [
                  'resetPwd',
                  Object.assign({}, sanitizeUserForEmail(db[i])),
                  {},
                  ''
                ],
                result: [null],
              }]);
        
              done();
            });
        });
      });
    });
  });
});

// Helpers

function emailer(action, user, notifierOptions, newEmail, cb) {
  cb(null);
}

function sanitizeUserForEmail(user) {
  const user1 = Object.assign({}, user);

  delete user1.password;

  return user1;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
