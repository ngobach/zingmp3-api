const express = require('express');
const rp = require('request-promise');
const moment = require('moment');
const levelup = require('level');

const DB_URI = 'mongodb://thanbaiks:r4yqu4z4@ds123752.mlab.com:23752/zingmp3'
const CACHE_TIMEOUT = [1, 'd'];
const app = express();
const db = levelup('./db');

var retries = 5;

function fetch(id) {
    return rp.get('http://api.mp3.zing.vn/api/mobile/playlist/getsonglist?requestdata={"id":"' + id + '","length":9999}&fromvn=true').then(data => {
        data = JSON.parse(data);
        if (!data.docs) {
            return null;
        }
        return data.docs.map(s => ({
            id: s.song_id,
            title: s.title,
            artist: s.artist,
            source: s.source['128'],
            cover: s.thumbnail ? 'http://image.mp3.zdn.vn/' + s.thumbnail : null
        }));
    }).catch(err => {
        if (retries) {
            retries--;
            return fetch(id);
        } else {
            return Promise.reject(err);
        }
    });
}

function isExpired(date) {
    return moment().isAfter(moment(date).add(CACHE_TIMEOUT[0], CACHE_TIMEOUT[1]));
}

function mGet(id) {
    return new Promise((res, rej) => {
        db.get(id, (err, data) => {
            if (err) {
                res(null);
            } else {
                res(JSON.parse(data));
            }
        });
    });
}

function mPut(id, data) {
    return new Promise((res, rej) => {
        db.put(id, JSON.stringify(data), err => {
            if (err) {
                rej(err);
            } else {
                res();
            }
        })
    });
}

app.get('/', (req, res, next) => {
    res.type('text').end('(c) BachNx');
});

app.get('/purge', (req, res, next) => {
    db.close();
    require('fs').unlinkSync('./db');
    db.open();
    res.end('Cached purged!');
});

app.get('/:id', (req, res, next) => {
    const id = req.params.id;
    if (!/[A-Z0-9]{8}/.test(id)) {
        res.end('Invalid Album ID');
        return;
    }
    console.log('Typeof: ', typeof req.query.nocache);
    mGet(id).then(obj => {
        if (!obj || isExpired(obj.createdAt) || typeof (req.query.nocache) != 'undefined') {
            // Must fetch new
            return fetch(id).then(data => {
                if (!data) {
                    res.sendStatus(404).end();
                    res.end();
                    return;
                } else {
                    res.header('X-Is-Cached', 'Nope :(');
                    res.json(data);
                    res.end();
                    return mPut(id, { createdAt: new Date(), items: data });
                }
            });
        } else {
            // Send cached items
            res.header('X-Is-Cached', 'Yep');
            res.json(obj.items);
            res.end();
            return;
        }
    }).catch(err => {
        // Something unexpected
        console.log(err);
        res.sendStatus(500);
    });
});

app.listen(8080);
