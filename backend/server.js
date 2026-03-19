// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — these run on every request
app.use(cors());           // allows frontend to call this backend
app.use(express.json());   // allows backend to read JSON from requests

// All API routes start with /api
app.use('/api', apiRoutes);

// Simple test route — visit localhost:5000 to confirm server works
app.get('/', (req, res) => {
  res.json({ message: 'CryptoShield backend is running!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});