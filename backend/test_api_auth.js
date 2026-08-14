const jwt = require('jsonwebtoken');
const http = require('http');

// Generate an admin token
const token = jwt.sign({ id: 1, rol: 'administrador' }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

function fetchAPI(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  require('dotenv').config();
  try {
    const tec = await fetchAPI('/api/inventario/tecnologico');
    console.log('Tec ok:', tec.ok);
    if (tec.data) console.log('Tec items count:', tec.data.items ? tec.data.items.length : 'no items');
    
    const exis = await fetchAPI('/api/inventario/existencias');
    console.log('Exis ok:', exis.ok);
    if (exis.data) console.log('Exis items count:', exis.data.items ? exis.data.items.length : 'no items');
  } catch (err) {
    console.error(err);
  }
}
main();
