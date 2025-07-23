const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const networkRoutes = require('./routes/networkRoutes');

// Load environment variables
dotenv.config();

const app = express();

// ✅ Fix: Enable CORS for your frontend's Render URL
app.use(cors({
  origin: 'https://connect-frontend-t3if.onrender.com', // your frontend URL
  credentials: true
}));

// Body parser
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)

.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/network', networkRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('🌐 IOCL Backend Running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
