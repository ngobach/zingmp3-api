const { fetch: rp } = require('../utils');

const lru = require('lru-cache')({
  max: 500,
  maxAge: 1000 * 60 * 60 * 24
});

module.exports = {
  async fetch(id) {
    if (lru.has(id)) {
      return lru.get(id);
    }
    let json = JSON.parse(await rp(`http://api.mp3.zing.vn/api/mobile/playlist/getsonglist?requestdata={"id":"${id}","length":9999}&fromvn=true`));
    if (!json.docs) {
      return null;
    }
    let data = json.docs.map(s => ({
      id: s.song_id,
      title: s.title,
      artist: s.artist,
      source: s.source['128'].replace(/^.*\/(.+)$/, '/caching/$1'),
      cover: s.thumbnail ? 'http://image.mp3.zdn.vn/' + s.thumbnail : null
    }));
    lru.set(id, data);
    return data;
  }
};
