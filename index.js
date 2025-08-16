import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// POST route
app.post('/', async (req, res) => {
    const userMessage = req.body.message;

    try {
        const response = await axios.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
            {
                contents: [
                    { parts: [{ text: userMessage }] }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': process.env.API_KEY
                }
            }
        );

        console.log(JSON.stringify(response.data, null, 2));

        // Combine all parts from all candidates
        const candidates = response.data.candidates || [];
        let botReply = "No answer from Gemini";

        if (candidates.length > 0) {
            botReply = candidates
                .map(candidate => candidate.content?.parts?.map(p => p.text).join(''))
                .filter(Boolean)
                .join('\n\n');
        }

        res.json({ reply: botReply });

    } catch (err) {
        console.error('Axios error data:', err.response?.data);
        res.status(500).json({ error: 'Something went wrong', details: err.response?.data });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Backend running on http://localhost:3000');
});
