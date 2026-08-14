const http = require('http');

function fetchAPI(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  try {
    const semaforos = await fetchAPI('/api/inventario/controladores');
    console.log('Semaforos response:', semaforos);
    
    const mobiliario = await fetchAPI('/api/inventario/mobiliario');
    console.log('Mobiliario response:', mobiliario);
  } catch (err) {
    console.error(err);
  }
}
main();
