/**
 * RSMV — App Shell
 * Funciones globales: toasts, modals, EXP floats, auth guard, etc.
 */

// ============================================================
// TOASTS
// ============================================================

function showToast(message, type = 'info', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'mc' ? '◈' : 'ℹ'}</span>
      <span>${message}</span>
    </div>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return toast;
}

// ============================================================
// EXP FLOTANTE
// ============================================================

function showExpFloat(amount, x, y) {
  const el = document.createElement('div');
  el.className = 'exp-float';
  el.textContent = `+${amount} EXP`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

// ============================================================
// MODAL GENÉRICO
// ============================================================

function showModal({ title, body, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, danger = false }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3 class="modal-title">${title}</h3>
      <div class="modal-body mt-16">${body}</div>
      <div class="modal-footer">
        <button class="btn btn-outline btn-cancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-confirm">${confirmText}</button>
      </div>
    </div>`;

  overlay.querySelector('.btn-cancel').onclick = () => overlay.remove();
  overlay.querySelector('.btn-confirm').onclick = () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  document.body.appendChild(overlay);
}

// ============================================================
// MODAL MARECOIN INSUFICIENTE
// ============================================================

function showMCModal(costo, saldo, onComprar) {
  showModal({
    title: '◈ Marecoin Insuficiente',
    body: `
      <p class="text-muted">Esta acción cuesta <strong class="text-gold">${costo} MC</strong>.</p>
      <p class="text-muted mt-8">Tu saldo actual: <strong class="text-red">${saldo} MC</strong></p>
      <p class="mt-16">¿Quieres comprar más Marecoin?</p>`,
    confirmText: '◈ Comprar Marecoin',
    cancelText: 'Cancelar',
    onConfirm: onComprar || (() => window.location.href = '/pages/tienda.html')
  });
}

// ============================================================
// AUTH GUARD
// ============================================================

function requireLogin() {
  if (!api.isLoggedIn()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

// ============================================================
// BARRA DE PROGRESO EXP
// ============================================================

const EXP_THRESHOLDS = [
  { nivel: 'local',        min: 0,   max: 49,  label: 'Local' },
  { nivel: 'municipal',    min: 50,  max: 149, label: 'Municipal' },
  { nivel: 'regional',     min: 150, max: 299, label: 'Regional' },
  { nivel: 'nacional',     min: 300, max: 499, label: 'Nacional' },
  { nivel: 'estrella_rsmv',min: 500, max: 999, label: 'Estrella RSMV' }
];

function getExpProgress(expTotal) {
  const nivel = EXP_THRESHOLDS.find(n => expTotal >= n.min && expTotal <= n.max)
    || EXP_THRESHOLDS[EXP_THRESHOLDS.length - 1];
  const rango = nivel.max - nivel.min;
  const progreso = expTotal - nivel.min;
  const porcentaje = Math.min(100, Math.round((progreso / rango) * 100));
  const idx = EXP_THRESHOLDS.indexOf(nivel);
  const siguiente = EXP_THRESHOLDS[idx + 1];
  return { nivel, porcentaje, siguiente, faltante: siguiente ? siguiente.min - expTotal : 0 };
}

function renderExpBar(container, expTotal) {
  const p = getExpProgress(expTotal);
  container.innerHTML = `
    <div class="exp-bar-container">
      <div class="exp-bar-label">
        <span>${expTotal} EXP</span>
        <span>${p.siguiente ? `Próximo: ${p.siguiente.label} (${p.faltante} faltantes)` : '¡Nivel máximo!'}</span>
      </div>
      <div class="exp-bar">
        <div class="exp-bar-fill" style="width:${p.porcentaje}%"></div>
      </div>
    </div>`;
}

// ============================================================
// BADGE DE NIVEL
// ============================================================

function nivelBadge(nivel) {
  const map = {
    local:        ['badge-local',     'Local'],
    municipal:    ['badge-municipal', 'Municipal'],
    regional:     ['badge-regional',  'Regional'],
    nacional:     ['badge-nacional',  'Nacional'],
    estrella_rsmv:['badge-estrella',  '⭐ Estrella']
  };
  const [cls, label] = map[nivel] || map.local;
  return `<span class="badge ${cls}">${label}</span>`;
}

// ============================================================
// SALDO MC EN NAVBAR
// ============================================================

async function actualizarSaldoNavbar() {
  const el = document.querySelector('.mc-saldo-valor');
  if (!el || !api.isLoggedIn()) return;
  try {
    const { saldo } = await api.getSaldo();
    el.textContent = saldo;
    // Guardar en localStorage para uso offline
    localStorage.setItem('rsmv_mc', saldo);
  } catch {}
}

// ============================================================
// INICIALIZACIÓN GLOBAL
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Actualizar saldo MC en navbar
  actualizarSaldoNavbar();

  // Marcar link activo en navbar
  const currentPath = window.location.pathname;
  document.querySelectorAll('.navbar-nav a, .sidebar-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // Cerrar modales con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.querySelector('.modal-overlay');
      if (overlay) overlay.remove();
    }
  });
});
