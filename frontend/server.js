require('dotenv').config();

const express = require('express');
const { Pool } = require('pg');

const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.get('/api/drivers', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE user_type = 'driver' ORDER BY id"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/drivers/:id', async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM users WHERE id = $1 AND user_type = 'driver'",
      [req.params.id]
    );

    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DriverLink server running on port ${PORT}`);
});
