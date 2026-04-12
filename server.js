const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// DATA_DIR can be pointed to a Railway persistent volume.
// In Railway dashboard: add a volume mounted at /data, then set env var DATA_DIR=/data
const DATA_DIR  = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'shichen-data.json');

const defaultData = {
    labels:     ['禮', '休', '休', '禮、煉、茶', '背', '編', '編', '人、憩', '論', '藝', '項', '經、煉'],
    extraTasks: ['', '', '', '', '', '', '', '', '', '', '', ''],
    planning: {
        missionStatement: '',
        longTermGoals: [],
        habits: [],
        weeklyRoles: []   // each: { role: string, goal: string }
    },
    errands: []
};

async function initData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        try {
            await fs.access(DATA_FILE);
            // Migrate old array format to new object format
            const raw = await fs.readFile(DATA_FILE, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                const migrated = { ...defaultData, tasks: parsed };
                await fs.writeFile(DATA_FILE, JSON.stringify(migrated, null, 2));
                console.log('Migrated old data format to new format.');
            }
        } catch {
            // File doesn't exist — create with defaults
            await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
        }
    } catch (err) {
        console.error('Error initializing data:', err);
    }
}

// Unified data endpoint
app.get('/api/data', async (req, res) => {
    try {
        const raw = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(raw));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/data', async (req, res) => {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Legacy endpoint for backwards compatibility
app.get('/api/schedule', async (req, res) => {
    try {
        const raw = await fs.readFile(DATA_FILE, 'utf8');
        const data = JSON.parse(raw);
        res.json(Array.isArray(data) ? data : (data.tasks || defaultData.tasks));
    } catch (err) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

const PORT = process.env.PORT || 3000;
initData().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
