const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World' });
});

module.exports = app;
