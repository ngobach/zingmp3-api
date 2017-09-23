const express = require('express');

const app = module.exports = express();

app.set('view engine', 'pug');
app.locals = {
  title: 'Zing MP3 API Backend'
};

app.use('/api', require('./api'));
app.use('/admin', require('./admin'));
app.use('/caching', require('./caching'));
app.use(express.static('./public'));

// Final handler
app.use((req, res) => res.status(404).render('404'));
