const mongo = require('mongodb');
module.exports = mongo.MongoClient.connect(`mongodb://${process.env.MONGODB_HOST}/${process.env.MONGODB_DB}`);
