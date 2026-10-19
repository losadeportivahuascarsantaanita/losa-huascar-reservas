/**
 * Motor del Calendario Mensual y Selector de Horarios por Intervalo
 * Losa Deportiva Huáscar – Santa Anita
 */

class HuascarCalendar {
  constructor() {
    // Fecha actual y límites de anticipación
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);

    this.maxDate = new Date(this.today);
    this.maxDate.setDate(this.today.getDate() + CONFIG.maxAdvanceDays);

    // Estado activo
    this.selectedDate = new Date(this.today); // Fecha seleccionada por defecto: hoy
    this.currentMonth = this.today.getMonth(); // Mes visible en el calendario
    this.currentYear = this.today.getFullYear();

    this.selectedDuration = CONFIG.defaultDuration; // 60, 90, 120
    this.selectedSlot = null; // { start: '16:00', end: '18:00', duration: 120 }

    // Datos de reservas y disponibilidad (en vivo desde Google Sheets)
    this.scheduleData = {};

    this.init();
  }

  init() {
    this.renderMonthPicker();
    this.renderDurationChips();
    this.renderDaySlots();
    this.bindGlobalEvents();
    this.fetchLiveAvailability();
  }

  async fetchLiveAvailability() {
    if (typeof ApiService === 'undefined' || !ApiService.isLive) return;

    const y = this.selectedDate.getFullYear();
    const m = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(this.selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const key = `${dateStr}_${this.selectedDuration}`;

    try {
      const res = await ApiService.getAvailability(dateStr, this.selectedDuration);
      if (res && res.success && Array.isArray(res.horarios)) {
        this.liveAvailabilityMap = this.liveAvailabilityMap || {};
        this.liveAvailabilityMap[key] = res.horarios;
        this.renderDaySlots();
      }
    } catch (err) {
      console.warn('[Calendar] Consulta en vivo no disponible, usando fallback:', err);
    }
  }

  /* ==========================================================================
     1. CALENDARIO MENSUAL (SELECTOR DE FECHAS)
     ========================================================================== */

  // Verifica si se puede retroceder de mes
  canPrevMonth() {
    const prevMonthDate = new Date(this.currentYear, this.currentMonth - 1, 1);
    const minMonthDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1);
    return prevMonthDate >= minMonthDate;
  }

  // Verifica si se puede avanzar de mes
  canNextMonth() {
    const nextMonthDate = new Date(this.currentYear, this.currentMonth + 1, 1);
    const maxMonthDate = new Date(this.maxDate.getFullYear(), this.maxDate.getMonth(), 1);
    return nextMonthDate <= maxMonthDate;
  }

  prevMonth() {
    if (this.canPrevMonth()) {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.renderMonthPicker();
    }
  }

  nextMonth() {
    if (this.canNextMonth()) {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.renderMonthPicker();
    }
  }

  // Selecciona un día del calendario mensual
  selectDate(year, month, day) {
    const targetDate = new Date(year, month, day);
    targetDate.setHours(0, 0, 0, 0);

    // Validar rango permitido [today, maxDate]
    if (targetDate < this.today || targetDate > this.maxDate) {
      return;
    }

    this.selectedDate = targetDate;
    this.selectedSlot = null; // Reiniciar selección de horario al cambiar de día
    this.updateIntervalPreview();
    this.renderMonthPicker();
    this.renderDaySlots();
    this.fetchLiveAvailability();
  }

  // Renderiza el componente de calendario mensual
  renderMonthPicker() {
    const container = document.getElementById('month-picker-container');
    if (!container) return;

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Primer día del mes (0: Dom, 1: Lun, ...)
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    // Ajustar para que la semana empiece en Lunes (0: Lun ... 6: Dom)
    const startingDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Total de días del mes
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    // Días del mes anterior para relleno
    const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();

    let daysHtml = '';

    // Días del mes anterior (deshabilitados)
    for (let i = startingDay - 1; i >= 0; i--) {
      daysHtml += `<div class="calendar-day-cell is-outside">${daysInPrevMonth - i}</div>`;
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(this.currentYear, this.currentMonth, day);
      cellDate.setHours(0, 0, 0, 0);

      const isToday = cellDate.getTime() === this.today.getTime();
      const isSelected = cellDate.getTime() === this.selectedDate.getTime();
      const isDisabled = cellDate < this.today || cellDate > this.maxDate;

      const classes = [
        'calendar-day-cell',
        isDisabled ? 'is-disabled' : 'is-selectable',
        isToday ? 'is-today' : '',
        isSelected ? 'is-selected' : ''
      ].filter(Boolean).join(' ');

      daysHtml += `
        <button type="button" 
                class="${classes}" 
                data-year="${this.currentYear}" 
                data-month="${this.currentMonth}" 
                data-day="${day}"
                ${isDisabled ? 'disabled' : ''}>
          <span>${day}</span>
          ${isToday ? '<span class="today-indicator"></span>' : ''}
        </button>
      `;
    }

    container.innerHTML = `
      <div class="calendar-picker-card">
        <!-- Cabecera del mes con navegación -->
        <div class="calendar-picker-header">
          <div class="month-title">
            <span class="month-text">${monthNames[this.currentMonth]} ${this.currentYear}</span>
          </div>
          <div class="month-nav-buttons">
            <button type="button" class="btn-picker-nav" id="btn-month-prev" ${!this.canPrevMonth() ? 'disabled' : ''} title="Mes anterior">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button type="button" class="btn-picker-nav" id="btn-month-next" ${!this.canNextMonth() ? 'disabled' : ''} title="Mes siguiente">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>

        <!-- Días de la semana -->
        <div class="calendar-weekdays-row">
          <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>

        <!-- Cuadrícula de días -->
        <div class="calendar-days-grid">
          ${daysHtml}
        </div>

        <!-- Resumen de fecha activa -->
        <div class="calendar-picker-footer">
          <div class="picker-active-badge">
            <span class="active-dot"></span>
            <span>Fecha elegida: <strong>${TimeUtils.formatShortDate(this.selectedDate)}</strong></span>
          </div>
        </div>
      </div>
    `;

    // Eventos de botones del mes
    document.getElementById('btn-month-prev')?.addEventListener('click', () => this.prevMonth());
    document.getElementById('btn-month-next')?.addEventListener('click', () => this.nextMonth());

    // Eventos de clic en días seleccionables
    container.querySelectorAll('.calendar-day-cell.is-selectable').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const y = Number(e.currentTarget.getAttribute('data-year'));
        const m = Number(e.currentTarget.getAttribute('data-month'));
        const d = Number(e.currentTarget.getAttribute('data-day'));
        this.selectDate(y, m, d);
      });
    });
  }

  /* ==========================================================================
     2. DURACIÓN DE LA RESERVA (1h, 1.5h, 2h)
     ========================================================================== */
  setDuration(minutes) {
    if (CONFIG.allowedDurations.some(d => d.minutes === minutes)) {
      this.selectedDuration = minutes;
      this.selectedSlot = null; // Reiniciar selección para evitar desajustes
      this.updateIntervalPreview();
      this.renderDurationChips();
      this.renderDaySlots();
      this.fetchLiveAvailability();
    }
  }

  renderDurationChips() {
    const container = document.getElementById('duration-chips-container');
    if (!container) return;

    container.innerHTML = `
      <div class="duration-section-header">
        <label class="section-micro-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Duración del turno:
        </label>
      </div>
      <div class="duration-chips-grid">
        ${CONFIG.allowedDurations.map(d => `
          <button type="button" 
                  class="duration-chip-btn ${this.selectedDuration === d.minutes ? 'is-active' : ''}" 
                  data-duration="${d.minutes}">
            <span class="duration-main-text">${d.label}</span>
            <span class="duration-sub-text">${d.tag}</span>
          </button>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.duration-chip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dur = Number(e.currentTarget.getAttribute('data-duration'));
        this.setDuration(dur);
      });
    });
  }

  /* ==========================================================================
     3 y 4. HORARIOS DISPONIBLES CADA 30 MIN Y RESALTADO DE INTERVALO
     ========================================================================== */

  // Genera todos los horarios de inicio posibles cada 30 minutos (07:00 a 22:00)
  generateCandidateStartTimes() {
    const times = [];
    const openMinutes = CONFIG.openingHour * 60;   // 07:00 = 420
    const closeMinutes = CONFIG.closingHour * 60; // 22:00 = 1320
    const step = CONFIG.slotIntervalMinutes;      // 30 min

    for (let m = openMinutes; m <= closeMinutes; m += step) {
      const canFitDuration = (m + this.selectedDuration <= closeMinutes);
      times.push({
        startMinutes: m,
        endMinutes: m + this.selectedDuration,
        start: TimeUtils.minutesToTime(m),
        end: TimeUtils.minutesToTime(m + this.selectedDuration),
        canFitDuration: canFitDuration,
        isClosingHour: m === closeMinutes
      });
    }

    return times;
  }

  // Verifica disponibilidad de un intervalo [startMinutes, endMinutes]
  checkIntervalAvailability(slot) {
    // 22:00 es la hora de cierre, no es inicio de nueva reserva
    if (slot.isClosingHour) {
      return { isAvailable: false, reason: 'Cierre (10:00 p. m.)' };
    }

    // Comprobar si el turno se pasa del cierre de las 10:00 p. m.
    if (!slot.canFitDuration) {
      return { isAvailable: false, reason: 'Excede horario' };
    }

    const dateStr = this.selectedDate.toISOString().split('T')[0];
    const now = new Date();

    // 1. Regla de anticipación mínima de 2 horas (si es hoy)
    const isToday = this.selectedDate.getTime() === this.today.getTime();
    if (isToday) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const minRequiredMinutes = nowMinutes + (CONFIG.minAdvanceHours * 60);
      if (slot.startMinutes < minRequiredMinutes) {
        return { isAvailable: false, reason: 'Menos de 2 horas' };
      }
    }

    // 2. Comprobar traslapes con reservas (pendientes, aprobadas) o bloqueos del día
    const dayBookings = this.scheduleData[dateStr] || [];

    for (const b of dayBookings) {
      const bStartMinutes = TimeUtils.timeToMinutes(b.start);
      const bEndMinutes = TimeUtils.timeToMinutes(b.end);

      // Traslape de intervalos: max(S1, S2) < min(E1, E2)
      if (Math.max(slot.startMinutes, bStartMinutes) < Math.min(slot.endMinutes, bEndMinutes)) {
        let labelReason = 'Ocupado';
        if (b.status === 'pendiente') labelReason = 'Pendiente';
        if (b.status === 'bloqueado') labelReason = 'Bloqueado';
        return { isAvailable: false, reason: labelReason, booking: b };
      }
    }

    return { isAvailable: true };
  }

  // Renderiza los botones de horario para el día y duración seleccionados
  renderDaySlots() {
    const container = document.getElementById('day-slots-container');
    if (!container) return;

    const candidates = this.generateCandidateStartTimes();
    const dateReadable = TimeUtils.formatFullDate(this.selectedDate);

    // Evaluar si tenemos disponibilidad en vivo desde Google Sheets
    const y = this.selectedDate.getFullYear();
    const m = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(this.selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const key = `${dateStr}_${this.selectedDuration}`;
    const liveList = (this.liveAvailabilityMap && this.liveAvailabilityMap[key]) || null;

    // Evaluar cada horario candidato
    const evaluatedSlots = candidates.map(slot => {
      if (liveList) {
        const liveSlot = liveList.find(s => s.inicio === slot.start);
        if (liveSlot) {
          return {
            ...slot,
            isAvailable: Boolean(liveSlot.disponible),
            reason: liveSlot.motivo || ''
          };
        }
      }
      const check = this.checkIntervalAvailability(slot);
      return {
        ...slot,
        isAvailable: check.isAvailable,
        reason: check.reason || ''
      };
    });

    const availableCount = evaluatedSlots.filter(s => s.isAvailable).length;

    let slotsGridHtml = '';

    evaluatedSlots.forEach(slot => {
      let isStart = false;
      let isIntermediate = false;
      let isEnd = false;

      if (this.selectedSlot) {
        const selStartMin = TimeUtils.timeToMinutes(this.selectedSlot.start);
        const selEndMin = TimeUtils.timeToMinutes(this.selectedSlot.end);

        if (slot.startMinutes === selStartMin) {
          isStart = true;
        } else if (slot.startMinutes > selStartMin && slot.startMinutes < selEndMin) {
          isIntermediate = true;
        } else if (slot.startMinutes === selEndMin) {
          isEnd = true;
        }
      }

      // El botón de Fin mantiene su disponibilidad para iniciar otra reserva si no tiene conflictos
      const isClickable = slot.isAvailable || (isEnd && !slot.isClosingHour && slot.isAvailable);

      const slotClasses = [
        'slot-time-btn',
        slot.isAvailable ? 'is-available' : 'is-unavailable',
        isStart ? 'is-selected-start' : '',
        isIntermediate ? 'is-interval-intermediate' : '',
        isEnd ? 'is-interval-end' : ''
      ].filter(Boolean).join(' ');

      const formatted12h = TimeUtils.formatTime12h(slot.start);

      // Determinar etiqueta o badge del botón
      let badgeHtml = '';
      if (isStart) {
        badgeHtml = '<span class="slot-badge-marker badge-start">✓ Inicio</span>';
      } else if (isIntermediate) {
        badgeHtml = '<span class="slot-badge-marker badge-intermediate">Intervalo</span>';
      } else if (isEnd) {
        badgeHtml = '<span class="slot-badge-marker badge-end">Fin</span>';
      } else if (!slot.isAvailable) {
        badgeHtml = `<span class="slot-btn-status">${slot.reason}</span>`;
      }

      slotsGridHtml += `
        <button type="button" 
                class="${slotClasses}" 
                data-start="${slot.start}" 
                data-end="${slot.end}" 
                data-duration="${this.selectedDuration}"
                data-available="${slot.isAvailable}"
                data-is-end="${isEnd}"
                ${(!slot.isAvailable && !isEnd) ? 'disabled' : ''}
                title="${slot.isAvailable ? `Seleccionar desde ${formatted12h} (${this.selectedDuration} min)` : (isEnd ? `Hora de término (${formatted12h})` : slot.reason)}">
          <span class="slot-btn-time">${formatted12h}</span>
          ${badgeHtml}
        </button>
      `;
    });

    container.innerHTML = `
      <div class="day-slots-card">
        <div class="day-slots-header">
          <div class="day-info-text">
            <h3 class="day-title">Horarios para el ${dateReadable}</h3>
            <p class="day-subtitle">Turnos de <strong>${this.selectedDuration} minutos</strong> (inicio cada 30 min)</p>
          </div>
          <div class="available-badge ${availableCount > 0 ? 'has-slots' : 'no-slots'}">
            ${availableCount} horarios libres
          </div>
        </div>

        <!-- Cuadrícula de botones pequeños de horario estilo Aviva -->
        <div class="slots-buttons-grid">
          ${slotsGridHtml}
        </div>

        <!-- Resumen del Intervalo Seleccionado -->
        <div id="interval-preview-wrap"></div>
      </div>
    `;

    // Asignar eventos de selección a los botones disponibles
    container.querySelectorAll('.slot-time-btn.is-available').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const start = e.currentTarget.getAttribute('data-start');
        const end = e.currentTarget.getAttribute('data-end');
        const duration = Number(e.currentTarget.getAttribute('data-duration'));

        // Alternar selección
        if (this.selectedSlot && this.selectedSlot.start === start) {
          this.selectedSlot = null;
        } else {
          this.selectedSlot = { start, end, duration };
        }

        this.updateIntervalPreview();
        this.renderDaySlots(); // Re-render para actualizar el resaltado de botones
      });
    });

    this.updateIntervalPreview();
  }

  // Actualiza la tarjeta y banner del intervalo resaltado
  updateIntervalPreview() {
    const previewWrap = document.getElementById('interval-preview-wrap');
    const bottomBar = document.getElementById('selected-slot-bar');
    const bottomDetails = document.getElementById('selected-slot-details');

    if (!this.selectedSlot) {
      if (previewWrap) {
        previewWrap.innerHTML = `
          <div class="interval-hint-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span>Selecciona una hora de inicio arriba para ver el intervalo completo de tu reserva.</span>
          </div>
        `;
      }
      if (bottomBar) bottomBar.classList.remove('visible');
      return;
    }

    const start12 = TimeUtils.formatTime12h(this.selectedSlot.start);
    const end12 = TimeUtils.formatTime12h(this.selectedSlot.end);
    const dateFormatted = TimeUtils.formatFullDate(this.selectedDate);

    const durationText = CONFIG.allowedDurations.find(d => d.minutes === this.selectedSlot.duration)?.label || `${this.selectedSlot.duration} min`;

    if (previewWrap) {
      previewWrap.innerHTML = `
        <div class="selected-interval-card">
          <div class="interval-card-content">
            <div class="interval-badge-label">
              <span class="interval-pulse"></span>
              Intervalo Seleccionado
            </div>
            <div class="interval-time-range">
              ${start12} <span>a</span> ${end12}
            </div>
            <div class="interval-details-meta">
              <span>📅 ${dateFormatted}</span>
              <span>⏱️ ${durationText} (${this.selectedSlot.duration} min)</span>
            </div>
          </div>
          <button type="button" class="btn-cta-continue" id="btn-interval-continue">
            <span>Continuar</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      `;

      document.getElementById('btn-interval-continue')?.addEventListener('click', () => {
        this.openConfirmationModal();
      });
    }

    // Actualizar barra inferior móvil también
    if (bottomBar && bottomDetails) {
      bottomDetails.innerHTML = `
        <strong>${start12} a ${end12}</strong> (${durationText})
      `;
      bottomBar.classList.add('visible');
    }
  }

  /* ==========================================================================
     5. VENTANA DE CONFIRMACIÓN (MODAL CENTRADO CON FONDO ATENUADO)
     ========================================================================== */
  openConfirmationModal() {
    if (!this.selectedSlot) return;

    const modal = document.getElementById('confirmation-modal');
    if (!modal) return;

    const start12 = TimeUtils.formatTime12h(this.selectedSlot.start);
    const end12 = TimeUtils.formatTime12h(this.selectedSlot.end);
    const dateFormatted = TimeUtils.formatFullDate(this.selectedDate);
    const durationText = CONFIG.allowedDurations.find(d => d.minutes === this.selectedSlot.duration)?.label || `${this.selectedSlot.duration} min`;

    // Inyectar datos en la modal
    document.getElementById('confirm-losa-name').textContent = CONFIG.appName;
    document.getElementById('confirm-date').textContent = dateFormatted;
    document.getElementById('confirm-start-time').textContent = start12;
    document.getElementById('confirm-end-time').textContent = end12;
    document.getElementById('confirm-duration').textContent = `${durationText} (${this.selectedSlot.duration} minutos)`;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Evitar scroll del fondo
  }

  closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  bindGlobalEvents() {
    // Botón Continuar en la barra inferior flotante
    document.getElementById('btn-proceed-booking')?.addEventListener('click', () => {
      this.openConfirmationModal();
    });

    // Cerrar modal de confirmación con botón Volver o X
    document.getElementById('btn-modal-back')?.addEventListener('click', () => {
      this.closeConfirmationModal();
    });
    document.getElementById('btn-modal-close-confirm')?.addEventListener('click', () => {
      this.closeConfirmationModal();
    });

    // Acción del botón Continuar dentro de la ventana de confirmación
    document.getElementById('btn-modal-proceed-form')?.addEventListener('click', () => {
      this.closeConfirmationModal();
      if (this.selectedSlot && this.selectedDate) {
        const y = this.selectedDate.getFullYear();
        const m = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(this.selectedDate.getDate()).padStart(2, '0');
        const dateISO = `${y}-${m}-${d}`;

        const durationObj = CONFIG.allowedDurations.find(d => d.minutes === this.selectedDuration);
        const slotData = {
          date: this.selectedDate,
          dateISO: dateISO,
          dateFormatted: TimeUtils.formatFullDate(this.selectedDate),
          start: this.selectedSlot.start,
          start12: TimeUtils.formatTime12h(this.selectedSlot.start),
          end: this.selectedSlot.end,
          end12: TimeUtils.formatTime12h(this.selectedSlot.end),
          duration: this.selectedDuration,
          durationLabel: durationObj ? durationObj.label : `${this.selectedDuration} min`
        };
        const portal = window.UserPortal || (typeof UserPortal !== 'undefined' ? UserPortal : null);
        if (portal && typeof portal.startFromCalendar === 'function') {
          portal.startFromCalendar(slotData);
        } else {
          console.error('Error: UserPortal no encontrado al intentar iniciar el formulario.', { portal, windowPortal: window.UserPortal });
        }
      }
    });

    // Cerrar modal al hacer clic en el backdrop
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeConfirmationModal();
      });
    }

    // Tecla Escape para cerrar modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeConfirmationModal();
      }
    });
  }
}
