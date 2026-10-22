const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const plannerRoutes = require('./routes/planner');
app.use('/api/auth', authRoutes);
app.use('/api/planner', plannerRoutes);

// Base route
app.get('/', (req, res) => {
    res.send('AI Study Planner API is running...');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
