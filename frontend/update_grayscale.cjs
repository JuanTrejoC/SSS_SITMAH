const fs = require('fs');
const file = 'c:/Users/Juan Trejo/Documents/SistemaDeSolicitudDeServicioSITMAH/frontend/src/index.css';
let code = fs.readFileSync(file, 'utf8');

const oldCss = `#root.grayscale-theme {
  filter: grayscale(100%);
}`;

const newCss = `/* Truco con backdrop-filter para no romper el position: fixed del header */
body.grayscale-theme::after,
#root.grayscale-theme::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  backdrop-filter: grayscale(100%);
  -webkit-backdrop-filter: grayscale(100%);
  pointer-events: none;
  z-index: 999999;
}

#root.grayscale-theme {
  /* Quitamos el filter normal para no romper fixed */
  filter: none;
}`;

if (code.includes('filter: grayscale(100%);')) {
    code = code.replace(oldCss, newCss);
    fs.writeFileSync(file, code, 'utf8');
    console.log("Updated index.css");
} else {
    console.log("Could not find exact block");
}
