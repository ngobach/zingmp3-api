const path = require('path');
const express = require('express');
const { fetch } = require('../utils');
const fs = require('mz/fs');
const storage_path = path.join(__dirname, '../../caches');
const router = express.Router();

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(404).send('Id expected!');
    }
    try {
        const fileName = path.join(storage_path, `${id}.mp3`);
        let cached;
        if (!(await fs.exists(fileName))) {
            cached = false;
            data = await fetch(`http://api.mp3.zing.vn/api/mobile/source/song/${id}`, { binary: true, retries: 10 });
            await fs.writeFile(fileName, data);
        } else {
            cached = true;
        }
        res.header('X-Cached', cached ? 'yes' : 'no').contentType('audio/mpeg').download(fileName);
    } catch (e) {
        res.send(e.message);
    }
});

module.exports = router;
