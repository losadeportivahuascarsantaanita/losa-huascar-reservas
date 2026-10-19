/**
 * Configuración general y constantes del sistema
 * Losa Deportiva Huáscar - Santa Anita
 */

const CONFIG = {
  appName: 'Losa Deportiva Huáscar – Santa Anita',
  district: 'Santa Anita, Lima - Perú',
  
  // Reglas de horario
  openingHour: 7,   // 7:00 a. m.
  closingHour: 22,  // 10:00 p. m. (cierre total de la losa)
  slotIntervalMinutes: 30, // Horarios cada 30 minutos
  
  // Reglas de anticipación
  minAdvanceHours: 2, // Mínimo 2 horas antes del inicio
  maxAdvanceDays: 30, // Máximo 30 días de anticipación
  
  // Duraciones permitidas en minutos
  allowedDurations: [
    { minutes: 60, label: '1 hora', tag: '60 min' },
    { minutes: 90, label: '1 hora y media', tag: '90 min' },
    { minutes: 120, label: '2 horas', tag: '120 min' }
  ],
  defaultDuration: 60,
  
  // 43 Distritos de Lima Metropolitana
  limaDistricts: [
    'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos',
    'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María',
    'La Molina', 'La Victoria', 'Lima (Cercado)', 'Lince', 'Los Olivos', 'Lurigancho-Chosica',
    'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana',
    'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac',
    'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho',
    'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel',
    'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco',
    'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
  ],

  // Motivos disponibles
  bookingReasons: [
    { id: 'fulbito', label: 'Fulbito', icon: '⚽' },
    { id: 'voley', label: 'Vóley', icon: '🏐' },
    { id: 'basquet', label: 'Básquet', icon: '🏀' },
    { id: 'academia', label: 'Academia', icon: '🏅' },
    { id: 'evento', label: 'Evento deportivo', icon: '🏆' },
    { id: 'otro', label: 'Otro', icon: '📝' }
  ],

  // Estados de los turnos
  states: {
    AVAILABLE: 'disponible',
    PENDING: 'pendiente',
    BOOKED: 'reservado',
    BLOCKED: 'bloqueado'
  }
};

/**
 * Funciones de utilidad para cálculo y formato de tiempo
 */
const TimeUtils = {
  // Convierte "HH:mm" a minutos desde las 00:00
  timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },

  // Convierte minutos desde 00:00 a "HH:mm"
  minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  },

  // Formato legible 12 horas con a. m. / p. m.
  formatTime12h(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'p. m.' : 'a. m.';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  },

  // Formateador completo de fecha en español
  formatFullDate(dateObj) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${days[dateObj.getDay()]}, ${dateObj.getDate()} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
  },

  // Formato corto para badges
  formatShortDate(dateObj) {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    return `${days[dateObj.getDay()]} ${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
  }
};

/**
 * Generador de datos simulados de ocupación y bloqueos
 * para demostrar el cálculo dinámico de disponibilidad por duración
 */
function generateMockSlots(daysCount = 35) {
  const mockSchedule = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let d = 0; d < daysCount; d++) {
    const curDate = new Date(today);
    curDate.setDate(today.getDate() + d);
    const dateStr = curDate.toISOString().split('T')[0];
    mockSchedule[dateStr] = [];

    // Ocupaciones de demostración
    if (d === 0) {
      // Hoy
      mockSchedule[dateStr].push(
        { start: '09:00', end: '11:00', status: 'reservado', reason: 'Academia Infantil' },
        { start: '16:00', end: '17:30', status: 'pendiente', reason: 'Fulbito Vecinos' },
        { start: '19:00', end: '21:00', status: 'reservado', reason: 'Vóley Santa Anita' }
      );
    } else if (d === 1) {
      // Mañana
      mockSchedule[dateStr].push(
        { start: '08:00', end: '09:30', status: 'reservado', reason: 'Entrenamiento' },
        { start: '11:00', end: '13:00', status: 'bloqueado', reason: 'Mantenimiento de losa' },
        { start: '17:00', end: '18:30', status: 'pendiente', reason: 'Fulbito Juvenil' },
        { start: '20:00', end: '22:00', status: 'reservado', reason: 'Torneo Huáscar' }
      );
    } else {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek === 6 || dayOfWeek === 0) { // Fines de semana
        mockSchedule[dateStr].push(
          { start: '08:00', end: '10:00', status: 'reservado', reason: 'Academia' },
          { start: '14:30', end: '16:00', status: 'pendiente', reason: 'Vóley Vecinal' },
          { start: '17:00', end: '19:00', status: 'reservado', reason: 'Copa Amistad' }
        );
      } else if (d % 3 === 0) {
        mockSchedule[dateStr].push(
          { start: '15:00', end: '16:30', status: 'bloqueado', reason: 'Inspección técnica' },
          { start: '18:30', end: '20:00', status: 'pendiente', reason: 'Básquet' }
        );
      } else if (d % 2 === 0) {
        mockSchedule[dateStr].push(
          { start: '19:00', end: '21:00', status: 'reservado', reason: 'Fulbito Nocturno' }
        );
      }
    }
  }

  return mockSchedule;
}
