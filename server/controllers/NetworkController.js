const ping = require('ping');
const readLocationData = require('../utils/readExcel');
const PingLog = require('../models/PingLog');

// ✅ 1. Fetch and Log Current Network Status
exports.getNetworkStatus = async (req, res) => {
  try {
    const locations = readLocationData();
    const checkedAt = new Date();

    const results = await Promise.all(
      locations.map(async (loc) => {
        const jioIP = loc.jio?.trim();
        const bsnlIP = loc.bsnl?.trim();

        const jioResult = (jioIP && !['No Link', 'NA'].includes(jioIP))
          ? await ping.promise.probe(jioIP)
          : { alive: false };

        const bsnlResult = (bsnlIP && !['No Link', 'NA'].includes(bsnlIP))
          ? await ping.promise.probe(bsnlIP)
          : { alive: false };

        const jioStatus = jioResult.alive ? 'good' : 'poor';
        const bsnlStatus = bsnlResult.alive ? 'good' : 'poor';

        await PingLog.create({
          location: loc.location?.trim(),
          jioStatus,
          bsnlStatus,
          timestamp: checkedAt
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

// ✅ 2. Alert if Poor for 30+ Minutes
exports.checkAlertStatus = async (req, res) => {
  try {
    const logs = await PingLog.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$location",
          logs: {
            $push: {
              timestamp: "$timestamp",
              jioStatus: "$jioStatus",
              bsnlStatus: "$bsnlStatus"
            }
          }
        }
      }
    ]);

    const alerts = [];

    logs.forEach((group) => {
      const location = group._id;
      const recentLogs = group.logs.slice(0, 6); // Last 6 logs (~30 minutes)

      const isJioDown = recentLogs.every(log => log.jioStatus === 'poor');
      const isBSNLDown = recentLogs.every(log => log.bsnlStatus === 'poor');

      const duration = (new Date(recentLogs[0]?.timestamp) - new Date(recentLogs[recentLogs.length - 1]?.timestamp)) / (1000 * 60);

      if ((isJioDown || isBSNLDown) && duration >= 30) {
        alerts.push({
          location,
          jioStatus: isJioDown ? 'poor' : 'ok',
          bsnlStatus: isBSNLDown ? 'poor' : 'ok',
          alert: true
        });
      }
    });

    res.json({ alerts });
  } catch (err) {
    console.error("❌ Error checking alerts:", err);
    res.status(500).json({ message: 'Failed to check alerts' });
  }
};
