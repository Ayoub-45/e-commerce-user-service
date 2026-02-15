const express = require('express');

// const userRoutes = require('./routes/user.routes');

const app = express();

// 1. Global Middleware
app.use(express.json()); // Essential for parsing POST/PUT request bodies
app.use('/health', require('./routes/health.routes')); // Health check endpoin
app.use('/auth', require('./routes/auth.routes')); // Authentication routes
app.use('/protected', require('./routes/protected.routes'));
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

module.exports = app;