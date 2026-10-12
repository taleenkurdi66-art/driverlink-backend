require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(express.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

app.get('/api/drivers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE user_type = 'driver'"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/drivers', authenticateToken, async (req, res) => {
  const { name, email, phone, location, vehicle_type, vehicle_number } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users
       (name, email, user_type, phone, location, vehicle_type, vehicle_number, status)
       VALUES ($1, $2, 'driver', $3, $4, $5, $6, 'offline')
       RETURNING id, name, email, phone, location, vehicle_type, vehicle_number, status`,
      [name, email, phone, location, vehicle_type, vehicle_number]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/drivers/:id', authenticateToken, async (req, res) => {
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


app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const bcrypt = require('bcryptjs');

    const result = await pool.query(
      "SELECT id, name, email, user_type, role, password_hash FROM users WHERE email = $1 LIMIT 1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Password is not set' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        user_type: user.user_type,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Login error' });
  }
});


app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE user_type = 'driver') AS drivers,
        COUNT(*) FILTER (WHERE user_type = 'driver' AND status = 'online') AS active_drivers,
        (SELECT COUNT(*) FROM customers) AS customers,
        (SELECT COUNT(*) FROM trips) AS trips,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM commissions WHERE status <> 'cancelled') AS commission
      FROM users
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Dashboard database error' });
  }
});
app.put('/api/drivers/:id/location', authenticateToken, async (req, res) => {
  const { latitude, longitude } = req.body;

  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET latitude = $1,
           longitude = $2
       WHERE id = $3 AND user_type = 'driver'
       RETURNING id, name, latitude, longitude, status`,
      [latitude, longitude, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/drivers/:id', authenticateToken, async (req, res) => {
  const { name, email, phone, location, vehicle_type, vehicle_number } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           email = $2,
           phone = $3,
           location = $4,
           vehicle_type = $5,
           vehicle_number = $6
       WHERE id = $7 AND user_type = 'driver'
       RETURNING id, name, email, phone, location, vehicle_type, vehicle_number, status`,
      [name, email, phone, location, vehicle_type, vehicle_number, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, location, company_type, registration_number, status FROM companies ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load companies' });
  }
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      location,
      company_type,
      registration_number
    } = req.body;

    const result = await pool.query(
      `INSERT INTO companies
       (name, email, phone, location, company_type, registration_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        email,
        phone,
        location,
        company_type,
        registration_number
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      location,
      company_type,
      registration_number
    } = req.body;

    const result = await pool.query(
      `UPDATE companies
       SET name=$1, email=$2, phone=$3, location=$4,
           company_type=$5, registration_number=$6
       WHERE id=$7
       RETURNING *`,
      [
        name,
        email,
        phone,
        location,
        company_type,
        registration_number,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM companies WHERE id=$1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});


// ==================== CUSTOMERS API ====================

app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, location, status, created_at FROM customers ORDER BY id DESC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, location } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const result = await pool.query(
      `INSERT INTO customers (name, email, phone, location)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, location, status, created_at`,
      [
        name.trim(),
        email?.trim() || null,
        phone?.trim() || null,
        location?.trim() || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, location } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const result = await pool.query(
      `UPDATE customers
       SET name=$1, email=$2, phone=$3, location=$4
       WHERE id=$5
       RETURNING id, name, email, phone, location, status, created_at`,
      [
        name.trim(),
        email?.trim() || null,
        phone?.trim() || null,
        location?.trim() || null,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM customers WHERE id=$1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});


app.get('/api/commissions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.trip_id,
        c.driver_id,
        u.name AS driver_name,
        c.fare,
        c.commission_rate,
        c.commission_amount,
        c.driver_amount,
        c.status,
        c.created_at
      FROM commissions c
      LEFT JOIN users u ON u.id = c.driver_id
      ORDER BY c.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load commissions' });
  }
});

app.post('/api/commissions', authenticateToken, async (req, res) => {
  try {
    const { trip_id, fare, commission_rate = 10 } = req.body;

    if (!trip_id || fare === undefined || fare === null) {
      return res.status(400).json({ error: 'Trip ID and fare are required' });
    }

    const fareNumber = Number(fare);
    const rateNumber = Number(commission_rate);

    if (!Number.isFinite(fareNumber) || fareNumber < 0) {
      return res.status(400).json({ error: 'Invalid fare' });
    }

    if (!Number.isFinite(rateNumber) || rateNumber < 0 || rateNumber > 100) {
      return res.status(400).json({ error: 'Invalid commission rate' });
    }

    const tripCheck = await pool.query(
      'SELECT driver_id, status FROM trips WHERE id = $1',
      [trip_id]
    );

    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (tripCheck.rows[0].status !== 'completed') {
      return res.status(400).json({ error: 'Trip is not completed' });
    }

    const tripDriverId = tripCheck.rows[0].driver_id;
    let validDriverId = null;

    if (tripDriverId !== null) {
      const driverCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND user_type = $2',
        [tripDriverId, 'driver']
      );
      if (driverCheck.rows.length > 0) {
        validDriverId = driverCheck.rows[0].id;
      }
    }

    const commissionAmount = Math.round(fareNumber * rateNumber) / 100;
    const driverAmount = fareNumber - commissionAmount;

    const result = await pool.query(
      `INSERT INTO commissions
        (trip_id, driver_id, fare, commission_rate, commission_amount, driver_amount)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (trip_id) DO UPDATE SET
         driver_id = EXCLUDED.driver_id,
         fare = EXCLUDED.fare,
         commission_rate = EXCLUDED.commission_rate,
         commission_amount = EXCLUDED.commission_amount,
         driver_amount = EXCLUDED.driver_amount
       RETURNING id, trip_id, driver_id, fare, commission_rate,
                 commission_amount, driver_amount, status, created_at`,
      [trip_id, validDriverId, fareNumber, rateNumber, commissionAmount, driverAmount]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('COMMISSION ERROR:', error.message, error.code, error.constraint);
    res.status(500).json({ error: error.message, code: error.code });
  }
});

app.patch('/api/commissions/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid commission status' });
    }

    const result = await pool.query(
      `UPDATE commissions
       SET status=$1
       WHERE id=$2
       RETURNING id, trip_id, driver_id, fare, commission_rate,
                 commission_amount, driver_amount, status, created_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update commission status' });
  }
});

app.delete('/api/commissions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM commissions WHERE id=$1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete commission' });
  }
});


app.post("/api/subscribe", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const planId = Number(req.body.plan_id);
    if (!Number.isInteger(planId) || planId <= 0) { return res.status(400).json({ error: "Invalid plan_id" }); }
    const planResult = await pool.query("SELECT id, name, user_type, price_usd, duration_days, is_active FROM subscription_plans WHERE id = $1", [planId]);
    if (planResult.rows.length === 0) { return res.status(404).json({ error: "Subscription plan not found" }); }
    const plan = planResult.rows[0];
    if (!plan.is_active) { return res.status(400).json({ error: "This subscription plan is inactive" }); }
    const userResult = await pool.query("SELECT id, user_type FROM users WHERE id = $1", [userId]);
    if (userResult.rows.length === 0) { return res.status(404).json({ error: "User not found" }); }
    const user = userResult.rows[0];
    if (plan.user_type !== user.user_type) { return res.status(400).json({ error: "This plan is not available for your account type" }); }
    if (Number(plan.price_usd) > 0) {
      return res.status(402).json({ error: "Payment required before activating this paid plan" });
    }
    await pool.query("UPDATE user_subscriptions SET status = 'expired' WHERE user_id = $1 AND status = 'active'", [userId]);
    const result = await pool.query("INSERT INTO user_subscriptions (user_id, plan_id, status, started_at, expires_at, auto_renew) VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + ($3 * INTERVAL '1 day'), false) RETURNING id, user_id, plan_id, status, started_at, expires_at, auto_renew", [userId, plan.id, plan.duration_days]);
    res.status(201).json({ message: "Subscription activated successfully", subscription: result.rows[0], plan: plan });
  } catch (error) {
    console.error("SUBSCRIBE ERROR:", error);
    res.status(500).json({ error: "Failed to activate subscription" });
  }
});
app.get('/api/subscription-plans', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, user_type, price_usd, duration_days
       FROM subscription_plans
       ORDER BY price_usd ASC, id ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load subscription plans' });
  }
});

app.get('/api/my-subscription', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         us.id,
         us.plan_id,
         us.status,
         us.started_at,
         us.expires_at,
         us.auto_renew,
         sp.name AS plan_name
       FROM user_subscriptions us
       JOIN subscription_plans sp
         ON sp.id = us.plan_id
       WHERE us.user_id = $1
       ORDER BY us.id DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load subscription' });
  }
});


app.get('/api/trips', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.customer_id,
        t.driver_id,
        t.pickup,
        t.destination,
        t.fare,
        t.status,
        t.created_at,
        c.name AS customer_name,
        u.name AS driver_name
      FROM trips t
      LEFT JOIN customers c ON c.id = t.customer_id
      LEFT JOIN users u ON u.id = t.driver_id
      ORDER BY t.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('TRIPS ERROR:', error);
    res.status(500).json({ error: 'Failed to load trips' });
  }
});


app.post('/api/trips', authenticateToken, async (req, res) => {
  try {
    const {
      customer_id,
      driver_id,
      pickup,
      destination,
      fare,
      status = 'pending'
    } = req.body;

    if (!pickup || !destination || fare === undefined || fare === null) {
      return res.status(400).json({
        error: 'Pickup, destination and fare are required'
      });
    }

    const fareNumber = Number(fare);

    if (!Number.isFinite(fareNumber) || fareNumber < 0) {
      return res.status(400).json({
        error: 'Invalid fare'
      });
    }

    let validDriverId = null;
    if (driver_id !== undefined && driver_id !== null && driver_id !== '') {
      const driverCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND user_type = 'driver'",
        [driver_id]
      );
      if (driverCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Driver not found' });
      }
      validDriverId = driverCheck.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO trips
        (customer_id, driver_id, pickup, destination, fare, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, customer_id, driver_id, pickup,
                 destination, fare, status, created_at`,
      [
        customer_id || null,
        validDriverId,
        pickup,
        destination,
        fareNumber,
        status
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('ADD TRIP ERROR:', error);
    res.status(500).json({
      error: 'Failed to add trip'
    });
  }
});


app.patch('/api/trips/:id/status', authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const allowedStatuses = ['pending', 'on_route', 'completed', 'cancelled'];
    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid trip status' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE trips SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = result.rows[0];

    if (status === 'completed') {
      const fare = Number(trip.fare);

      if (!Number.isFinite(fare) || fare < 0) {
        throw new Error('Invalid trip fare for commission');
      }

      const rate = 10;
      const commission = Math.round(fare * rate) / 100;
      const driverAmount = fare - commission;

      await client.query(
        `INSERT INTO commissions
          (trip_id, driver_id, fare, commission_rate, commission_amount, driver_amount)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (trip_id) DO NOTHING`,
        [
          trip.id,
          trip.driver_id ?? null,
          fare,
          rate,
          commission,
          driverAmount
        ]
      );
    }

    await client.query('COMMIT');
    res.json(trip);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    console.error('Update trip status / commission error:', error);
    res.status(500).json({ error: 'Failed to update trip status or commission' });
  } finally {
    client.release();
  }
});

app.delete('/api/trips/:id', authenticateToken, async (req, res) => {
  try {
    const tripId = Number(req.params.id);

    if (!Number.isInteger(tripId) || tripId <= 0) {
      return res.status(400).json({ error: 'Invalid trip ID' });
    }

    const result = await pool.query(
      'DELETE FROM trips WHERE id = $1 RETURNING id',
      [tripId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted successfully', id: tripId });
  } catch (error) {
    console.error('DELETE TRIP ERROR:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});


// ==================== TEST PAYMENT API ====================

app.post('/api/payments/test', authenticateToken, (req, res) => {
  return res.status(403).json({ error: 'Test payments are disabled' });
});

app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM payments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('GET PAYMENTS ERROR:', error);
    res.status(500).json({
      error: 'Failed to fetch payments'
    });
  }
});

// ==================== END TEST PAYMENT API ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

