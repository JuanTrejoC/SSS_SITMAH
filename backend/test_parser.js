const detalles = {
  "ram": "16GB",
  "red": "ambos",
  "marcaMouse": "Logitec",
  "procesador": "Intel Core i5-4530",
  "serieMouse": "JS82HD93JDF",
  "tieneMouse": true,
  "modeloMouse": "M80",
  "almacenamiento": "512GB",
  "tarjetaGrafica": "Integrada",
  "sistemaOperativo": "Windows 10 Pro",
  "tipoAlmacenamiento": "SSD",
  "numeroInventarioMouse": "EC-9081-M-58",
  "monitores": [
    {
      "marca": "Samsung",
      "serie": "DJ29FJ20DK",
      "modelo": "DSL32",
      "numeroInventario": "EC-9081-896"
    }
  ]
};

const nuevosDetalles = { ...detalles };
const perifericosAcrear = [];
const mapeoPlanos = [{ tipo: 'Mouse', sufijo: 'Mouse' }];

for (const p of mapeoPlanos) {
  const { tipo, sufijo } = p;
  const marca = detalles[`marca${sufijo}`];
  const modelo = detalles[`modelo${sufijo}`];
  const serie = detalles[`serie${sufijo}`];
  let inventario = detalles[`numeroInventario${sufijo}`] ? String(detalles[`numeroInventario${sufijo}`]) : null;

  if (marca || modelo || serie || inventario) {
    perifericosAcrear.push({ tipo, marca, modelo, serie, inventario });
  }

  delete nuevosDetalles[`marca${sufijo}`];
  delete nuevosDetalles[`modelo${sufijo}`];
  delete nuevosDetalles[`serie${sufijo}`];
  delete nuevosDetalles[`numeroInventario${sufijo}`];
  delete nuevosDetalles[`tiene${sufijo}`];
  delete nuevosDetalles[`cantidad${sufijo}`];
}

console.log("A crear:", perifericosAcrear);
console.log("Restante:", nuevosDetalles);
