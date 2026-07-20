async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const loginJson = await loginRes.json();
  const token = loginJson.data.token;

  const res = await fetch('http://localhost:3000/api/admin/reportes/oficina/resumen', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json = await res.json();
  console.log('Oficina Resumen:', JSON.stringify(json, null, 2));

  const res2 = await fetch('http://localhost:3000/api/admin/reportes/semaforo/resumen', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json2 = await res2.json();
  console.log('Semaforo Resumen:', JSON.stringify(json2, null, 2));
}

test().catch(console.error);
