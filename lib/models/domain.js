const $db = require('../db');
const crypto = require('crypto');

function newHmac() {
    return crypto.createHmac('sha1', process.env.SECRET);
}

module.exports = {
    /**
     * Create new domain entry
     * @param {string} domain The domain name
     * @param {string} password User provided password
     */
    async create(domain, password) {
        let db = await $db;
        if (await db.collection('domains').count({ domain }))
            throw new Error('Domain already existed!');
        else {
            await db.collection('domains').insertOne({
                domain,
                password: newHmac().update(password).digest().toString('hex'),
                playlists: []
            });
        }
        return 'Domain created successfully!';
    },

    /**
     * Check user login credential
     * @param {string} domain The domain name to check
     * @param {string} password The user provided password
     */
    async check(domain, password) {
        let db = await $db;
        let tmp = await db.collection('domains').count({ domain, password: newHmac().update(password).digest().toString('hex') });
        return tmp > 0;
    },

    /**
     * Change domain password!
     * @param {string} domain Domain name
     * @param {strin} newPassword 
     */
    async changePassword(domain, newPassword) {
        const db = await $db;
        db.collection('domains').updateOne({ domain: domain }, { $set: { password: newHmac().update(newPassword).digest().toString('hex') } });
    }
}
