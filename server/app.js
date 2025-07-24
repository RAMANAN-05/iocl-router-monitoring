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

// ✅ MongoDB connection setup
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/network', networkRoutes);

// ✅ Optional: Log Excel data once at startup
const data = readLocationData();
console.log('📄 Loaded location data:', data);

// ✅ Root route to test backend deployment
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
    await getNetworkStatus({},{ json: () => {} }); // dummy req/res
    console.log('✅ Auto ping completed at', new Date().toLocaleString());
  } catch (err) {
    console.error('❌ Auto ping failed:', err);
  }
};

// Start ping immediately and set interval
runAutoPing(); // first run on startup
setInterval(runAutoPing, 60 * 1000); // every 30 minutes
