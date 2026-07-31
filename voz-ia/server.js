const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const PROXY = 'https://smartranks.co/proxy/a40f649b-92c5-44fd-9d19-91e373a37b60';

app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/generate', async (req, res) => {
  try {
    const response = await fetch(`${PROXY}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': 'proxy-key'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error('Error calling proxy:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`VOZ corriendo en http://localhost:${PORT}`);
});
