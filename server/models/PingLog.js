const mongoose = require('mongoose');

const pingLogSchema = new mongoose.Schema({
  location: String,
  jio: String,
  bsnl: String,
  checkedAt: { type: Date, default: Date.now },
});

// TTL index – delete documents 10 days (864000 seconds) after `checkedAt`
pingLogSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 864000 });

module.exports = mongoose.model('PingLog', pingLogSchema);
