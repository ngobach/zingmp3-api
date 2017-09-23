const express = require('express');
const cors = require('cors');
const Zing = require('./services/zing');
const Playlist = require('./models/playlist');

let router = express.Router();
router.use(cors());
router.get('/', async (req, res) => {
  let domain = req.query.domain || req.hostname;
  if (!domain) {
    res.status(404).send({
      message: 'Domain not set'
    });
    return;
  }
  try {
    let data = await Playlist.getPlaylists(domain);
    if (!data) {
      res.status(404).send({
        message: 'Not found'
      });
      return;
    }
    await Promise.all(data.map(async (pl) => {
      pl.songs = await Zing.fetch(pl.id);
    }));
    res.send(data);
  } catch (err) {
    console.error(err);
    res.send('Err');
  }
});
module.exports = router;
