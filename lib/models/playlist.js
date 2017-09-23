const $db = require('../db');

module.exports = {
  /**
   * Get playlists by domain
   * @param {string} domain 
   */
  async getPlaylists(domain) {
    const db = await $db;
    let result = await db.collection('domains').findOne({ domain });
    return result && result.playlists;
  },

  /**
   * Add Playlist to domain
   * @param {string} domain 
   * @param {string} playlist 
   */
  async add(domain, playlist) {
    const db = await $db;
    await db.collection('domains').updateOne({ domain }, { $push: { playlists: playlist } });
    return true;
  },

  async delete(domain, id) {
    const db = await $db;
    await db.collection('domains').updateOne({ domain }, { $pull: { playlists: { id } } });
  }
};
