const express = require('express');

const app = express();
const PORT = 3000;
const API_URL = 'http://127.0.0.1:5000';

app.get('/', async (req, res) => {
  try {
    const response = await fetch(API_URL + '/api/drivers');
    const drivers = await response.json();

    const list = drivers.map(driver => `
      <div class="driver">
        <div class="avatar">🚗</div>
        <div class="info">
          <h3>${driver.name}</h3>
          <p>${driver.email}</p>
        </div>
        <span class="status">Offline</span>
        <button onclick="deleteDriver(${driver.id})">سڕینەوە</button>
      </div>
    `).join('');

    res.send(`
<!DOCTYPE html>
<html lang="ku">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DriverLink</title>
<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f4f6f8;
  color: #1f2937;
}

.header {
  background: #111827;
  color: white;
  padding: 24px 20px;
  border-radius: 0 0 24px 24px;
}

.header h1 {
  margin: 0;
  font-size: 30px;
}

.header p {
  margin: 8px 0 0;
  opacity: 0.8;
}

.container {
  padding: 20px;
  max-width: 600px;
  margin: auto;
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.title h2 {
  margin: 0;
}

.add {
  border: 0;
  background: #2563eb;
  color: white;
  padding: 10px 15px;
  border-radius: 12px;
  font-size: 14px;
}

.driver {
  background: white;
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.06);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 23px;
}

.info {
  flex: 1;
}

.info h3 {
  margin: 0 0 5px;
}

.info p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.status {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 6px 9px;
  border-radius: 10px;
}
</style>
</head>

<body>
<script>
  const user = localStorage.getItem('driverlink_user');

  if (!user) {
    window.location.href = '/login';
  }
</script>

<header class="header">
  <h1>DriverLink</h1>
  <p>بەخێربێیت بۆ DriverLink</p>
</header>

<main class="container">

  <div class="title">
    <h2>شۆفێرەکان</h2>
    <a href="/add-driver" class="add">+ زیادکردن</a>
  </div>

  ${list}

</main>

<script>
async function deleteDriver(id) {
  if (!confirm("دڵنیایت لە سڕینەوەی ئەم شۆفێرە؟")) return;

  const response = await fetch("http://127.0.0.1:5000/api/drivers/" + id, {
    method: "DELETE"
  });

  if (response.ok) {
    location.reload();
  } else {
    alert("هەڵەیەک ڕوویدا");
  }
}
</script>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).send('هەڵە لە پەیوەندی بە Backend');
  }
});


app.get('/add-driver', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ku">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>زیادکردنی شۆفێر</title>
</head>
<body>

<h2>زیادکردنی شۆفێری نوێ</h2>

<form method="POST" action="/add-driver">
  <input name="name" placeholder="ناوی شۆفێر" required><br><br>
  <input name="email" type="email" placeholder="ئیمەیڵ" required><br><br>
  <input name="phone" placeholder="ژمارەی مۆبایل"><br><br>
  <input name="location" placeholder="شوێن"><br><br>
  <input name="vehicle_type" placeholder="جۆری ئۆتۆمبێل"><br><br>
  <input name="vehicle_number" placeholder="ژمارەی ئۆتۆمبێل"><br><br>
  <button type="submit">زیادکردن</button>
</form>

<script>
async function deleteDriver(id) {
  if (!confirm("دڵنیایت لە سڕینەوەی ئەم شۆفێرە؟")) return;

  const response = await fetch("http://127.0.0.1:5000/api/drivers/" + id, {
    method: "DELETE"
  });

  if (response.ok) {
    location.reload();
  } else {
    alert("هەڵەیەک ڕوویدا");
  }
}
</script>
</body>
</html>
  `);
});

app.use(express.urlencoded({ extended: true }));

app.post('/add-driver', async (req, res) => {
  try {
    const response = await fetch(API_URL + '/api/drivers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      return res.status(500).send('هەڵە لە زیادکردنی شۆفێر');
    }

    res.redirect('/');
  } catch (error) {
    res.status(500).send('پەیوەندی بە Backend سەرکەوتوو نەبوو');
  }
});

app.listen(PORT, () => {
  console.log('Frontend running on port ' + PORT);
});

app.get('/login', (req, res) => {
  res.send(`
    <html>
    <head><title>DriverLink Login</title></head>
    <body>
      <h2>🚗 DriverLink</h2>
      <form id="loginForm">
        <input id="email" type="email" placeholder="ئیمەیڵ" required>
        <br><br>
        <input id="password" type="password" placeholder="وشەی نهێنی" required>
        <br><br>
        <button type="submit">چوونەژوورەوە</button>
      </form>

      <p id="message"></p>

      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();

          const response = await fetch('http://127.0.0.1:5000/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              email: document.getElementById('email').value,
              password: document.getElementById('password').value
            })
          });

          const data = await response.json();

          if (response.ok) {
            localStorage.setItem('driverlink_user', JSON.stringify(data.user));
            window.location.href = '/';
          } else {
            document.getElementById('message').textContent =
              data.error || 'هەڵەیەک ڕوویدا';
          }
        });
      </script>
    </body>
    </html>
  `);
});
