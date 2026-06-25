const nodemailer = require('nodemailer');

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    );
    return transporterPromise;
  }

  transporterPromise = nodemailer.createTestAccount().then((account) => {
    console.log('--- Ethereal Email (solo desarrollo) ---');
    console.log(`Usuario: ${account.user}`);
    console.log(`Password: ${account.pass}`);

    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
  });

  return transporterPromise;
}

async function enviarCorreo({ to, subject, html }) {
  const transporter = await getTransporter();
  const from = process.env.MAIL_FROM || 'SITMAH <noreply@sitmah.local>';

  const info = await transporter.sendMail({ from, to, subject, html });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log(`Vista previa del correo: ${preview}`);
  }

  return info;
}

async function enviarConfirmacionReporte({ email, folio, tipo }) {
  const tipoTexto = tipo === 'oficina' ? 'oficina' : 'semáforo';

  await enviarCorreo({
    to: email,
    subject: `Reporte ${folio} registrado - SITMAH`,
    html: `
      <h2>Reporte registrado</h2>
      <p>Su reporte de ${tipoTexto} con folio <strong>${folio}</strong> fue registrado correctamente.</p>
      <p>El equipo de tecnología de SITMAH lo atenderá dentro de las siguientes 72 horas hábiles.</p>
      <p><b>Por favor, no responda a este correo.</b></p>
      <p><small>SITMAH - Sistema de reportes</small></p>
    `,
  });
}

async function enviarNotificacionAdmins({ folio, tipo, resumen, correos }) {
  if (!correos.length) return;

  const tipoTexto = tipo === 'oficina' ? 'oficina' : 'semáforo';

  await enviarCorreo({
    to: correos.join(', '),
    subject: `Nuevo reporte ${folio} (${tipoTexto}) - SITMAH`,
    html: `
      <h2>Nuevo reporte de ${tipoTexto}</h2>
      <p><strong>Folio:</strong> ${folio}</p>
      <p>${resumen}</p>
      <p>Ingrese al panel administrador para atenderlo.</p>
    `,
  });
}

module.exports = {
  enviarCorreo,
  enviarConfirmacionReporte,
  enviarNotificacionAdmins,
};
