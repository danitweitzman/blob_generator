import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('.'));

// Endpoint to save a new emotion
app.post('/save_emotion', async (req, res) => {
  try {
    const { emotionName, emotion } = req.body;
    
    // Read current emotions
    const emotionsPath = path.join(__dirname, 'emotions_dataset.json');
    const emotionsData = await fs.readFile(emotionsPath, 'utf8');
    const emotions = JSON.parse(emotionsData);
    
    // Add new emotion
    emotions[emotionName] = emotion;
    
    // Write back to file with pretty formatting
    await fs.writeFile(emotionsPath, JSON.stringify(emotions, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving emotion:', error);
    res.status(500).json({ error: 'Failed to save emotion' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 