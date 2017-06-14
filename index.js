const express = require('express');
const rp = require('request-promise');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const moment = require('moment');

const DB_URI = 'mongodb://thanbaiks:r4yqu4z4@ds123752.mlab.com:23752/zingmp3'
const CACHE_TIMEOUT = [1, 'd'];
const app = express();

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

function mGet(db, id) {
    return new Promise((res, rej) => {
        db.collection('cache').find({ id }).nextObject((err, obj) => {
            if (err) {
                rej(err);
                return;
            }
            res(obj);
        });
    });
}

function mPut(db, id, obj) {
    return new Promise((res, rej) => {
        db.collection('cache').updateOne({ id }, obj, { upsert: true, w: 1 }, (err, result) => {
            if (err) {
                rej(err);
                return;
            }
            res();
        });
    });
}

function isExpired(date) {
    return moment().isAfter(moment(date).add(CACHE_TIMEOUT[0], CACHE_TIMEOUT[1]));
}

app.get('/', (req, res, next) => {
    res.type('text').end('(c) BachNx');
});

app.get('/purge', (req, res, next) => {
    MongoClient.connect(DB_URI, (err, db) => {
        if (err != null) {
            res.sendStatus(500);
            return;
        }
        db.collection('cache').drop();
        res.type('text').end('Cache Purged');
        return;
    })
});

app.get('/:id', (req, res, next) => {
    const id = req.params.id;
    if (!/[A-Z0-9]{8}/.test(id)) {
        res.end('Invalid Album ID');
        return;
    }
    MongoClient.connect(DB_URI, function (err, db) {
        if (err != null) {
            res.sendStatus(500);
            return;
        }
        mGet(db, id).then(obj => {
            if (!obj || isExpired(obj.createdAt) || req.query.nocache) {
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
                        return mPut(db, id, { createdAt: new Date(), items: data, id });
                    }
                });
            } else {
                // Send cached items
                res.header('X-Is-Cached', 'Yep');
                res.json(obj.items);
                res.end();
                return;
            }
        }).then(() => {
            // Finally
            db.close();
        }).catch(err => {
            // Something unexpected
            console.log(err);
            res.sendStatus(500);
        });
    });
});

app.listen(8080);
