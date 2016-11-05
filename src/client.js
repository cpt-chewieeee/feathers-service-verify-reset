
/* global module: 0 */
// Wrapper for client interface to feathers-service-verify-reset

function VerifyReset(app) { // eslint-disable-line no-unused-vars
  if (!(this instanceof VerifyReset)) {
    return new VerifyReset(app);
  }

  const verifyReset = app.service('/verifyReset/:action/:value');

  this.checkUnique = (uniques, ownId, ifErrMsg, cb) => {
    verifyReset.create({
      action: 'checkUnique',
      value: uniques,
      ownId,
      meta: { noErrMsg: ifErrMsg },
    }, {}, cb);
  };

  this.resendVerify = (emailOrToken, cb) => {
    verifyReset.create({
      action: 'resendVerify',
      value: emailOrToken,
    }, {}, cb);
  };

  this.verifySignupLong = (token, cb) => {
    verifyReset.create({
      action: 'verifySignupLong',
      value: token,
    }, {}, cb);
  };
  
  this.verifySignupShort = (token, userFind, cb) => {
    verifyReset.create({
      action: 'verifySignupLong',
      value: { token, user: userFind }
    }, {}, cb);
  };

  this.sendResetPwd = (email, cb) => {
    verifyReset.create({
      action: 'sendResetPwd',
      value: email,
    }, {}, cb);
  };

  this.resetPwdLong = (token, password, cb) => {
    verifyReset.create({
      action: 'resetPwdLong',
      value: { token, password },
    }, {}, cb);
  };
  
  this.resetPwdShort = (token, userFind, password, cb) => {
    verifyReset.create({
      action: 'resetPwdLong',
      value: { token, password, user: userFind },
    }, {}, cb);
  };

  this.passwordChange = (oldPassword, password, user, cb) => {
    verifyReset.create({
      action: 'passwordChange',
      value: { oldPassword, password },
    }, { user }, cb);
  };

  this.emailChange = (password, email, user, cb) => {
    verifyReset.create({
      action: 'emailChange',
      value: { password, email },
    }, { user }, cb);
  };

  this.authenticate = (email, password, cb) => {
    let cbCalled = false;

    app.authenticate({ type: 'local', email, password })
      .then((result) => {
        const user = result.data;

        if (!user || !user.isVerified) {
          app.logout();
          cb(new Error(user ? 'User\'s email is not verified.' : 'No user returned.'));
          return;
        }

        cbCalled = true;
        cb(null, user);
      })
      .catch((err) => {
        if (!cbCalled) {
          cb(err);
        }
      });
  };
  
  // backwards compatability
  this.unique = this.checkUnique;
  this.verifySignUp = this.verifySignupLong;
  this.sendResetPassword = this.sendResetPwd;
  this.saveResetPassword = this.resetPwdLong;
  this.changePassword = this.passwordChange;
  this.changeEmail = this.emailChange;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = VerifyReset;
}
