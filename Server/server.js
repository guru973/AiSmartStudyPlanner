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

const path = require('path');
const fs = require('fs');

// Health Check & Discovery Routes
app.get('/api', (req, res) => {
    res.json({ status: 'ok', message: 'AI Smart Study Planner API is online' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend connected successfully', timestamp: new Date().toISOString() });
});

// Serve Client static build if available
const clientDistPath = path.join(__dirname, '../Client/dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
}

// 404 Handler for unmatched API routes
app.use('/api', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        method: req.method,
        path: req.originalUrl,
        availableRoutes: ['/api/auth', '/api/planner', '/api/health']
    });
});

// SPA Fallback for client-side routing
app.use((req, res) => {
    if (fs.existsSync(clientDistPath)) {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    } else {
        res.status(404).send('AI Study Planner API is running. Client build not found.');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
