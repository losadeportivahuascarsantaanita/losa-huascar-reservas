/**
 * Repositorio de Datos para el Panel del Administrador
 * Losa Deportiva Huáscar – Santa Anita
 * 
 * Conectado en tiempo real con Google Sheets mediante Google Apps Script.
 */

const AdminData = {
  requests: [],
  blockedSlots: [],
  auditHistory: []
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.AdminData = AdminData;
}
