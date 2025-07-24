const mongoose = require('mongoose');

const pingLogSchema = new mongoose.Schema({
  location: String,
  jioStatus: String,       // ✅ must match what's saved in controller
  bsnlStatus: String,
  timestamp: {             // ✅ should match field used in alert logic
    type: Date,
    default: Date.now
  }
});

// TTL index – delete documents after 10 days (864000 seconds)
pingLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 864000 });

module.exports = mongoose.model('PingLog', pingLogSchema);
