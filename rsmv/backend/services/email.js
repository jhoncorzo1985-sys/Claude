/**
 * RSMV — Servicio de Email (Resend)
 * Correos automáticos: resultados, subida de nivel, inicio de torneo
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'RSMV <noreplay@marelab.co>';
const APP_URL = process.env.APP_URL || 'https://rsmv.marelab.co';

// Template base
function htmlBase(titulo, contenido) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',sans-serif;color:#fff;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <!-- Header -->
    <div style="text-align:center;padding:30px 0;border-bottom:2px solid #00d4ff;">
      <h1 style="margin:0;font-size:28px;color:#00d4ff;letter-spacing:4px;">RSMV</h1>
      <p style="margin:4px 0 0;color:#888;font-size:12px;letter-spacing:2px;">ROBOT SOCCER MARE VIRTUAL</p>
    </div>
    <!-- Contenido -->
    <div style="padding:30px 0;">
      ${contenido}
    </div>
    <!-- Footer -->
    <div style="text-align:center;padding:20px 0;border-top:1px solid #222;color:#555;font-size:12px;">
      <p>Marelab © 2025 | <a href="${APP_URL}" style="color:#00d4ff;">rsmv.marelab.co</a></p>
      <p>¿Preguntas? WhatsApp: 315 2445278</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Email de bienvenida al registrarse
 */
async function emailBienvenida(to, nombre) {
  const contenido = `
    <h2 style="color:#00d4ff;">¡Bienvenido a RSMV, ${nombre}!</h2>
    <p>Acabas de unirte a <strong>Robot Soccer Mare Virtual</strong>, el manager game de robots de fútbol más innovador de Colombia.</p>
    <div style="background:#111;border:1px solid #333;border-radius:8px;padding:20px;margin:20px 0;">
      <h3 style="color:#ffd700;margin-top:0;">Tu punto de partida:</h3>
      <ul style="color:#ccc;line-height:1.8;">
        <li>🤖 Únete o crea tu equipo</li>
        <li>⚽ Participa en torneos municipales</li>
        <li>📈 Acumula EXP y sube de nivel</li>
        <li>🏆 Clasifica al Regional y Nacional</li>
      </ul>
    </div>
    <div style="text-align:center;margin:30px 0;">
      <a href="${APP_URL}/dashboard" style="background:#00d4ff;color:#000;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
        IR A MI DASHBOARD
      </a>
    </div>
    <p style="color:#888;font-size:13px;">
      <strong>Recibes 50 Marecoin de bienvenida</strong> para comenzar a explorar el juego.
    </p>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: '¡Bienvenido a RSMV — Robot Soccer Mare Virtual!',
    html: htmlBase('Bienvenido a RSMV', contenido)
  });
}

/**
 * Email de resultado de partido
 */
async function emailResultadoPartido(to, nombre, resultado) {
  const { equipoA, equipoB, golesA, golesB, ganador, expGanado, torneo, fase } = resultado;
  const gano = ganador === resultado.miEquipo;

  const contenido = `
    <h2 style="color:#00d4ff;">Resultado del Partido — ${torneo}</h2>
    <p style="color:#888;">${fase}</p>
    <div style="background:#111;border:1px solid ${gano ? '#00ff88' : '#ff4444'};border-radius:8px;padding:24px;margin:20px 0;text-align:center;">
      <div style="font-size:14px;color:#888;margin-bottom:8px;">${equipoA} vs ${equipoB}</div>
      <div style="font-size:48px;font-weight:bold;color:#fff;letter-spacing:8px;">${golesA} – ${golesB}</div>
      <div style="margin-top:16px;font-size:20px;color:${gano ? '#00ff88' : '#ff4444'};">
        ${gano ? '🏆 VICTORIA' : '😔 DERROTA'}
      </div>
    </div>
    <div style="background:#0a1a0a;border:1px solid #00ff88;border-radius:8px;padding:16px;text-align:center;">
      <div style="color:#888;font-size:13px;">EXP ganado en este partido</div>
      <div style="font-size:32px;font-weight:bold;color:#00ff88;">+${expGanado} EXP</div>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/dashboard" style="background:#00d4ff;color:#000;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
        VER MI DASHBOARD
      </a>
    </div>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Resultado: ${equipoA} ${golesA}–${golesB} ${equipoB} | ${torneo}`,
    html: htmlBase('Resultado del Partido', contenido)
  });
}

/**
 * Email de subida de nivel
 */
async function emailSubidaNivel(to, nombre, nivelAnterior, nivelNuevo, expTotal) {
  const emojis = {
    local: '🟤', municipal: '🟡', regional: '🔵',
    nacional: '🔴', estrella_rsmv: '⭐'
  };

  const contenido = `
    <h2 style="color:#ffd700;">¡Subiste de Nivel, ${nombre}!</h2>
    <div style="text-align:center;padding:30px 0;">
      <div style="font-size:60px;">${emojis[nivelNuevo] || '⭐'}</div>
      <div style="font-size:32px;font-weight:bold;color:#ffd700;text-transform:uppercase;letter-spacing:4px;margin:12px 0;">
        ${nivelNuevo.replace(/_/g, ' ')}
      </div>
      <div style="color:#888;font-size:14px;">${nivelAnterior.replace(/_/g, ' ')} → ${nivelNuevo.replace(/_/g, ' ')}</div>
    </div>
    <div style="background:#111;border:1px solid #ffd700;border-radius:8px;padding:16px;text-align:center;">
      <div style="color:#888;font-size:13px;">EXP Total</div>
      <div style="font-size:36px;font-weight:bold;color:#ffd700;">${expTotal} EXP</div>
    </div>
    <p style="color:#ccc;text-align:center;margin-top:20px;">
      Sigue acumulando EXP en torneos para alcanzar el nivel <strong style="color:#00d4ff;">Estrella RSMV</strong>.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/dashboard" style="background:#ffd700;color:#000;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;">
        VER MI PROGRESO
      </a>
    </div>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `¡Subiste a ${nivelNuevo.replace(/_/g, ' ')} en RSMV! 🚀`,
    html: htmlBase('¡Subida de Nivel!', contenido)
  });
}

/**
 * Email de inicio de torneo
 */
async function emailInicioTorneo(to, nombre, torneo) {
  const { nombre: nombreTorneo, tipo, fecha, equipoNombre } = torneo;

  const contenido = `
    <h2 style="color:#00d4ff;">¡Tu torneo está por comenzar!</h2>
    <div style="background:#111;border:1px solid #00d4ff;border-radius:8px;padding:24px;margin:20px 0;">
      <div style="font-size:22px;font-weight:bold;color:#fff;">${nombreTorneo}</div>
      <div style="color:#888;margin-top:8px;">Tipo: <span style="color:#00d4ff;">${tipo.toUpperCase()}</span></div>
      <div style="color:#888;margin-top:4px;">Tu equipo: <span style="color:#ffd700;">${equipoNombre}</span></div>
      ${fecha ? `<div style="color:#888;margin-top:4px;">Fecha: ${new Date(fecha).toLocaleString('es-CO')}</div>` : ''}
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${APP_URL}/torneo" style="background:#00d4ff;color:#000;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
        IR AL TORNEO
      </a>
    </div>`;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `¡Comienza ${nombreTorneo}! Tu equipo ya está inscrito 🤖`,
    html: htmlBase('Inicio de Torneo', contenido)
  });
}

module.exports = { emailBienvenida, emailResultadoPartido, emailSubidaNivel, emailInicioTorneo };
