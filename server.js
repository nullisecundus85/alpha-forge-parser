import { Buffer } from 'node:buffer';
import express from 'express';
import cors from 'cors';
import aiInterpreter from './aiInterpreter.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.json({ limit: '50mb' }));

// Helper to decode base64 PDF and extract text
async function decodeAndExtractText(base64) {
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = Buffer.from(base64, 'base64');
  const data = await pdfParse(buffer);
  return data.text;
}

// Route to receive base64 PDF and return structured workouts
app.post('/api/parse-pdf', async (req, res) => {
  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ error: 'Missing base64 PDF data' });
    }

    const text = await decodeAndExtractText(base64);
    const result = await aiInterpreter.processPDFData(text);

    res.json({ text, result });
  } catch (err) {
    console.error('❌ PDF Parse Error:', err);
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 PDF Parser API running at http://localhost:${PORT}`);
});