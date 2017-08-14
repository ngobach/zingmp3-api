require('dotenv').config();

require('./lib/app').listen(8000, () => {
    console.log('App listening on port :8000');
});
