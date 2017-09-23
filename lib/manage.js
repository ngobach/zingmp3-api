const express = require('express');
const router = express.Router();
const Playlist = require('./models/playlist');

router.use((req, res, next) => {
  res.locals.baseUrl = '/admin/manage';
  next();
});

router.route('/')
  .get(async (req, res) => {
    // Showing home page
    let playlists = await Playlist.getPlaylists(req.session.domain);
    res.render('manage/home', {
      playlists,
      result: req.query.error && { message: req.query.error }
    });
  })
  .post(async (req, res) => {
    // Create
    try {
      req.check('id', 'This id is not valid').isUppercase().isAlphanumeric().isLength({ max: 8, min: 8 });
      req.check('color', 'Invalid playlist color').matches(/#[a-fA-F0-9]{6}/);

      (await req.getValidationResult()).throw();
      let result = Playlist.add(req.session.domain, {
        id: req.body.id,
        name: req.body.name,
        color: req.body.color
      });

      res.render('manage/create', {
        result: {
          message: result ? 'Playlist added' : 'Failed! Something happended'
        }
      });
    } catch (e) {
      res.render('manage/create', {
        result: {
          message: e.array && e.array().map(e => e.msg).join('\n') || e.message
        }
      });
    }
  });

router.post('/:id([A-Z0-9]+)/delete', async (req, res) => {
  await Playlist.delete(req.session.domain, req.params.id);
  res.redirect('/admin/manage');
});
module.exports = router;
