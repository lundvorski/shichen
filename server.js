const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data', 'shichen-data.json');

// Initialize data directory and file
async function initData() {
    try {
        await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
        try {
            await fs.access(DATA_FILE);
        } catch {
            // File doesn't exist, create with default data
            const defaultData = [
                '禮', '休', '休', '禮、煉、茶', '背', '編',
                '編', '人、憩', '論', '藝', '項', '經、煉'
            ];
            await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
        }
    } catch (err) {
        console.error('Error initializing data:', err);
    }
}

// Get schedule data
app.get('/api/schedule', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading data:', err);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Save schedule data
app.post('/api/schedule', async (req, res) => {
    try {
        const tasks = req.body;
        if (!Array.isArray(tasks) || tasks.length !== 12) {
            return res.status(400).json({ error: 'Invalid data format' });
        }
        await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2));
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving data:', err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

const PORT = process.env.PORT || 3000;

initData().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});