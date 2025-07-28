const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const networkRoutes = require('./routes/networkRoutes');
const readLocationData = require('./utils/readExcel');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB connection (updated: removed deprecated options)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/network', networkRoutes);

// ✅ Log location data from Excel at startup
const data = readLocationData();
console.log('📄 Loaded location data:', data);

// ✅ Root route for health check
app.get('/', (req, res) => {
  res.send('✅ IOCL backend is live!');
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Auto ping every 30 minutes
const { getNetworkStatus } = require('./controllers/NetworkController');

const runAutoPing = async () => {
  try {
    await getNetworkStatus({}, { json: () => {} }); // dummy req/res for standalone call
    console.log('📡 Auto ping completed at', new Date().toLocaleString());
  } catch (err) {
    console.error('❌ Auto ping failed:', err);
  }
};

// Run once on startup, then every 30 mins
runAutoPing();
setInterval(runAutoPing, 5 * 60 * 1000); // every 5 minutes
