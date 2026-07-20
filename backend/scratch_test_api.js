// No require needed

async function test() {
  // Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data.token;

  // Get reportes
  const res = await fetch('http://localhost:3000/api/admin/reportes/oficina?limit=100', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

test().catch(console.error);
