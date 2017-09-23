const express = require('express');
const expressValidator = require('express-validator');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const Domain = require('./models/domain');

let router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(cookieSession({
  keys: [process.env.SECRET || 'h4l0']
}));
router.use(expressValidator());

router.get('/', (req, res) => req.session.domain ? res.redirect('/admin/manage') : res.redirect('/admin/login'));

// Reusable middlewares
const onlyGuest = (req, res, next) => {
  if (req.session.domain) next(new Error('Only guest can access this section'));
  next();
};

const onlyUser = (req, res, next) => {
  if (!req.session.domain) next(new Error('Only authenticated user can access this section'));
  res.locals.domain = req.session.domain;
  next();
};

router.route('/login')
  .get(onlyGuest, (req, res) => res.render('login'))
  .post(onlyGuest, async (req, res) => {
    try {
      req.check('domain', 'Must be a domain').isFQDN();
      req.check('password', 'Password length must be between 6 and 20 characters').isLength({ min: 6, max: 20 });
      (await req.getValidationResult()).throw();
      if (await Domain.check(req.body.domain, req.body.password)) {
        req.session.domain = req.body.domain;
        res.redirect('/admin/manage');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (e) {
      if (e.mapped) {
        // Validation Error
        res.render('login', {
          errors: e.useFirstErrorOnly().mapped()
        });
      } else {
        res.render('login', {
          result: {
            message: e.message,
            class: 'error'
          }
        });
      }
    }
  });

router.get('/logout', onlyUser, (req, res) => {
  req.session.domain = null;
  res.redirect('/admin');
});

router.use('/changepass', onlyUser);
router.route('/changepass')
  .get((req, res) => res.render('changepass'))
  .post(async (req, res) => {
    try {
      // Check user provided password
      if (await Domain.check(req.session.domain, req.body.old_password)) {
        if (req.body.new_password !== req.body.retype_new_password) {
          throw new Error('Two password do not matches!');
        }
        Domain.changePassword(req.session.domain, req.body.new_password);
        res.render('changepass', {
          result: {
            class: 'primary',
            message: 'Password changed successfully.'
          }
        });
      } else {
        throw new Error('Old password do not matches');
      }
    } catch (e) {
      res.render('changepass', {
        result: {
          class: 'error',
          message: e.message
        }
      });
    }
  });

router.route('/register')
  .get(onlyGuest, (req, res) => res.render('register'))
  .post(onlyGuest, async (req, res) => {
    try {
      // Validating
      req.check('domain', 'Must be a FQDN').isFQDN();
      req.check('password', 'Password length must be between 6 and 20 characters').isLength({ min: 6, max: 20 });
      (await req.getValidationResult()).throw();
      if (req.body.password !== req.body.repassword) {
        throw new Error('Password do not matches');
      }
      let result = await Domain.create(req.body.domain, req.body.password);
      res.render('register', {
        result: {
          message: result,
          class: 'primary'
        }
      });
    } catch (exc) {
      res.render('register', {
        result: {
          message: exc.message,
          class: 'error'
        },
        old: req.body,
        errors: exc.array && exc.useFirstErrorOnly().array()
      });
    }
  });

router.use('/manage', onlyUser, require('./manage'));
module.exports = router;
