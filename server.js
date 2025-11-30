/**
 * Rideau Canal Monitoring Dashboard - Backend Server
 * Computes safety status and serves real-time & historical data
 */

const express = require('express');
const { CosmosClient } = require('@azure/cosmos');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

/* =========================================================
   Middleware
   ========================================================= */
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

/* =========================================================
   Cosmos DB Client
   ========================================================= */
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE);
const container = database.container(process.env.COSMOS_CONTAINER);

/* =========================================================
   Safety Status Logic (AUTHORITATIVE SOURCE)
   ========================================================= */
function computeSafetyStatus(avgIceThicknessCm) {
    if (typeof avgIceThicknessCm !== 'number') return 'Unknown';
    if (avgIceThicknessCm >= 40) return 'Safe';
    if (avgIceThicknessCm >= 30) return 'Caution';
    return 'Unsafe';
}

/* =========================================================
   API: Latest Readings (with safety status)
   ========================================================= */
app.get('/api/latest', async (req, res) => {
    try {
        const locations = ['dowslake', 'fifthave', 'nac'];
        const results = [];

        for (const location of locations) {
            const querySpec = {
                query: `
                    SELECT TOP 1 *
                    FROM c
                    WHERE c.location = @location
                    ORDER BY c.timestamp DESC
                `,
                parameters: [
                    { name: '@location', value: location }
                ]
            };

            const { resources } = await container.items
                .query(querySpec)
                .fetchAll();

            if (resources.length > 0) {
                const record = resources[0];

                record.safetyStatus = computeSafetyStatus(
                    record.avgIceThicknessCm
                );

                results.push(record);
            }
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: results
        });

    } catch (error) {
        console.error('Error fetching latest data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch latest data'
        });
    }
});

/* =========================================================
   API: Historical Data
   ========================================================= */
app.get('/api/history/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const limit = parseInt(req.query.limit, 10) || 12;

        const querySpec = {
            query: `
                SELECT TOP @limit *
                FROM c
                WHERE c.location = @location
                ORDER BY c.timestamp DESC
            `,
            parameters: [
                { name: '@location', value: location },
                { name: '@limit', value: limit }
            ]
        };

        const { resources } = await container.items
            .query(querySpec)
            .fetchAll();

        res.json({
            success: true,
            location,
            data: resources.reverse() // oldest → newest
        });

    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch historical data'
        });
    }
});

/* =========================================================
   API: Overall System Status
   ========================================================= */
app.get('/api/status', async (req, res) => {
    try {
        const locations = ['dowslake', 'fifthave', 'nac'];
        const statuses = [];

        for (const location of locations) {
            const querySpec = {
                query: `
                    SELECT TOP 1 c.location, c.avgIceThicknessCm, c.timestamp
                    FROM c
                    WHERE c.location = @location
                    ORDER BY c.timestamp DESC
                `,
                parameters: [
                    { name: '@location', value: location }
                ]
            };

            const { resources } = await container.items
                .query(querySpec)
                .fetchAll();

            if (resources.length > 0) {
                const record = resources[0];
                const safetyStatus = computeSafetyStatus(
                    record.avgIceThicknessCm
                );

                statuses.push({
                    location: record.location,
                    safetyStatus,
                    timestamp: record.timestamp
                });
            }
        }

        let overallStatus = 'Unknown';

        if (statuses.some(s => s.safetyStatus === 'Unsafe')) {
            overallStatus = 'Unsafe';
        } else if (statuses.some(s => s.safetyStatus === 'Caution')) {
            overallStatus = 'Caution';
        } else if (statuses.every(s => s.safetyStatus === 'Safe')) {
            overallStatus = 'Safe';
        }

        res.json({
            success: true,
            overallStatus,
            locations: statuses
        });

    } catch (error) {
        console.error('Error fetching system status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch system status'
        });
    }
});

/* =========================================================
   API: All Data (Debug)
   ========================================================= */
app.get('/api/all', async (req, res) => {
    try {
        const querySpec = {
            query: `SELECT * FROM c`
        };

        const { resources } = await container.items
            .query(querySpec)
            .fetchAll();

        resources.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );

        res.json({
            success: true,
            count: resources.length,
            data: resources
        });

    } catch (error) {
        console.error('Error fetching all data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch all data'
        });
    }
});

/* =========================================================
   Dashboard + Health
   ========================================================= */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cosmosdb: {
            endpoint: process.env.COSMOS_ENDPOINT ? 'configured' : 'missing',
            database: process.env.COSMOS_DATABASE,
            container: process.env.COSMOS_CONTAINER
        }
    });
});

/* =========================================================
   Start Server
   ========================================================= */
app.listen(port, () => {
    console.log(`🚀 Rideau Canal Dashboard running at http://localhost:${port}`);
    console.log(`📊 API available at http://localhost:${port}/api`);
    console.log(`🏥 Health check at http://localhost:${port}/health`);
});

/* =========================================================
   Graceful Shutdown
   ========================================================= */
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server...');
    process.exit(0);
});
