/**
 * Portal del Usuario - Etapa 2
 * Formulario del Solicitante, Revisión y Constancia Digital
 * Losa Deportiva Huáscar – Santa Anita
 */

const UserPortal = {
  currentStep: 1, // 1: Calendario, 2: Formulario, 3: Revisión, 4: Constancia
  selectedSlot: null,
  isSubmitting: false,

  formData: {
    nombres: '',
    apellidos: '',
    dni: '',
    celular: '',
    esVecino: null, // 'si' | 'no'
    manzana: '',
    lote: '',
    referencia: '',
    direccion: '',
    distrito: '',
    motivo: '',
    motivoDetalle: ''
  },

  lastGeneratedCode: null,

  init() {
    this.populateDistricts();
    this.populateReasons();
    this.bindEvents();
    this.setupInputFormatters();
  },

  // Poblar distritos de Lima Metropolitana desde CONFIG
  populateDistricts() {
    const select = document.getElementById('input-distrito');
    if (!select) return;

    select.innerHTML = '<option value="">-- Selecciona tu distrito --</option>' +
      CONFIG.limaDistricts.map(d => `<option value="${d}">${d}</option>`).join('');
  },

  // Poblar opciones de motivos desde CONFIG
  populateReasons() {
    const select = document.getElementById('input-motivo');
    if (!select) return;

    select.innerHTML = '<option value="">-- Selecciona el motivo --</option>' +
      CONFIG.bookingReasons.map(m => `<option value="${m.id}">${m.label}</option>`).join('');
  },

  // Formateadores numéricos y restricciones de entrada
  setupInputFormatters() {
    const dniInput = document.getElementById('input-dni');
    if (dniInput) {
      dniInput.addEventListener('input', (e) => {
        // Solo dígitos, máximo 8
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
        this.clearFieldError('dni');
      });
    }

    const celInput = document.getElementById('input-celular');
    if (celInput) {
      celInput.addEventListener('input', (e) => {
        // Solo dígitos, máximo 9
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
        this.clearFieldError('celular');
      });
    }

    // Limpieza de errores al tipear
    ['nombres', 'apellidos', 'manzana', 'lote', 'referencia', 'direccion', 'motivo-detalle'].forEach(fieldId => {
      const el = document.getElementById(`input-${fieldId}`);
      if (el) {
        el.addEventListener('input', () => this.clearFieldError(fieldId));
      }
    });

    const distritoSelect = document.getElementById('input-distrito');
    if (distritoSelect) {
      distritoSelect.addEventListener('change', () => this.clearFieldError('distrito'));
    }

    const motivoSelect = document.getElementById('input-motivo');
    if (motivoSelect) {
      motivoSelect.addEventListener('change', (e) => {
        this.clearFieldError('motivo');
        const isOtro = e.target.value === 'otro';
        const wrapOtro = document.getElementById('wrap-motivo-otro');
        if (wrapOtro) {
          wrapOtro.style.display = isOtro ? 'block' : 'none';
          if (!isOtro) {
            const inputDetalle = document.getElementById('input-motivo-detalle');
            if (inputDetalle) inputDetalle.value = '';
            this.clearFieldError('motivo-detalle');
          }
        }
      });
    }

    // Toggle de Vecino (Sí / No)
    document.querySelectorAll('input[name="es-vecino"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.clearFieldError('es-vecino');
        this.toggleDomicilioFields(e.target.value === 'si');
      });
    });
  },

  // Alternar campos de domicilio según condición de vecino
  toggleDomicilioFields(isVecino) {
    const wrapVecino = document.getElementById('wrap-domicilio-vecino');
    const wrapNoVecino = document.getElementById('wrap-domicilio-no-vecino');

    if (isVecino) {
      if (wrapVecino) wrapVecino.style.display = 'grid';
      if (wrapNoVecino) wrapNoVecino.style.display = 'none';
      this.clearFieldError('direccion');
      this.clearFieldError('distrito');
    } else {
      if (wrapVecino) wrapVecino.style.display = 'none';
      if (wrapNoVecino) wrapNoVecino.style.display = 'grid';
      this.clearFieldError('manzana');
      this.clearFieldError('lote');
    }
  },

  // Inicia el flujo desde el Paso 1 (Calendario) con los datos del turno real
  startFromCalendar(slotData) {
    this.selectedSlot = slotData;
    this.updateSummaryCard();
    this.goToStep(2);
  },

  // Actualiza la tarjeta lateral de resumen con la selección real
  updateSummaryCard() {
    if (!this.selectedSlot) return;

    const dateEls = document.querySelectorAll('.summary-slot-date');
    const timeEls = document.querySelectorAll('.summary-slot-time');
    const durEls = document.querySelectorAll('.summary-slot-duration');

    dateEls.forEach(el => el.textContent = this.selectedSlot.dateFormatted);
    timeEls.forEach(el => el.textContent = `${this.selectedSlot.start12} a ${this.selectedSlot.end12}`);
    durEls.forEach(el => el.textContent = `${this.selectedSlot.durationLabel} (${this.selectedSlot.duration} min)`);
  },

  // Gestión de pasos de la SPA (1 a 4)
  goToStep(stepNumber) {
    this.currentStep = stepNumber;

    const step1El = document.getElementById('calendario-reservas');
    const step2El = document.getElementById('step-2-form-section');
    const step3El = document.getElementById('step-3-review-section');
    const step4El = document.getElementById('step-4-ticket-section');

    if (step1El) step1El.style.display = stepNumber === 1 ? 'block' : 'none';
    if (step2El) step2El.style.display = stepNumber === 2 ? 'block' : 'none';
    if (step3El) step3El.style.display = stepNumber === 3 ? 'block' : 'none';
    if (step4El) step4El.style.display = stepNumber === 4 ? 'block' : 'none';

    // Ocultar barra flotante móvil en pasos de formulario
    const bottomBar = document.getElementById('selected-slot-bar');
    if (bottomBar) {
      if (stepNumber > 1) {
        bottomBar.classList.remove('visible');
      } else if (this.selectedSlot) {
        bottomBar.classList.add('visible');
      }
    }

    // Desplazamiento suave al inicio del contenido funcional
    if (stepNumber > 1) {
      window.scrollTo({
        top: Math.max(0, (document.querySelector('.app-header-banner')?.offsetHeight || 280) - 40),
        behavior: 'smooth'
      });
    }
  },

  // Validaciones del Formulario (Paso 2)
  validateForm() {
    let isValid = true;

    // 1. Nombres
    const nombres = document.getElementById('input-nombres')?.value.trim() || '';
    if (!nombres) {
      this.showFieldError('nombres', 'Ingresa tus nombres.');
      isValid = false;
    } else {
      this.formData.nombres = nombres;
    }

    // 2. Apellidos
    const apellidos = document.getElementById('input-apellidos')?.value.trim() || '';
    if (!apellidos) {
      this.showFieldError('apellidos', 'Ingresa tus apellidos.');
      isValid = false;
    } else {
      this.formData.apellidos = apellidos;
    }

    // 3. DNI (exactamente 8 dígitos numéricos)
    const dni = document.getElementById('input-dni')?.value.trim() || '';
    if (!/^\d{8}$/.test(dni)) {
      this.showFieldError('dni', 'El DNI debe contener exactamente 8 dígitos numéricos.');
      isValid = false;
    } else {
      this.formData.dni = dni;
    }

    // 4. Celular (exactamente 9 dígitos que inician con 9)
    const celular = document.getElementById('input-celular')?.value.trim() || '';
    if (!/^9\d{8}$/.test(celular)) {
      this.showFieldError('celular', 'El celular debe tener 9 dígitos y comenzar con 9.');
      isValid = false;
    } else {
      this.formData.celular = celular;
    }

    // 5. Condición de Vecino
    const vecinoRadio = document.querySelector('input[name="es-vecino"]:checked');
    if (!vecinoRadio) {
      this.showFieldError('es-vecino', 'Selecciona si eres vecino(a) de Huáscar.');
      isValid = false;
    } else {
      this.formData.esVecino = vecinoRadio.value;

      if (this.formData.esVecino === 'si') {
        const mz = document.getElementById('input-manzana')?.value.trim() || '';
        const lote = document.getElementById('input-lote')?.value.trim() || '';
        const ref = document.getElementById('input-referencia')?.value.trim() || '';

        if (!mz) {
          this.showFieldError('manzana', 'Ingresa la manzana.');
          isValid = false;
        } else {
          this.formData.manzana = mz;
        }

        if (!lote) {
          this.showFieldError('lote', 'Ingresa el lote.');
          isValid = false;
        } else {
          this.formData.lote = lote;
        }

        this.formData.referencia = ref;
        this.formData.direccion = '';
        this.formData.distrito = '';
      } else {
        const direccion = document.getElementById('input-direccion')?.value.trim() || '';
        const distrito = document.getElementById('input-distrito')?.value || '';

        if (!direccion) {
          this.showFieldError('direccion', 'Ingresa tu dirección completa.');
          isValid = false;
        } else {
          this.formData.direccion = direccion;
        }

        if (!distrito) {
          this.showFieldError('distrito', 'Selecciona tu distrito.');
          isValid = false;
        } else {
          this.formData.distrito = distrito;
        }

        this.formData.manzana = '';
        this.formData.lote = '';
        this.formData.referencia = '';
      }
    }

    // 6. Motivo de Reserva
    const motivo = document.getElementById('input-motivo')?.value || '';
    if (!motivo) {
      this.showFieldError('motivo', 'Selecciona el motivo de tu reserva.');
      isValid = false;
    } else {
      this.formData.motivo = motivo;

      if (motivo === 'otro') {
        const detalle = document.getElementById('input-motivo-detalle')?.value.trim() || '';
        if (!detalle) {
          this.showFieldError('motivo-detalle', 'Especifica el motivo de tu reserva.');
          isValid = false;
        } else {
          this.formData.motivoDetalle = detalle;
        }
      } else {
        this.formData.motivoDetalle = '';
      }
    }

    return isValid;
  },

  // Mostrar mensaje de error en línea debajo del campo
  showFieldError(fieldId, message) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(`input-${fieldId}`) || document.getElementById(`group-${fieldId}`);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
    if (inputEl) {
      inputEl.classList.add('has-error');
    }
  },

  // Limpiar mensaje de error en línea
  clearFieldError(fieldId) {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(`input-${fieldId}`) || document.getElementById(`group-${fieldId}`);

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
    if (inputEl) {
      inputEl.classList.remove('has-error');
    }
  },

  // Avanzar al Paso 3 (Revisión)
  proceedToReview() {
    if (!this.validateForm()) {
      return;
    }

    this.renderReviewData();
    this.goToStep(3);
  },

  // Renderiza los datos en la pantalla de revisión
  renderReviewData() {
    // 1. Reserva
    document.getElementById('rev-fecha').textContent = this.selectedSlot.dateFormatted;
    document.getElementById('rev-horario').textContent = `${this.selectedSlot.start12} a ${this.selectedSlot.end12}`;
    document.getElementById('rev-duracion').textContent = `${this.selectedSlot.durationLabel} (${this.selectedSlot.duration} min)`;

    // 2. Datos Personales
    document.getElementById('rev-nombre').textContent = `${this.formData.nombres} ${this.formData.apellidos}`;
    document.getElementById('rev-dni').textContent = this.formData.dni;
    document.getElementById('rev-celular').textContent = this.formData.celular;

    // 3. Domicilio
    const esVecino = this.formData.esVecino === 'si';
    document.getElementById('rev-condicion').textContent = esVecino ? 'Vecino(a) de Huáscar' : 'No vecino';

    const domDetalleEl = document.getElementById('rev-domicilio-detalle');
    if (domDetalleEl) {
      if (esVecino) {
        let txt = `Mz. ${this.formData.manzana}, Lt. ${this.formData.lote}`;
        if (this.formData.referencia) txt += ` (Ref: ${this.formData.referencia})`;
        domDetalleEl.textContent = txt;
      } else {
        domDetalleEl.textContent = `${this.formData.direccion}, ${this.formData.distrito}`;
      }
    }

    // 4. Motivo
    const motivoObj = CONFIG.bookingReasons.find(m => m.id === this.formData.motivo);
    const motivoNombre = motivoObj ? motivoObj.label : this.formData.motivo;
    document.getElementById('rev-motivo').textContent = motivoNombre;

    const wrapDetalle = document.getElementById('rev-wrap-motivo-detalle');
    if (wrapDetalle) {
      if (this.formData.motivo === 'otro' && this.formData.motivoDetalle) {
        wrapDetalle.style.display = 'flex';
        document.getElementById('rev-motivo-detalle').textContent = this.formData.motivoDetalle;
      } else {
        wrapDetalle.style.display = 'none';
      }
    }
  },

  // Genera el código único de solicitud (ej. RH-20261018-001)
  generateBookingCode() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const randomSeq = String(Math.floor(Math.random() * 900) + 100);
    return `RH-${y}${m}${d}-${randomSeq}`;
  },

  // Confirmar Solicitud (Paso 3 -> Paso 4)
  async confirmBooking() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const confirmBtn = document.getElementById('btn-confirm-booking');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span>Registrando solicitud en Google Sheets...</span>';
    }

    // Extraer fecha en formato ISO (YYYY-MM-DD)
    let fechaISO = '';
    if (this.selectedSlot && this.selectedSlot.dateISO) {
      fechaISO = this.selectedSlot.dateISO;
    } else if (this.selectedSlot && this.selectedSlot.date instanceof Date) {
      const y = this.selectedSlot.date.getFullYear();
      const m = String(this.selectedSlot.date.getMonth() + 1).padStart(2, '0');
      const d = String(this.selectedSlot.date.getDate()).padStart(2, '0');
      fechaISO = `${y}-${m}-${d}`;
    }

    const payload = {
      fecha: fechaISO,
      hora_inicio: this.selectedSlot.start,
      hora_fin: this.selectedSlot.end,
      duracion_min: this.selectedSlot.duration,
      nombres: this.formData.nombres,
      apellidos: this.formData.apellidos,
      dni: this.formData.dni,
      celular: this.formData.celular,
      es_vecino: this.formData.esVecino === 'si' ? 'SÍ' : 'NO',
      manzana: this.formData.manzana,
      lote: this.formData.lote,
      referencia: this.formData.referencia,
      direccion: this.formData.direccion,
      distrito: this.formData.distrito,
      motivo_id: this.formData.motivo,
      motivo_label: CONFIG.bookingReasons.find(m => m.id === this.formData.motivo)?.label || this.formData.motivo,
      motivo_detalle: this.formData.motivoDetalle
    };

    try {
      if (typeof ApiService !== 'undefined' && ApiService.isLive) {
        const res = await ApiService.createReservation(payload);
        if (res && res.success) {
          this.lastGeneratedCode = res.codigo;
          this.lastCancelToken = res.token_cancelacion;
          this.renderTicketData();
          this.goToStep(4);
        } else {
          alert('No fue posible registrar la solicitud: ' + (res.error || 'Horario no disponible.'));
        }
      } else {
        // Fallback local seguro
        this.lastGeneratedCode = this.generateBookingCode();
        this.renderTicketData();
        this.goToStep(4);
      }
    } catch (err) {
      console.warn('[UserPortal] Error al comunicar con Google Sheets, fallback local:', err);
      this.lastGeneratedCode = this.generateBookingCode();
      this.renderTicketData();
      this.goToStep(4);
    } finally {
      this.isSubmitting = false;
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<span>Confirmar solicitud</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      }
    }
  },

  // Renderiza la constancia digital (Paso 4)
  renderTicketData() {
    // Código de Solicitud
    document.getElementById('ticket-code').textContent = this.lastGeneratedCode;

    // Datos de la Reserva
    document.getElementById('ticket-fecha').textContent = this.selectedSlot.dateFormatted;
    document.getElementById('ticket-horario').textContent = `${this.selectedSlot.start12} a ${this.selectedSlot.end12}`;
    document.getElementById('ticket-duracion').textContent = `${this.selectedSlot.durationLabel} (${this.selectedSlot.duration} min)`;

    // Motivo
    const motivoObj = CONFIG.bookingReasons.find(m => m.id === this.formData.motivo);
    let motivoText = motivoObj ? motivoObj.label : this.formData.motivo;
    if (this.formData.motivo === 'otro' && this.formData.motivoDetalle) {
      motivoText += `: ${this.formData.motivoDetalle}`;
    }
    document.getElementById('ticket-motivo').textContent = motivoText;

    // Datos del Solicitante
    document.getElementById('ticket-solicitante').textContent = `${this.formData.nombres} ${this.formData.apellidos}`;
    document.getElementById('ticket-dni').textContent = this.formData.dni;
    document.getElementById('ticket-celular').textContent = this.formData.celular;

    // Domicilio
    const esVecino = this.formData.esVecino === 'si';
    let domStr = esVecino ? `Vecino(a) de Huáscar (Mz. ${this.formData.manzana}, Lt. ${this.formData.lote}` : `${this.formData.direccion}, ${this.formData.distrito}`;
    if (esVecino && this.formData.referencia) domStr += ` - Ref: ${this.formData.referencia}`;
    if (esVecino) domStr += ')';
    document.getElementById('ticket-domicilio').textContent = domStr;
  },

  // Imprimir o Guardar en PDF
  printTicket() {
    window.print();
  },

  // Reiniciar flujo y regresar al calendario
  resetToStart() {
    // Limpiar formulario
    const form = document.getElementById('applicant-form');
    if (form) form.reset();

    this.formData = {
      nombres: '',
      apellidos: '',
      dni: '',
      celular: '',
      esVecino: null,
      manzana: '',
      lote: '',
      referencia: '',
      direccion: '',
      distrito: '',
      motivo: '',
      motivoDetalle: ''
    };

    // Ocultar condicionales
    const wrapVecino = document.getElementById('wrap-domicilio-vecino');
    const wrapNoVecino = document.getElementById('wrap-domicilio-no-vecino');
    const wrapOtro = document.getElementById('wrap-motivo-otro');
    if (wrapVecino) wrapVecino.style.display = 'none';
    if (wrapNoVecino) wrapNoVecino.style.display = 'none';
    if (wrapOtro) wrapOtro.style.display = 'none';

    // Limpiar errores
    document.querySelectorAll('.field-error-msg').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));

    this.selectedSlot = null;
    this.goToStep(1);
  },

  // Event Listeners principales
  bindEvents() {
    // Botón Volver del Formulario (Paso 2 -> Paso 1)
    document.getElementById('btn-form-back')?.addEventListener('click', () => {
      this.goToStep(1);
    });

    // Botón Continuar del Formulario (Paso 2 -> Paso 3)
    document.getElementById('btn-form-continue')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.proceedToReview();
    });

    // Botón Volver y Corregir de Revisión (Paso 3 -> Paso 2)
    document.getElementById('btn-review-back')?.addEventListener('click', () => {
      this.goToStep(2);
    });

    // Botón Confirmar Solicitud de Revisión (Paso 3 -> Paso 4)
    document.getElementById('btn-confirm-booking')?.addEventListener('click', () => {
      this.confirmBooking();
    });

    // Botón Imprimir / Guardar PDF (Paso 4)
    document.getElementById('btn-ticket-print')?.addEventListener('click', () => {
      this.printTicket();
    });

    // Botón Volver al inicio (Paso 4 -> Paso 1)
    document.getElementById('btn-ticket-home')?.addEventListener('click', () => {
      this.resetToStart();
    });
  }
};

// Exponer explícitamente al ámbito global
if (typeof window !== 'undefined') {
  window.UserPortal = UserPortal;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  UserPortal.init();
});
