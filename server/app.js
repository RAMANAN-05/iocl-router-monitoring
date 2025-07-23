const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const networkRoutes = require('./routes/networkRoutes');
const readLocationData = require('./utils/readExcel');

dotenv.config();

const app = express();

// ✅ Allow CORS only from your deployed frontend
app.use(cors({
  origin: 'https://connect-frontend-t3if.onrender.com',
  credentials: true // Optional: needed only for cookies or credentials
}));

app.use(express.json());

// 🔍 Debug: Check if MONGO_URI is loading from env
console.log('🔧 MONGO_URI from env:', process.env.MONGO_URI);

// ✅ MongoDB connection setup
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Test root route
app.get('/', (req, res) => {
  res.send('✅ Backend is working!');
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/network', networkRoutes);

// ✅ Log Excel location data once at startup
const data = readLocationData();
console.log('📄 Loaded location data:', data);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
