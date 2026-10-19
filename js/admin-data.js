/**
 * Datos y Repositorio de Demostración para el Panel del Administrador
 * Losa Deportiva Huáscar – Santa Anita
 * 
 * NOTA: Todos los nombres, DNIs y celulares son 100% ficticios.
 * En la Etapa Backend se conectará con Google Sheets y Google Apps Script.
 */

const AdminData = {
  // Solicitudes iniciales de demostración (12 solicitudes: 5 Pendientes, 4 Aprobadas, 2 Rechazadas, 1 Cancelada)
  requests: [
    {
      id: 'RH-20261020-001',
      date: '2026-10-20',
      dateFormatted: 'Martes, 20 de octubre de 2026',
      start: '14:00',
      end: '16:00',
      timeFormatted: '2:00 p. m. – 4:00 p. m.',
      durationMinutes: 120,
      durationLabel: '2 horas (120 min)',
      applicant: {
        names: 'Juan',
        lastnames: 'Pérez García',
        fullName: 'Juan Pérez García',
        dni: '12345678',
        phone: '987654321',
        isNeighbor: true,
        block: 'B',
        lot: '14',
        reference: 'Frente al parque central',
        address: 'Mz. B, Lt. 14 (Ref: Frente al parque central)',
        district: 'Santa Anita'
      },
      activity: 'Fulbito',
      activityDetail: '',
      status: 'pendiente', // 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada'
      receivedAt: '20/10/2026 – 11:45 a. m.',
      resolutionNote: ''
    },
    {
      id: 'RH-20261020-002',
      date: '2026-10-20',
      dateFormatted: 'Martes, 20 de octubre de 2026',
      start: '16:00',
      end: '17:30',
      timeFormatted: '4:00 p. m. – 5:30 p. m.',
      durationMinutes: 90,
      durationLabel: '1.5 horas (90 min)',
      applicant: {
        names: 'María',
        lastnames: 'López Rojas',
        fullName: 'María López Rojas',
        dni: '87654321',
        phone: '912345678',
        isNeighbor: true,
        block: 'F',
        lot: '08',
        reference: 'Cerca a la capilla',
        address: 'Mz. F, Lt. 08 (Ref: Cerca a la capilla)',
        district: 'Santa Anita'
      },
      activity: 'Vóley',
      activityDetail: '',
      status: 'aprobada',
      receivedAt: '20/10/2026 – 09:15 a. m.',
      resolutionNote: 'Aprobado según disponibilidad del turno vespertino.'
    },
    {
      id: 'RH-20261021-001',
      date: '2026-10-21',
      dateFormatted: 'Miércoles, 21 de octubre de 2026',
      start: '18:00',
      end: '20:00',
      timeFormatted: '6:00 p. m. – 8:00 p. m.',
      durationMinutes: 120,
      durationLabel: '2 horas (120 min)',
      applicant: {
        names: 'Carlos',
        lastnames: 'Mendoza Ruiz',
        fullName: 'Carlos Mendoza Ruiz',
        dni: '11223344',
        phone: '998877665',
        isNeighbor: false,
        block: '',
        lot: '',
        reference: '',
        address: 'Av. Los Ficus 340',
        district: 'Santa Anita'
      },
      activity: 'Academia',
      activityDetail: 'Entrenamiento formativo juvenil',
      status: 'pendiente',
      receivedAt: '20/10/2026 – 10:30 a. m.',
      resolutionNote: ''
    },
    {
      id: 'RH-20261022-001',
      date: '2026-10-22',
      dateFormatted: 'Jueves, 22 de octubre de 2026',
      start: '08:00',
      end: '09:30',
      timeFormatted: '8:00 a. m. – 9:30 a. m.',
      durationMinutes: 90,
      durationLabel: '1.5 horas (90 min)',
      applicant: {
        names: 'Ana',
        lastnames: 'Torres Silva',
        fullName: 'Ana Torres Silva',
        dni: '44556677',
        phone: '987123456',
        isNeighbor: true,
        block: 'C',
        lot: '22',
        reference: 'A espaldas del colegio',
        address: 'Mz. C, Lt. 22',
        district: 'Santa Anita'
      },
      activity: 'Básquet',
      activityDetail: '',
      status: 'rechazada',
      receivedAt: '19/10/2026 – 04:20 p. m.',
      resolutionNote: 'Mantenimiento preventivo de tableros de básquet programado para esa mañana.'
    },
    {
      id: 'RH-20261022-002',
      date: '2026-10-22',
      dateFormatted: 'Jueves, 22 de octubre de 2026',
      start: '17:00',
      end: '19:00',
      timeFormatted: '5:00 p. m. – 7:00 p. m.',
      durationMinutes: 120,
      durationLabel: '2 horas (120 min)',
      applicant: {
        names: 'Luis',
        lastnames: 'Cárdenas León',
        fullName: 'Luis Cárdenas León',
        dni: '99887766',
        phone: '923456789',
        isNeighbor: false,
        block: '',
        lot: '',
        reference: '',
        address: 'Calle Las Begonias 145',
        district: 'Ate'
      },
      activity: 'Evento deportivo',
      activityDetail: 'Relámpago interbarrial de integración',
      status: 'aprobada',
      receivedAt: '19/10/2026 – 02:10 p. m.',
      resolutionNote: 'Aprobado con compromiso de respetar horarios de culminación.'
    },
    {
      id: 'RH-20261023-001',
      date: '2026-10-23',
      dateFormatted: 'Viernes, 23 de octubre de 2026',
      start: '19:00',
      end: '20:00',
      timeFormatted: '7:00 p. m. – 8:00 p. m.',
      durationMinutes: 60,
      durationLabel: '1 hora (60 min)',
      applicant: {
        names: 'Sofía',
        lastnames: 'Ramírez Díaz',
        fullName: 'Sofía Ramírez Díaz',
        dni: '66778899',
        phone: '945612378',
        isNeighbor: true,
        block: 'D',
        lot: '05',
        reference: 'Pasaje Los Olivos',
        address: 'Mz. D, Lt. 05',
        district: 'Santa Anita'
      },
      activity: 'Otro',
      activityDetail: 'Cumpleaños infantil deportivo',
      status: 'cancelada',
      receivedAt: '18/10/2026 – 05:40 p. m.',
      resolutionNote: 'Cancelada a solicitud de la solicitante por cambio de fecha familiar.'
    },
    {
      id: 'RH-20261024-001',
      date: '2026-10-24',
      dateFormatted: 'Sábado, 24 de octubre de 2026',
      start: '09:00',
      end: '11:00',
      timeFormatted: '9:00 a. m. – 11:00 a. m.',
      durationMinutes: 120,
      durationLabel: '2 horas (120 min)',
      applicant: {
        names: 'Pedro',
        lastnames: 'Navarro Quispe',
        fullName: 'Pedro Navarro Quispe',
        dni: '22334455',
        phone: '978546123',
        isNeighbor: true,
        block: 'A',
        lot: '19',
        reference: 'Frente a la losa',
        address: 'Mz. A, Lt. 19',
        district: 'Santa Anita'
      },
      activity: 'Fulbito',
      activityDetail: 'Encuentro vecinal de veteranos',
      status: 'aprobada',
      receivedAt: '20/10/2026 – 08:30 a. m.',
      resolutionNote: 'Aprobado para la jornada sabatina.'
    },
    {
      id: 'RH-20261024-002',
      date: '2026-10-24',
      dateFormatted: 'Sábado, 24 de octubre de 2026',
      start: '15:00',
      end: '16:30',
      timeFormatted: '3:00 p. m. – 4:30 p. m.',
      durationMinutes: 90,
      durationLabel: '1.5 horas (90 min)',
      applicant: {
        names: 'Lucía',
        lastnames: 'Herrera Morales',
        fullName: 'Lucía Herrera Morales',
        dni: '55667788',
        phone: '934567890',
        isNeighbor: false,
        block: '',
        lot: '',
        reference: '',
        address: 'Jr. Huarochirí 520',
        district: 'El Agustino'
      },
      activity: 'Vóley',
      activityDetail: '',
      status: 'pendiente',
      receivedAt: '20/10/2026 – 11:10 a. m.',
      resolutionNote: ''
    },
    {
      id: 'RH-20261025-001',
      date: '2026-10-25',
      dateFormatted: 'Domingo, 25 de octubre de 2026',
      start: '10:00',
      end: '12:00',
      timeFormatted: '10:00 a. m. – 12:00 p. m.',
      durationMinutes: 120,
      durationLabel: '2 horas (120 min)',
      applicant: {
        names: 'Jorge',
        lastnames: 'Salazar Castro',
        fullName: 'Jorge Salazar Castro',
        dni: '77889900',
        phone: '967890123',
        isNeighbor: true,
        block: 'E',
        lot: '12',
        reference: 'Cerca a la caseta comunal',
        address: 'Mz. E, Lt. 12',
        district: 'Santa Anita'
      },
      activity: 'Fulbito',
      activityDetail: 'Torneo dominical Huáscar',
      status: 'aprobada',
      receivedAt: '19/10/2026 – 03:00 p. m.',
      resolutionNote: 'Turno dominical confirmado.'
    },
    {
      id: 'RH-20261025-002',
      date: '2026-10-25',
      dateFormatted: 'Domingo, 25 de octubre de 2026',
      start: '16:00',
      end: '18:00',
      timeFormatted: '4:00 p. m. – 6:00 p. m.',
      durationMinutes: 120,
      durationLabel: '2 horas (120 min)',
      applicant: {
        names: 'Carmen',
        lastnames: 'Vargas Ortiz',
        fullName: 'Carmen Vargas Ortiz',
        dni: '33445566',
        phone: '956789012',
        isNeighbor: false,
        block: '',
        lot: '',
        reference: '',
        address: 'Av. Ruiseñores 810',
        district: 'Santa Anita'
      },
      activity: 'Academia',
      activityDetail: 'Clase dominical de iniciación deportiva',
      status: 'pendiente',
      receivedAt: '20/10/2026 – 12:05 p. m.',
      resolutionNote: ''
    },
    {
      id: 'RH-20261026-001',
      date: '2026-10-26',
      dateFormatted: 'Lunes, 26 de octubre de 2026',
      start: '18:30',
      end: '20:30',
      timeFormatted: '6:30 p. m. – 8:30 p. m.',
      durationMinutes: 120,
      durationLabel: '2 horas (120 min)',
      applicant: {
        names: 'Diego',
        lastnames: 'Chávez Palacios',
        fullName: 'Diego Chávez Palacios',
        dni: '88990011',
        phone: '989012345',
        isNeighbor: true,
        block: 'H',
        lot: '03',
        reference: 'Sector Huáscar Alto',
        address: 'Mz. H, Lt. 03',
        district: 'Santa Anita'
      },
      activity: 'Básquet',
      activityDetail: '',
      status: 'rechazada',
      receivedAt: '18/10/2026 – 07:15 p. m.',
      resolutionNote: 'Cruce con sesión de entrenamiento comunitario de la junta vecinal.'
    },
    {
      id: 'RH-20261027-001',
      date: '2026-10-27',
      dateFormatted: 'Martes, 27 de octubre de 2026',
      start: '19:00',
      end: '21:00',
      timeFormatted: '7:00 p. m. – 9:00 p. m.',
      durationMinutes: 120,
      durationLabel: '2 horas (120 min)',
      applicant: {
        names: 'Rosa',
        lastnames: 'Gutiérrez Meza',
        fullName: 'Rosa Gutiérrez Meza',
        dni: '99001122',
        phone: '990123456',
        isNeighbor: true,
        block: 'G',
        lot: '15',
        reference: 'Altura parque infantil',
        address: 'Mz. G, Lt. 15',
        district: 'Santa Anita'
      },
      activity: 'Fulbito',
      activityDetail: '',
      status: 'pendiente',
      receivedAt: '20/10/2026 – 01:25 p. m.',
      resolutionNote: ''
    }
  ],

  // Horarios bloqueados demostrativos
  blockedSlots: [
    {
      id: 'BLK-001',
      date: '2026-10-22',
      start: '07:00',
      end: '10:00',
      timeFormatted: '7:00 a. m. – 10:00 a. m.',
      reason: 'Mantenimiento preventivo de tableros y pintura',
      createdBy: 'Administrador Huáscar',
      createdAt: '18/10/2026 – 09:00 a. m.'
    },
    {
      id: 'BLK-002',
      date: '2026-10-28',
      start: '14:00',
      end: '18:00',
      timeFormatted: '2:00 p. m. – 6:00 p. m.',
      reason: 'Jornada cívica y asamblea comunal',
      createdBy: 'Administrador Huáscar',
      createdAt: '19/10/2026 – 10:30 a. m.'
    }
  ],

  // Historial de auditoría demostrativo
  auditHistory: [
    {
      id: 'AUD-001',
      timestamp: '20/10/2026 – 10:45 a. m.',
      action: 'Aprobación de solicitud',
      targetId: 'RH-20261020-002',
      prevStatus: 'pendiente',
      newStatus: 'aprobada',
      adminUser: 'Administrador Huáscar',
      notes: 'Solicitud aprobada y confirmada.'
    },
    {
      id: 'AUD-002',
      timestamp: '20/10/2026 – 09:30 a. m.',
      action: 'Aprobación de solicitud',
      targetId: 'RH-20261024-001',
      prevStatus: 'pendiente',
      newStatus: 'aprobada',
      adminUser: 'Administrador Huáscar',
      notes: 'Aprobado para turno de sábado.'
    },
    {
      id: 'AUD-003',
      timestamp: '19/10/2026 – 05:15 p. m.',
      action: 'Rechazo de solicitud',
      targetId: 'RH-20261022-001',
      prevStatus: 'pendiente',
      newStatus: 'rechazada',
      adminUser: 'Administrador Huáscar',
      notes: 'Mantenimiento programado de tableros.'
    },
    {
      id: 'AUD-004',
      timestamp: '19/10/2026 – 04:00 p. m.',
      action: 'Aprobación de solicitud',
      targetId: 'RH-20261022-002',
      prevStatus: 'pendiente',
      newStatus: 'aprobada',
      adminUser: 'Administrador Huáscar',
      notes: 'Evento deportivo autorizado.'
    },
    {
      id: 'AUD-005',
      timestamp: '19/10/2026 – 11:00 a. m.',
      action: 'Cancelación de reserva',
      targetId: 'RH-20261023-001',
      prevStatus: 'pendiente',
      newStatus: 'cancelada',
      adminUser: 'Administrador Huáscar',
      notes: 'Cancelación a petición de la solicitante.'
    },
    {
      id: 'AUD-006',
      timestamp: '18/10/2026 – 09:00 a. m.',
      action: 'Bloqueo de horario',
      targetId: 'BLK-001',
      prevStatus: 'disponible',
      newStatus: 'bloqueado',
      adminUser: 'Administrador Huáscar',
      notes: 'Mantenimiento preventivo 22/10 de 7:00 a 10:00 a. m.'
    }
  ]
};

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.AdminData = AdminData;
}
