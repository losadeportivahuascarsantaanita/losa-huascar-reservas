/**
 * ============================================================================
 * SERVICIO DE COMUNICACIÓN API CON GOOGLE APPS SCRIPT
 * Losa Deportiva Huáscar – Santa Anita (Etapa 4)
 * ============================================================================
 */

const ApiService = {
  // URL oficial desplegada de Google Apps Script Web App
  API_URL: 'https://script.google.com/macros/s/AKfycbxJY3tD5qvI9ZAtvhwAANB6NS3oXpfFkmkBus1QA7DopssNiUsL3eEx-hqECXRBq2BQDg/exec',

  // Si está activo, consume la hoja de Google Sheets en tiempo real
  isLive: true,

  /**
   * Ejecuta peticiones POST utilizando Simple Request (text/plain)
   * para prevenir bloqueos de CORS preflight (OPTIONS) y seguir redirecciones 302
   */
  async post(action, data = {}) {
    if (!this.API_URL || !this.isLive) {
      throw new Error('Modo local / URL no configurada');
    }

    const payload = {
      action: action,
      ...data
    };

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`Error en servidor (HTTP ${response.status})`);
      }

      const json = await response.json();
      return json;
    } catch (err) {
      console.error(`[ApiService] Error en acción '${action}':`, err);
      throw err;
    }
  },

  /**
   * Ejecuta peticiones GET públicas con redirección automática
   */
  async get(action, params = {}) {
    if (!this.API_URL || !this.isLive) {
      throw new Error('Modo local / URL no configurada');
    }

    const query = new URLSearchParams({ action, ...params }).toString();
    const targetUrl = `${this.API_URL}?${query}`;

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow'
      });

      if (!response.ok) {
        throw new Error(`Error en servidor (HTTP ${response.status})`);
      }

      const json = await response.json();
      return json;
    } catch (err) {
      console.error(`[ApiService] Error en GET '${action}':`, err);
      throw err;
    }
  },

  /* ==========================================================================
     1. MÉTODOS PÚBLICOS DEL PORTAL DE RESERVAS
     ========================================================================== */

  /**
   * Consulta disponibilidad de turnos para una fecha y duración
   */
  async getAvailability(dateStr, durationMinutes) {
    return await this.get('getAvailability', {
      date: dateStr,
      duration: durationMinutes
    });
  },

  /**
   * Crea una solicitud de reserva atómica en la pestaña 'Reservas'
   */
  async createReservation(reservationData) {
    return await this.post('createReservation', {
      reservationData: reservationData
    });
  },

  /**
   * Cancela una reserva mediante el token privado del solicitante
   */
  async cancelReservation(code, cancelToken, reason) {
    return await this.post('cancelReservation', {
      code: code,
      cancelToken: cancelToken,
      reason: reason
    });
  },

  /* ==========================================================================
     2. MÉTODOS PRIVADOS DEL PANEL DE ADMINISTRACIÓN
     ========================================================================== */

  /**
   * Inicia sesión del administrador validando contra 'Administradores'
   */
  async adminLogin(username, password) {
    return await this.post('adminLogin', {
      username: username,
      password: password
    });
  },

  /**
   * Cierra sesión administrativa revocando el token
   */
  async adminLogout(sessionToken) {
    return await this.post('adminLogout', {
      sessionToken: sessionToken
    });
  },

  /**
   * Obtiene la lista completa de solicitudes con filtros
   */
  async adminGetRequests(sessionToken, filters = {}) {
    return await this.post('adminGetRequests', {
      sessionToken: sessionToken,
      filters: filters
    });
  },

  /**
   * Actualiza el estado de una solicitud (aprobada, rechazada, cancelada)
   */
  async adminUpdateStatus(sessionToken, code, newStatus, reason = '') {
    return await this.post('adminUpdateStatus', {
      sessionToken: sessionToken,
      code: code,
      newStatus: newStatus,
      reason: reason
    });
  },

  /**
   * Consulta bloqueos administrativos activos
   */
  async adminGetBlocks(sessionToken) {
    return await this.post('adminGetBlocks', {
      sessionToken: sessionToken
    });
  },

  /**
   * Registra un nuevo bloqueo de horario
   */
  async adminAddBlock(sessionToken, blockData) {
    return await this.post('adminAddBlock', {
      sessionToken: sessionToken,
      blockData: blockData
    });
  },

  /**
   * Elimina un bloqueo existente
   */
  async adminRemoveBlock(sessionToken, blockId) {
    return await this.post('adminRemoveBlock', {
      sessionToken: sessionToken,
      blockId: blockId
    });
  },

  /**
   * Obtiene el historial completo de auditoría
   */
  async adminGetHistory(sessionToken) {
    return await this.post('adminGetHistory', {
      sessionToken: sessionToken
    });
  }
};

// Exponer globalmente
if (typeof window !== 'undefined') {
  window.ApiService = ApiService;
}
