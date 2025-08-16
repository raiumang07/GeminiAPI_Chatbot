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
                    {
                        parts: [
                            { text: userMessage }
                        ]
                    }
                ]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': process.env.API_KEY
                }
            }
        );

        const candidate = response.data.candidates?.[0];
        const botReply = candidate?.content?.parts?.[0]?.text || "No answer from Gemini";
        res.json({ reply: botReply });


    } catch (err) {
        console.error(err?.response?.data || err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Backend running on http://localhost:3000');
});
