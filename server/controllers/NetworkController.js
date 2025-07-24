const ping = require('ping');
const readLocationData = require('../utils/readExcel');
const PingLog = require('../models/PingLog');

// ✅ Controller: Get current ping status
const getNetworkStatus = async (req, res) => {
  try {
    const locations = readLocationData();
    const checkedAt = new Date();

    const results = await Promise.all(
      locations.map(async (loc) => {
        const location = loc.location?.trim();
        const jioIP = loc.jio?.trim();
        const bsnlIP = loc.bsnl?.trim();

        let jioStatus = 'not-applicable';
        let bsnlStatus = 'not-applicable';

        try {
          if (jioIP && !['No Link', 'NA'].includes(jioIP)) {
            const jioResult = await ping.promise.probe(jioIP, { timeout: 2, min_reply: 1 });
            jioStatus = jioResult.alive ? 'good' : 'poor';
          }

          if (bsnlIP && !['No Link', 'NA'].includes(bsnlIP)) {
            const bsnlResult = await ping.promise.probe(bsnlIP, { timeout: 2, min_reply: 1 });
            bsnlStatus = bsnlResult.alive ? 'good' : 'poor';
          }

          await PingLog.create({
            location,
            jioStatus,
            bsnlStatus,
            timestamp: checkedAt
          });

          return {
            location,
            jio: jioStatus,
            bsnl: bsnlStatus,
            checkedAt: checkedAt.toLocaleString('en-IN', {
              hour12: true,
              timeStyle: 'medium',
              dateStyle: 'short',
            }),
          };
        } catch (pingErr) {
          console.error(`❌ Ping failed for ${location}:`, pingErr);
          return { location, jio: 'error', bsnl: 'error', checkedAt };
        }
      })
    );

    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching network status:", err);
    res.status(500).json({ message: 'Failed to get network status' });
  }
};

// ✅ Controller: Alert check — any location poor for 30 mins?
const checkAlertStatus = async (req, res) => {
  try {
    const THIRTY_MINUTES_AGO = new Date(Date.now() - 30 * 60 * 1000);
    const locations = readLocationData();

    const problematicLocations = [];

    for (const loc of locations) {
      const location = loc.location?.trim();

      const recentLogs = await PingLog.find({
        location,
        timestamp: { $gte: THIRTY_MINUTES_AGO }
      }).sort({ timestamp: -1 });

      if (recentLogs.length === 0) continue;

      const allPoor = recentLogs.every(log =>
        (log.jioStatus === 'poor' || log.jioStatus === 'not-applicable') &&
        (log.bsnlStatus === 'poor' || log.bsnlStatus === 'not-applicable')
      );

      if (allPoor) {
        problematicLocations.push({ location, logs: recentLogs });
      }
    }

    res.json({ alert: problematicLocations.length > 0, problematicLocations });
  } catch (err) {
    console.error("❌ Error checking alert status:", err);
    res.status(500).json({ message: 'Failed to check alert status' });
  }
};

module.exports = {
  getNetworkStatus,
  checkAlertStatus
};
