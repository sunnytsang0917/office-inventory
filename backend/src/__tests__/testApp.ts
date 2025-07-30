import express from 'express';

const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

export { app };