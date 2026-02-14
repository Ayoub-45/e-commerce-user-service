const express = require('express');
const healthRoutes = require('./routes/health.routes');
// const userRoutes = require('./routes/user.routes');

const app = express();

// 1. Global Middleware
app.use(express.json()); // Essential for parsing POST/PUT request bodies
app.get('/test', (req, res) => {
    res.send("Server is alive!");
});
app.use('/health', healthRoutes);


app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

module.exports = app;