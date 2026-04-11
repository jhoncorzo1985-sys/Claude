/**
 * Analizador de Ultrasonido IA — Frontend
 * Conecta la UI con el backend FastAPI / Claude Vision API
 */

const API_BASE = window.location.origin;

// ── DOM refs ──────────────────────────────────────────────
const dropZone    = document.getElementById('drop-zone');
const fileInput   = document.getElementById('file-input');
const previewImg  = document.getElementById('preview-img');
const dropContent = document.getElementById('drop-content');
const btnAnalizar = document.getElementById('btn-analizar');
const btnLimpiar  = document.getElementById('btn-limpiar');
const spinner     = document.getElementById('spinner-btn');
const contexto    = document.getElementById('contexto');
const reportePanel = document.getElementById('reporte-contenido');
const loadingOverlay = document.getElementById('loading-overlay');

let imagenBase64 = null;
let mediaType    = 'image/jpeg';

// ── Drag & Drop ───────────────────────────────────────────
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) cargarImagen(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) cargarImagen(fileInput.files[0]);
});

// ── Cargar imagen ─────────────────────────────────────────
function cargarImagen(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    mostrarError('Tipo de archivo no soportado. Usa JPEG, PNG o WebP.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const result = e.target.result;
    // Extraer base64 puro (sin el prefijo data:...)
    const partes = result.split(',');
    imagenBase64 = partes[1];
    mediaType = file.type;

    // Mostrar preview
    previewImg.src = result;
    previewImg.style.display = 'block';
    dropContent.style.display = 'none';
    dropZone.classList.add('has-image');

    btnAnalizar.disabled = false;
    btnLimpiar.style.display = 'flex';

    // Limpiar reporte anterior
    resetearReporte();
  };
  reader.readAsDataURL(file);
}

// ── Analizar ──────────────────────────────────────────────
btnAnalizar.addEventListener('click', async () => {
  if (!imagenBase64) return;

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/analizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagen_base64: imagenBase64,
        media_type: mediaType,
        contexto: contexto.value.trim() || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || `Error ${response.status}`);
    }

    if (data.error) {
      mostrarError(data.error);
    } else {
      renderizarReporte(data);
    }
  } catch (err) {
    mostrarError(err.message || 'Error de conexión con el servidor.');
  } finally {
    setLoading(false);
  }
});

// ── Limpiar ───────────────────────────────────────────────
btnLimpiar.addEventListener('click', () => {
  imagenBase64 = null;
  mediaType = 'image/jpeg';
  previewImg.src = '';
  previewImg.style.display = 'none';
  dropContent.style.display = 'flex';
  dropZone.classList.remove('has-image');
  btnAnalizar.disabled = true;
  btnLimpiar.style.display = 'none';
  fileInput.value = '';
  contexto.value = '';
  resetearReporte();
});

// ── Renderizar reporte ─────────────────────────────────────
function renderizarReporte(data) {
  const calidadClass = {
    buena: 'calidad-buena',
    regular: 'calidad-regular',
    mala: 'calidad-mala',
  }[data.calidad_imagen?.toLowerCase()] || '';

  const confianzaClass = {
    alto: 'confianza-alto',
    medio: 'confianza-medio',
    bajo: 'confianza-bajo',
  }[data.nivel_confianza?.toLowerCase()] || '';

  const hallazgosHTML = (data.hallazgos || [])
    .map(h => `<li>${escapeHTML(h)}</li>`)
    .join('');

  const estructurasHTML = (data.estructuras_identificadas || [])
    .map(e => `<li>${escapeHTML(e)}</li>`)
    .join('');

  const recomendacionesHTML = (data.recomendaciones || [])
    .map(r => `<li>${escapeHTML(r)}</li>`)
    .join('');

  reportePanel.innerHTML = `
    <div class="metricas-grid">
      <div class="metrica">
        <div class="metrica-label">Calidad</div>
        <div class="metrica-valor ${calidadClass}">${capitalize(data.calidad_imagen || '—')}</div>
      </div>
      <div class="metrica">
        <div class="metrica-label">Confianza</div>
        <div class="metrica-valor ${confianzaClass}">${capitalize(data.nivel_confianza || '—')}</div>
      </div>
      <div class="metrica">
        <div class="metrica-label">Región</div>
        <div class="metrica-valor" style="font-size:0.75rem;color:var(--text-secondary)">${escapeHTML(data.region_anatomica || '—')}</div>
      </div>
    </div>

    ${data.impresion ? `
    <div class="seccion">
      <div class="seccion-titulo">Impresión Educativa</div>
      <p>${escapeHTML(data.impresion)}</p>
    </div>` : ''}

    ${hallazgosHTML ? `
    <div class="seccion">
      <div class="seccion-titulo">Hallazgos</div>
      <ul class="lista-hallazgos">${hallazgosHTML}</ul>
    </div>` : ''}

    ${estructurasHTML ? `
    <div class="seccion">
      <div class="seccion-titulo">Estructuras Identificadas</div>
      <ul class="lista-hallazgos">${estructurasHTML}</ul>
    </div>` : ''}

    ${recomendacionesHTML ? `
    <div class="seccion">
      <div class="seccion-titulo">Recomendaciones</div>
      <ul class="lista-hallazgos">${recomendacionesHTML}</ul>
    </div>` : ''}

    <div class="aviso-medico">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>${escapeHTML(data.advertencia || 'Solo con fines educativos. No reemplaza el diagnóstico médico.')}</span>
    </div>

    <div style="margin-top:1rem; display:flex; gap:0.5rem">
      <button class="btn btn-ghost" onclick="exportarReporte()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Exportar
      </button>
    </div>
  `;

  // Guardar para exportar
  window._ultimoReporte = data;
}

// ── Exportar reporte ──────────────────────────────────────
function exportarReporte() {
  const data = window._ultimoReporte;
  if (!data) return;

  const lineas = [
    '=== REPORTE EDUCATIVO DE ULTRASONIDO ===',
    `Fecha: ${new Date().toLocaleString('es-CO')}`,
    '',
    `Región Anatómica: ${data.region_anatomica || '—'}`,
    `Calidad de Imagen: ${data.calidad_imagen || '—'}`,
    `Nivel de Confianza: ${data.nivel_confianza || '—'}`,
    '',
    '--- IMPRESIÓN ---',
    data.impresion || '—',
    '',
    '--- HALLAZGOS ---',
    ...(data.hallazgos || []).map(h => `• ${h}`),
    '',
    '--- ESTRUCTURAS IDENTIFICADAS ---',
    ...(data.estructuras_identificadas || []).map(e => `• ${e}`),
    '',
    '--- RECOMENDACIONES ---',
    ...(data.recomendaciones || []).map(r => `• ${r}`),
    '',
    '--- ADVERTENCIA ---',
    data.advertencia || '',
  ];

  const blob = new Blob([lineas.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ultrasonido-reporte-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── UI helpers ─────────────────────────────────────────────
function setLoading(active) {
  btnAnalizar.disabled = active;
  spinner.style.display = active ? 'block' : 'none';
  loadingOverlay.classList.toggle('active', active);
  if (active) {
    reportePanel.innerHTML = `
      <div class="reporte-estado">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>Analizando imagen con Claude Vision...</span>
      </div>`;
  }
}

function mostrarError(msg) {
  reportePanel.innerHTML = `
    <div class="error-box">
      <strong>Error:</strong> ${escapeHTML(msg)}
    </div>`;
}

function resetearReporte() {
  reportePanel.innerHTML = `
    <div class="reporte-estado">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <span>Sube una imagen para comenzar el análisis</span>
    </div>`;
  window._ultimoReporte = null;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
