require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

let server;

// 1️⃣ Graceful shutdown function
const gracefulShutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);

    if (server) {
        server.close(() => {
            console.log("💤 HTTP server closed.");
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};

// 2️⃣ Catch unexpected errors
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Rejection:', err);
    process.exit(1);
});

// 3️⃣ Handle termination signals (important for Docker/Kubernetes)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 4️⃣ Start server ONLY after DB connection succeeds
const startServer = async () => {
    try {
        console.log("⏳ Connecting to MongoDB...");
        await connectDB();

        server = app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        process.exit(1); // Crash intentionally if DB fails
    }
};

startServer();
