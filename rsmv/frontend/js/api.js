/**
 * RSMV — API Client
 * Wrapper sobre fetch para comunicarse con el backend
 */

const API_URL = window.RSMV_API_URL || 'http://localhost:3001';

class RSMVApi {
  constructor() {
    this.baseUrl = API_URL;
  }

  // Obtener token guardado
  getToken() {
    return localStorage.getItem('rsmv_token');
  }

  // Headers base
  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const token = this.getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  // Método base
  async request(method, path, body = null) {
    const options = {
      method,
      headers: this.headers(),
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${this.baseUrl}${path}`, options);
    const data = await res.json();

    if (!res.ok) {
      // Error de Marecoin insuficiente — especial
      if (res.status === 402) {
        const err = new Error(data.message || data.error);
        err.type = 'MARECOIN_INSUFICIENTE';
        err.data = data;
        throw err;
      }
      throw new Error(data.error || `Error ${res.status}`);
    }

    return data;
  }

  get(path)          { return this.request('GET', path); }
  post(path, body)   { return this.request('POST', path, body); }
  patch(path, body)  { return this.request('PATCH', path, body); }
  delete(path)       { return this.request('DELETE', path); }

  // ============================================================
  // AUTH
  // ============================================================

  async login(email, password) {
    const data = await this.post('/api/auth/login', { email, password });
    localStorage.setItem('rsmv_token', data.token);
    localStorage.setItem('rsmv_refresh', data.refresh_token);
    localStorage.setItem('rsmv_user', JSON.stringify(data.user));
    return data;
  }

  async register(datos) {
    return this.post('/api/auth/register', datos);
  }

  async logout() {
    try { await this.post('/api/auth/logout'); } catch {}
    localStorage.removeItem('rsmv_token');
    localStorage.removeItem('rsmv_refresh');
    localStorage.removeItem('rsmv_user');
    window.location.href = '/';
  }

  async me() {
    return this.get('/api/auth/me');
  }

  isLoggedIn() {
    return !!this.getToken();
  }

  getCurrentUser() {
    const u = localStorage.getItem('rsmv_user');
    return u ? JSON.parse(u) : null;
  }

  // ============================================================
  // MARECOIN
  // ============================================================

  async getSaldo() {
    return this.get('/api/marecoin/saldo');
  }

  async getHistorialMC() {
    return this.get('/api/marecoin/historial');
  }

  async getTarifas() {
    return this.get('/api/marecoin/tarifas');
  }

  async comprarMC(paquete_id) {
    return this.post('/api/marecoin/comprar', { paquete_id });
  }

  // ============================================================
  // JUGADORES
  // ============================================================

  async getRanking(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/api/jugadores/ranking${q ? '?' + q : ''}`);
  }

  async getJugador(id) {
    return this.get(`/api/jugadores/${id}`);
  }

  async getHistorialExp(jugadorId) {
    return this.get(`/api/jugadores/${jugadorId}/historial`);
  }

  // ============================================================
  // EQUIPOS
  // ============================================================

  async getEquipos(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/api/equipos${q ? '?' + q : ''}`);
  }

  async getEquipo(id) {
    return this.get(`/api/equipos/${id}`);
  }

  async crearEquipo(datos) {
    return this.post('/api/equipos', datos);
  }

  async unirseEquipo(equipoId) {
    return this.post(`/api/equipos/${equipoId}/unirse`);
  }

  async asignarDT(equipoId, dt_user_id) {
    return this.post(`/api/equipos/${equipoId}/asignar-dt`, { dt_user_id });
  }

  async actualizarAlineacion(equipoId, titulares) {
    return this.patch(`/api/equipos/${equipoId}/alineacion`, { titulares });
  }

  // ============================================================
  // TORNEOS
  // ============================================================

  async getTorneos(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/api/torneos${q ? '?' + q : ''}`);
  }

  async getTorneo(id) {
    return this.get(`/api/torneos/${id}`);
  }

  async getBracket(torneoId) {
    return this.get(`/api/torneos/${torneoId}/bracket`);
  }

  async inscribirEquipo(torneoId, equipo_id) {
    return this.post(`/api/torneos/${torneoId}/inscribir`, { equipo_id });
  }
}

// Instancia global
const api = new RSMVApi();

// Configurar URL desde atributo data del script
const scriptTag = document.querySelector('script[data-api-url]');
if (scriptTag) api.baseUrl = scriptTag.dataset.apiUrl;
