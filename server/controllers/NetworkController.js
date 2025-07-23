const ping = require('ping');
const readLocationData = require('../utils/readExcel');
const PingLog = require('../models/PingLog'); // ✅ Import the log model

exports.getNetworkStatus = async (req, res) => {
  try {
    const locations = readLocationData();
    const checkedAt = new Date(); // ✅ Same timestamp for all logs

    const results = await Promise.all(
      locations.map(async (loc) => {
        const jioIP = loc.jio;
        const bsnlIP = loc.bsnl;

        const jioResult = (jioIP && !['No Link', 'NA'].includes(jioIP.trim()))
          ? await ping.promise.probe(jioIP.trim())
          : { alive: false };

        const bsnlResult = (bsnlIP && !['No Link', 'NA'].includes(bsnlIP.trim()))
          ? await ping.promise.probe(bsnlIP.trim())
          : { alive: false };

        const jioStatus = jioResult.alive ? 'good' : 'poor';
        const bsnlStatus = bsnlResult.alive ? 'good' : 'poor';

        // ✅ Save to PingLog with correct field names
        await PingLog.create({
          location: loc.location?.trim(),
          jio: jioStatus,
          bsnl: bsnlStatus,
          checkedAt: checkedAt  // ✅ must be Date object for TTL
        });

        return {
          location: loc.location?.trim(),
          jio: jioStatus,
          bsnl: bsnlStatus,
          checkedAt: checkedAt.toLocaleString('en-IN', {
            hour12: true,
            timeStyle: 'medium',
            dateStyle: 'short',
          }),
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching network status:", err);
    res.status(500).json({ message: 'Failed to get network status' });
  }
};
