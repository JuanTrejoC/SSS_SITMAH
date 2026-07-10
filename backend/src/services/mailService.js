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
      <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #7F1D1D; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 1.5rem; letter-spacing: 0.5px;">Confirmación de Registro</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 0.9rem;">SITMAH - Sistema de Gestión</p>
        </div>
        <div style="padding: 25px; background-color: white;">
          <p style="margin-top: 0; font-size: 1rem; color: #1e293b;">Hola,</p>
          <p>Te confirmamos que tu reporte de <strong>${tipoTexto}</strong> ha sido recibido con éxito en nuestra plataforma.</p>
          
          <div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px;">
            <span style="font-size: 0.85rem; color: #64748b; display: block; text-transform: uppercase; font-weight: bold;">Folio de Seguimiento</span>
            <strong style="font-size: 1.6rem; color: #b98a46; display: block; margin-top: 5px; letter-spacing: 1px;">${folio}</strong>
          </div>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #b98a46; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #1e293b; font-size: 0.9rem;">¿Qué sigue?</p>
            <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #475569;">El equipo de tecnología de SITMAH lo atenderá dentro de las siguientes 72 horas hábiles</p>
          </div>

          <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 30px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
            <b>Por favor, no respondas a este correo. Es un mensaje automatizado de notificación.</b>
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0;">
          SITMAH - Sistema de reportes
        </div>
      </div>
    `,
  });
}

async function enviarNotificacionAdmins({ folio, fecha, tipo, prioridad, falla, descripcion, solicitante, correos }) {
  if (!correos.length) return;

  const tipoTexto = tipo === 'oficina' ? 'oficina' : 'semáforo';

  await enviarCorreo({
    to: correos.join(', '),
    subject: `Nuevo reporte ${folio} (${tipoTexto}) - SITMAH`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <div style="background-color: #7F1D1D; color: white; padding: 20px; text-align: center;">
          <h2 style="margin: 0; font-size: 1.5rem; letter-spacing: 0.5px;">Nuevo Reporte Técnico</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 0.9rem;">SITMAH - Sistema de Gestión</p>
        </div>
        <div style="padding: 25px; background-color: white;">
          <p style="margin-top: 0;">Se ha registrado un nuevo reporte con la siguiente información detallada:</p>
          
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 0.9rem;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 5px; font-weight: bold; color: #64748b; width: 35%;">Folio:</td>
              <td style="padding: 10px 5px; font-weight: bold; color: #1e293b;">${folio}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 5px; font-weight: bold; color: #64748b;">Fecha registro:</td>
              <td style="padding: 10px 5px; color: #334155;">${fecha}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 5px; font-weight: bold; color: #64748b;">Tipo de reporte:</td>
              <td style="padding: 10px 5px; color: #334155; text-transform: capitalize;">${tipoTexto}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 5px; font-weight: bold; color: #64748b;">Prioridad:</td>
              <td style="padding: 10px 5px; color: #dc2626; font-weight: bold; text-transform: uppercase;">${prioridad}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 5px; font-weight: bold; color: #64748b;">Falla/detalle:</td>
              <td style="padding: 10px 5px; color: #334155;">${falla}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 5px; font-weight: bold; color: #64748b;">Persona solicitante:</td>
              <td style="padding: 10px 5px; color: #1e293b; font-weight: 500;">${solicitante}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 5px; font-weight: bold; color: #64748b;">Descripcion:</td>
              <td style="padding: 10px 5px; color: #334155; font-style: italic;">${descripcion || 'Sin descripción adicional'}</td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 30px; margin-bottom: 10px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="background-color: #b98a46; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 0.9rem; transition: background 0.2s;">
              Ingresar al Panel Administrador
            </a>
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 0.75rem; color: #64748b; border-top: 1px solid #e2e8f0;">
          SITMAH &copy; 2026 - Área de Tecnología
        </div>
      </div>
    `,
  });
}

module.exports = {
  enviarCorreo,
  enviarConfirmacionReporte,
  enviarNotificacionAdmins,
};
