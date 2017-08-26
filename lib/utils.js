const rp = require('request-promise');

/**
 * Fetch with retries
 * @param {string} url 
 */

function fetch(url, { retries = 5, binary = false } = {}) {
    const createPromise = () => rp({
        url,
        encoding: binary ? null : 'utf8'
    }).catch(err => {
        if (!retries) return Promise.reject(err);
        retries--;
        return createPromise();
    });
    return createPromise();
}

exports.fetch = fetch;
