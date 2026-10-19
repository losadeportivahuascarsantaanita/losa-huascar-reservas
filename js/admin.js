/**
 * Controlador Principal del Panel del Administrador (Etapa 3)
 * Losa Deportiva Huáscar – Santa Anita
 */

const AdminController = {
  currentView: 'requests', // 'requests' | 'calendar' | 'block' | 'history'
  selectedRequestId: 'RH-20261020-001',
  
  // Paginación y Filtros
  currentPage: 1,
  rowsPerPage: 10,
  filters: {
    date: '',
    status: 'all',
    search: ''
  },

  // Solicitud en proceso de acción modal
  pendingAction: {
    type: null, // 'approve' | 'reject' | 'cancel' | 'whatsapp'
    requestId: null
  },

  isDashboardStarted: false,

  init() {
    this.bindAuth();
    if (!this.checkAuth()) {
      return;
    }
    this.startDashboard();
  },

  /* ==========================================================================
     0. AUTENTICACIÓN Y CONTROL DE ACCESO
     ========================================================================== */
  checkAuth() {
    const isAuth = sessionStorage.getItem('huascar_admin_session') === 'active';
    const loginScreen = document.getElementById('admin-login-screen');
    const layoutContainer = document.getElementById('admin-layout-container');
    const mobileTopBar = document.getElementById('mobile-top-bar');

    if (isAuth) {
      if (loginScreen) loginScreen.classList.add('is-hidden');
      if (layoutContainer) layoutContainer.style.display = 'flex';
      if (mobileTopBar && window.innerWidth <= 1024) {
        mobileTopBar.style.display = 'flex';
      }
      return true;
    } else {
      if (loginScreen) loginScreen.classList.remove('is-hidden');
      if (layoutContainer) layoutContainer.style.display = 'none';
      if (mobileTopBar) mobileTopBar.style.display = 'none';
      return false;
    }
  },

  bindAuth() {
    const loginForm = document.getElementById('form-admin-login');
    const passInput = document.getElementById('input-admin-pass');
    const errorMsg = document.getElementById('login-error-msg');
    const togglePassBtn = document.getElementById('btn-toggle-pass');

    // Alternar visualización de contraseña
    if (togglePassBtn && passInput) {
      togglePassBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.textContent = isPass ? 'Ocultar' : 'Mostrar';
      });
    }

    // Procesar inicio de sesión
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = document.getElementById('input-admin-user');
        const enteredUser = userInput ? userInput.value.trim() : 'admin';
        const enteredPass = passInput ? passInput.value.trim() : '';
        const submitBtn = loginForm.querySelector('.btn-submit-login');

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Verificando credenciales...</span>';
        }

        try {
          // 1. Validar en vivo con Google Apps Script
          if (typeof ApiService !== 'undefined' && ApiService.isLive) {
            const res = await ApiService.adminLogin(enteredUser, enteredPass);
            if (res && res.success) {
              sessionStorage.setItem('huascar_admin_session', 'active');
              sessionStorage.setItem('huascar_admin_token', res.token);
              sessionStorage.setItem('huascar_admin_user', JSON.stringify({
                usuario: res.usuario,
                nombre: res.nombre,
                rol: res.rol
              }));
              if (errorMsg) errorMsg.style.display = 'none';
              this.checkAuth();
              this.startDashboard();
              return;
            } else {
              if (errorMsg) {
                errorMsg.textContent = res?.error || 'Contraseña incorrecta. Por favor, verifica e inténtalo nuevamente.';
                errorMsg.style.display = 'block';
              }
              if (passInput) {
                passInput.focus();
                passInput.select();
              }
              return;
            }
          }
        } catch (err) {
          console.warn('[Admin] Fallback a verificación local:', err);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Ingresar al Panel</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
          }
        }

        if (errorMsg) {
          errorMsg.textContent = 'Credenciales no autorizadas o error de conexión con el servidor.';
          errorMsg.style.display = 'block';
        }
        if (passInput) {
          passInput.focus();
          passInput.select();
        }
      });
    }

    // Manejador de cierre de sesión
    const handleLogout = async () => {
      const token = sessionStorage.getItem('huascar_admin_token');
      if (token && typeof ApiService !== 'undefined' && ApiService.isLive) {
        try {
          await ApiService.adminLogout(token);
        } catch (e) {
          console.warn('Error revocando sesión en servidor:', e);
        }
      }
      sessionStorage.removeItem('huascar_admin_session');
      sessionStorage.removeItem('huascar_admin_token');
      sessionStorage.removeItem('huascar_admin_user');
      if (passInput) passInput.value = '';
      if (errorMsg) errorMsg.style.display = 'none';

      // Cerrar drawer lateral o menú móvil si quedaron abiertos
      const sidebar = document.getElementById('admin-sidebar');
      const mobileBackdrop = document.getElementById('mobile-sidebar-backdrop');
      const drawer = document.getElementById('admin-drawer');
      const drawerBackdrop = document.getElementById('drawer-backdrop');
      if (sidebar) sidebar.classList.remove('sidebar-open');
      if (mobileBackdrop) mobileBackdrop.classList.remove('active');
      if (drawer) drawer.classList.remove('drawer-open');
      if (drawerBackdrop) drawerBackdrop.classList.remove('active');

      this.checkAuth();
    };

    const logoutSidebar = document.getElementById('btn-logout-sidebar');
    if (logoutSidebar) {
      logoutSidebar.addEventListener('click', handleLogout);
    }

    const logoutMobile = document.getElementById('btn-mobile-logout');
    if (logoutMobile) {
      logoutMobile.addEventListener('click', handleLogout);
    }
  },

  startDashboard() {
    if (this.isDashboardStarted) {
      // Re-renderizado de seguridad si ya fue iniciado previamente
      this.renderKPIs();
      this.updateActiveKPICard();
      this.renderRequestsTable();
      this.renderSelectedRequestDetail();
      return;
    }
    this.isDashboardStarted = true;

    this.bindNavigation();
    this.bindFilters();
    this.bindKPIClicks();
    this.bindModals();
    this.bindBlockModule();
    this.bindDrawerEvents();
    
    // Renderizado inicial
    this.renderKPIs();
    this.updateActiveKPICard();
    this.renderRequestsTable();
    this.renderSelectedRequestDetail();
    this.renderBlockList();
    this.renderHistoryTable();
    this.renderAdminCalendar();

    // Carga de datos sincronizados en vivo con Google Sheets
    this.loadLiveDashboardData();
  },

  async loadLiveDashboardData() {
    const token = sessionStorage.getItem('huascar_admin_token');
    if (!token || typeof ApiService === 'undefined' || !ApiService.isLive) return;

    try {
      // 1. Cargar solicitudes reales desde la hoja
      const res = await ApiService.adminGetRequests(token);
      if (res && res.success && Array.isArray(res.solicitudes)) {
        if (res.solicitudes.length > 0) {
          AdminData.requests = res.solicitudes;
          if (this.selectedRequestId && !AdminData.requests.some(r => r.id === this.selectedRequestId)) {
            this.selectedRequestId = AdminData.requests[0].id;
          }
        }
        this.renderKPIs();
        this.renderRequestsTable();
        this.renderSelectedRequestDetail();
        this.renderAdminCalendar();
      }

      // 2. Cargar bloqueos reales desde la hoja
      const resB = await ApiService.adminGetBlocks(token);
      if (resB && resB.success && Array.isArray(resB.bloqueos)) {
        if (resB.bloqueos.length > 0) {
          AdminData.blockedSlots = resB.bloqueos;
        }
        this.renderBlockList();
        this.renderAdminCalendar();
      }

      // 3. Cargar historial de auditoría desde la hoja
      const resH = await ApiService.adminGetHistory(token);
      if (resH && resH.success && Array.isArray(resH.historial)) {
        if (resH.historial.length > 0) {
          AdminData.auditHistory = resH.historial;
        }
        this.renderHistoryTable();
      }
    } catch (e) {
      console.warn('[Admin] Error sincronizando datos en vivo de Google Sheets:', e);
    }
  },

  /* ==========================================================================
     1. NAVEGACIÓN ENTRE VISTAS DEL MENÚ LATERAL
     ========================================================================== */
  bindNavigation() {
    const navButtons = document.querySelectorAll('.nav-item-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const viewTarget = btn.getAttribute('data-view');
        if (viewTarget) {
          this.switchView(viewTarget);
        }
      });
    });

    // Menú hamburguesa móvil
    const mobileToggle = document.getElementById('btn-mobile-sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const mobileBackdrop = document.getElementById('mobile-sidebar-backdrop');

    if (mobileToggle && sidebar && mobileBackdrop) {
      mobileToggle.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-open');
        mobileBackdrop.classList.toggle('active');
      });

      mobileBackdrop.addEventListener('click', () => {
        sidebar.classList.remove('sidebar-open');
        mobileBackdrop.classList.remove('active');
      });
    }
  },

  switchView(viewId) {
    this.currentView = viewId;

    // Actualizar botones de navegación
    document.querySelectorAll('.nav-item-btn').forEach(b => {
      if (b.getAttribute('data-view') === viewId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Actualizar paneles de contenido
    document.querySelectorAll('.admin-view-panel').forEach(panel => {
      if (panel.id === `view-${viewId}`) {
        panel.classList.add('active-view');
      } else {
        panel.classList.remove('active-view');
      }
    });

    // Si la vista no es solicitudes, ocultar el panel de detalles para aprovechar todo el ancho
    const drawer = document.getElementById('admin-drawer');
    if (drawer) {
      if (viewId !== 'requests') {
        drawer.style.display = 'none';
      } else {
        drawer.style.display = '';
      }
    }

    // Si entra a calendario o historial, refrescar datos
    if (viewId === 'calendar') this.renderAdminCalendar();
    if (viewId === 'history') this.renderHistoryTable();
    if (viewId === 'block') this.renderBlockList();

    // En móvil, cerrar sidebar tras seleccionar
    document.getElementById('admin-sidebar')?.classList.remove('sidebar-open');
    document.getElementById('mobile-sidebar-backdrop')?.classList.remove('active');
  },

  /* ==========================================================================
     2. GESTIÓN DE KPIS (INDICADORES DE RESUMEN)
     ========================================================================== */
  renderKPIs() {
    const all = AdminData.requests;
    const total = all.length;
    const pending = all.filter(r => r.status === 'pendiente').length;
    const approved = all.filter(r => r.status === 'aprobada').length;
    const rejected = all.filter(r => r.status === 'rechazada').length;
    const cancelled = all.filter(r => r.status === 'cancelada').length;

    const elTotal = document.getElementById('kpi-total-num');
    const elPending = document.getElementById('kpi-pending-num');
    const elApproved = document.getElementById('kpi-approved-num');
    const elRejected = document.getElementById('kpi-rejected-num');
    const elCancelled = document.getElementById('kpi-cancelled-num');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elApproved) elApproved.textContent = approved;
    if (elRejected) elRejected.textContent = rejected;
    if (elCancelled) elCancelled.textContent = cancelled;
  },

  /* ==========================================================================
     3. FILTROS Y BÚSQUEDA
     ========================================================================== */
  bindFilters() {
    const dateInput = document.getElementById('filter-date');
    const statusSelect = document.getElementById('filter-status');
    const searchInput = document.getElementById('filter-search');
    const clearBtn = document.getElementById('btn-clear-filters');

    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        this.filters.date = e.target.value;
        this.currentPage = 1;
        this.renderRequestsTable();
      });
    }

    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.currentPage = 1;
        this.updateActiveKPICard();
        this.renderRequestsTable();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value.trim().toLowerCase();
        this.currentPage = 1;
        this.renderRequestsTable();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.filters.date = '';
        this.filters.status = 'all';
        this.filters.search = '';
        if (dateInput) dateInput.value = '';
        if (statusSelect) statusSelect.value = 'all';
        if (searchInput) searchInput.value = '';
        this.currentPage = 1;
        this.updateActiveKPICard();
        this.renderRequestsTable();
      });
    }

    // Selector de filas por página
    const rowsPerPageSelect = document.getElementById('select-rows-per-page');
    if (rowsPerPageSelect) {
      rowsPerPageSelect.addEventListener('change', (e) => {
        this.rowsPerPage = parseInt(e.target.value, 10) || 10;
        this.currentPage = 1;
        this.renderRequestsTable();
      });
    }
  },

  /* ==========================================================================
     INTERACCIÓN CON TARJETAS KPI (FILTRADO DIRECTO AL HACER CLIC)
     ========================================================================== */
  bindKPIClicks() {
    const kpiCards = [
      { id: 'kpi-card-total', status: 'all' },
      { id: 'kpi-card-pending', status: 'pendiente' },
      { id: 'kpi-card-approved', status: 'aprobada' },
      { id: 'kpi-card-rejected', status: 'rechazada' },
      { id: 'kpi-card-cancelled', status: 'cancelada' }
    ];

    kpiCards.forEach(item => {
      const cardEl = document.getElementById(item.id);
      if (cardEl) {
        cardEl.addEventListener('click', () => {
          this.setStatusFilter(item.status);
        });

        cardEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.setStatusFilter(item.status);
          }
        });
      }
    });
  },

  setStatusFilter(statusValue) {
    this.filters.status = statusValue;
    const select = document.getElementById('filter-status');
    if (select) select.value = statusValue;
    this.currentPage = 1;
    this.updateActiveKPICard();
    this.renderRequestsTable();
  },

  updateActiveKPICard() {
    const current = this.filters.status;
    const map = {
      'all': 'kpi-card-total',
      'pendiente': 'kpi-card-pending',
      'aprobada': 'kpi-card-approved',
      'rechazada': 'kpi-card-rejected',
      'cancelada': 'kpi-card-cancelled'
    };

    document.querySelectorAll('.kpi-card').forEach(c => c.classList.remove('kpi-active-filter'));
    const activeId = map[current];
    if (activeId) {
      document.getElementById(activeId)?.classList.add('kpi-active-filter');
    }
  },

  getFilteredRequests() {
    return AdminData.requests.filter(req => {
      // Filtro por fecha
      if (this.filters.date && req.date !== this.filters.date) {
        return false;
      }
      // Filtro por estado
      if (this.filters.status !== 'all' && req.status !== this.filters.status) {
        return false;
      }
      // Filtro por texto (Código, Nombre, DNI, Actividad)
      if (this.filters.search) {
        const query = this.filters.search;
        const matchesId = req.id.toLowerCase().includes(query);
        const matchesName = req.applicant.fullName.toLowerCase().includes(query);
        const matchesDni = req.applicant.dni.includes(query);
        const matchesActivity = req.activity.toLowerCase().includes(query);
        if (!matchesId && !matchesName && !matchesDni && !matchesActivity) {
          return false;
        }
      }
      return true;
    });
  },

  /* ==========================================================================
     4. RENDERIZADO DE LA TABLA DE SOLICITUDES
     ========================================================================== */
  renderRequestsTable() {
    const tbody = document.getElementById('requests-table-body');
    if (!tbody) return;

    const filtered = this.getFilteredRequests();
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / this.rowsPerPage) || 1;

    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const pagedItems = filtered.slice(startIndex, startIndex + this.rowsPerPage);

    if (pagedItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px 16px; color: var(--admin-text-muted);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="margin-bottom: 8px; opacity: 0.6;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <p style="font-weight: 700;">No se encontraron solicitudes con los filtros seleccionados.</p>
            <p style="font-size: 0.8rem; margin-top: 4px;">Prueba limpiando los filtros o cambiando el término de búsqueda.</p>
          </td>
        </tr>
      `;
      this.renderPagination(totalItems, 0, 0, totalPages);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    tbody.innerHTML = pagedItems.map(req => {
      const isSelected = req.id === this.selectedRequestId;
      const isToday = req.date === todayStr;

      // Status Badge
      let statusBadge = '';
      if (req.status === 'pendiente') {
        statusBadge = '<span class="status-pill status-pendiente">⏳ Pendiente</span>';
      } else if (req.status === 'aprobada') {
        statusBadge = '<span class="status-pill status-aprobada">✓ Aprobada</span>';
      } else if (req.status === 'rechazada') {
        statusBadge = '<span class="status-pill status-rechazada">✕ Rechazada</span>';
      } else if (req.status === 'cancelada') {
        statusBadge = '<span class="status-pill status-cancelada">⃠ Cancelada</span>';
      }

      // Acciones rápidas según estado
      const isPending = req.status === 'pendiente';
      const isApproved = req.status === 'aprobada';

      return `
        <tr class="table-row-request ${isSelected ? 'is-selected' : ''}" data-id="${req.id}">
          <td class="cell-code">${req.id}</td>
          <td>
            <div class="cell-date-main">${this.formatDisplayDate(req.date)}</div>
            ${isToday ? '<span class="cell-date-sub">(Hoy)</span>' : ''}
          </td>
          <td>
            <div class="cell-time-main">${req.timeFormatted}</div>
            <div class="cell-time-sub">(${req.durationMinutes} min)</div>
          </td>
          <td>
            <div class="applicant-info-block">
              <span class="applicant-name">${req.applicant.fullName}</span>
              <span class="applicant-meta">DNI: ${req.applicant.dni} · Cel: ${req.applicant.phone}</span>
            </div>
          </td>
          <td>
            <span class="activity-tag">${req.activity}${req.activityDetail ? ` (${req.activityDetail})` : ''}</span>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <div class="actions-cell-group" onclick="event.stopPropagation()">
              <button type="button" class="btn-action-icon btn-view-row" title="Ver detalle de la solicitud" onclick="AdminController.selectRequest('${req.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>

              ${isPending ? `
                <button type="button" class="btn-action-icon btn-approve-row" title="Aprobar solicitud" onclick="AdminController.openActionModal('approve', '${req.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </button>
                <button type="button" class="btn-action-icon btn-reject-row" title="Rechazar solicitud" onclick="AdminController.openActionModal('reject', '${req.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              ` : ''}

              ${(isPending || isApproved) ? `
                <div class="dropdown-menu-wrapper">
                  <button type="button" class="btn-action-icon btn-more-row" title="Más opciones" onclick="AdminController.toggleRowMenu(event, '${req.id}')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                  </button>
                  <div class="dropdown-popover" id="popover-${req.id}">
                    <button type="button" class="dropdown-action-btn danger-action" onclick="AdminController.openActionModal('cancel', '${req.id}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                      <span>Cancelar solicitud</span>
                    </button>
                  </div>
                </div>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Click en fila para ver detalle
    tbody.querySelectorAll('.table-row-request').forEach(row => {
      row.addEventListener('click', () => {
        const reqId = row.getAttribute('data-id');
        if (reqId) this.selectRequest(reqId);
      });
    });

    const displayStart = totalItems === 0 ? 0 : startIndex + 1;
    const displayEnd = Math.min(startIndex + this.rowsPerPage, totalItems);
    this.renderPagination(totalItems, displayStart, displayEnd, totalPages);
  },

  formatDisplayDate(isoDateStr) {
    if (!isoDateStr) return '--';
    const [y, m, d] = isoDateStr.split('-');
    return `${d}/${m}/${y}`;
  },

  toggleRowMenu(event, reqId) {
    event.stopPropagation();
    document.querySelectorAll('.dropdown-popover').forEach(p => {
      if (p.id !== `popover-${reqId}`) p.classList.remove('active');
    });
    const pop = document.getElementById(`popover-${reqId}`);
    if (pop) pop.classList.toggle('active');
  },

  renderPagination(totalItems, start, end, totalPages) {
    const infoEl = document.getElementById('pagination-info');
    const buttonsEl = document.getElementById('pagination-buttons');

    if (infoEl) {
      infoEl.textContent = totalItems === 0
        ? 'Mostrando 0 de 0 solicitudes'
        : `Mostrando ${start} a ${end} de ${totalItems} solicitudes`;
    }

    if (buttonsEl) {
      let btnsHtml = `
        <button type="button" class="page-btn" ${this.currentPage <= 1 ? 'disabled' : ''} onclick="AdminController.goToPage(${this.currentPage - 1})">
          ‹
        </button>
      `;

      for (let p = 1; p <= totalPages; p++) {
        btnsHtml += `
          <button type="button" class="page-btn ${p === this.currentPage ? 'active' : ''}" onclick="AdminController.goToPage(${p})">
            ${p}
          </button>
        `;
      }

      btnsHtml += `
        <button type="button" class="page-btn" ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="AdminController.goToPage(${this.currentPage + 1})">
          ›
        </button>
      `;

      buttonsEl.innerHTML = btnsHtml;
    }
  },

  goToPage(pageNum) {
    this.currentPage = pageNum;
    this.renderRequestsTable();
  },

  /* ==========================================================================
     5. PANEL LATERAL DERECHO (DRAWER DE DETALLES)
     ========================================================================== */
  bindDrawerEvents() {
    const closeBtn = document.getElementById('btn-close-drawer');
    const backdrop = document.getElementById('drawer-backdrop');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDrawer());
    }
    if (backdrop) {
      backdrop.addEventListener('click', () => this.closeDrawer());
    }

    // Cerrar menús contextuales al hacer clic en cualquier lugar fuera
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-popover').forEach(p => p.classList.remove('active'));
    });
  },

  closeDrawer() {
    const drawer = document.getElementById('admin-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) {
      drawer.classList.remove('drawer-open');
      drawer.classList.add('drawer-closed');
    }
    if (backdrop) backdrop.classList.remove('active');
  },

  openDrawer() {
    const drawer = document.getElementById('admin-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) {
      drawer.classList.remove('drawer-closed');
      drawer.classList.add('drawer-open');
    }
    if (backdrop && window.innerWidth < 1360) {
      backdrop.classList.add('active');
    }
  },

  selectRequest(requestId) {
    this.selectedRequestId = requestId;

    // Resaltar fila en la tabla
    document.querySelectorAll('.table-row-request').forEach(row => {
      if (row.getAttribute('data-id') === requestId) {
        row.classList.add('is-selected');
      } else {
        row.classList.remove('is-selected');
      }
    });

    this.renderSelectedRequestDetail();
    this.openDrawer();
  },

  renderSelectedRequestDetail() {
    const req = AdminData.requests.find(r => r.id === this.selectedRequestId);
    if (!req) return;

    // 1. Estado y Banner de Recepción
    const statusBanner = document.getElementById('drawer-status-banner');
    if (statusBanner) {
      statusBanner.className = `drawer-status-banner status-${req.status}`;
      let statusText = '';
      if (req.status === 'pendiente') statusText = `⏳ <strong>Pendiente de aprobación</strong><br><span style="font-size: 0.76rem; opacity: 0.85;">Recibida el ${req.receivedAt}</span>`;
      else if (req.status === 'aprobada') statusText = `✓ <strong>Solicitud Aprobada</strong><br><span style="font-size: 0.76rem; opacity: 0.85;">Aprobada para su ejecución en fecha</span>`;
      else if (req.status === 'rechazada') statusText = `✕ <strong>Solicitud Rechazada</strong><br><span style="font-size: 0.76rem; opacity: 0.85;">${req.resolutionNote || 'No admitida'}</span>`;
      else if (req.status === 'cancelada') statusText = `⃠ <strong>Solicitud Cancelada</strong><br><span style="font-size: 0.76rem; opacity: 0.85;">${req.resolutionNote || 'Cancelada definitivamente'}</span>`;
      statusBanner.innerHTML = statusText;
    }

    // 2. Código de solicitud
    const codeEl = document.getElementById('drawer-code-val');
    if (codeEl) codeEl.textContent = req.id;

    // 3. Solicitante
    const nameEl = document.getElementById('drawer-solicitante-name');
    const dniEl = document.getElementById('drawer-solicitante-dni');
    const phoneEl = document.getElementById('drawer-solicitante-phone');
    if (nameEl) nameEl.textContent = req.applicant.fullName;
    if (dniEl) dniEl.textContent = `DNI: ${req.applicant.dni}`;
    if (phoneEl) phoneEl.textContent = `Celular: ${req.applicant.phone}`;

    // 4. Domicilio
    const domCondEl = document.getElementById('drawer-domicilio-cond');
    const domDetailEl = document.getElementById('drawer-domicilio-detail');
    if (domCondEl) {
      domCondEl.textContent = req.applicant.isNeighbor ? 'Sí, resido en Huáscar' : 'No, resido en otra zona';
    }
    if (domDetailEl) {
      if (req.applicant.isNeighbor) {
        let text = `Manzana: ${req.applicant.block} · Lote: ${req.applicant.lot}`;
        if (req.applicant.reference) text += `<br>Referencia: ${req.applicant.reference}`;
        domDetailEl.innerHTML = text;
      } else {
        domDetailEl.textContent = `${req.applicant.address}, ${req.applicant.district}`;
      }
    }

    // 5. Reserva
    const resDateEl = document.getElementById('drawer-reserva-date');
    const resTimeEl = document.getElementById('drawer-reserva-time');
    const resDurEl = document.getElementById('drawer-reserva-dur');
    if (resDateEl) resDateEl.textContent = `Fecha: ${req.dateFormatted}`;
    if (resTimeEl) resTimeEl.textContent = `Horario: ${req.timeFormatted}`;
    if (resDurEl) resDurEl.textContent = `Duración: ${req.durationLabel}`;

    // 6. Actividad
    const actEl = document.getElementById('drawer-actividad-val');
    if (actEl) {
      let actText = req.activity;
      if (req.activityDetail) actText += ` — ${req.activityDetail}`;
      actEl.textContent = actText;
    }

    // 7. Botones de Acción según estado
    const actionsContainer = document.getElementById('drawer-actions-container');
    if (actionsContainer) {
      if (req.status === 'pendiente') {
        actionsContainer.innerHTML = `
          <button type="button" class="btn-drawer-approve" onclick="AdminController.openActionModal('approve', '${req.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>Aprobar solicitud</span>
          </button>
          <button type="button" class="btn-drawer-reject" onclick="AdminController.openActionModal('reject', '${req.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            <span>Rechazar solicitud</span>
          </button>
          <button type="button" class="btn-drawer-cancel" onclick="AdminController.openActionModal('cancel', '${req.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            <span>Cancelar solicitud</span>
          </button>
        `;
      } else if (req.status === 'aprobada') {
        actionsContainer.innerHTML = `
          <button type="button" class="btn-drawer-whatsapp" onclick="AdminController.openWhatsAppModal('${req.id}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/></svg>
            <span>Comunicar por WhatsApp</span>
          </button>
          <button type="button" class="btn-drawer-cancel" onclick="AdminController.openActionModal('cancel', '${req.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            <span>Cancelar solicitud</span>
          </button>
        `;
      } else {
        // Rechazada o Cancelada (Acción definitiva)
        actionsContainer.innerHTML = `
          <div class="banner-definitive-state">
            🔒 Solicitud con resolución definitiva (${req.status.toUpperCase()}).<br>No admite cambios de estado adicionales.
          </div>
          <button type="button" class="btn-drawer-whatsapp" onclick="AdminController.openWhatsAppModal('${req.id}')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z"/></svg>
            <span>Ver mensaje de WhatsApp enviado</span>
          </button>
        `;
      }
    }
  },

  /* ==========================================================================
     6. MODALES DE CONFIRMACIÓN (APROBAR / RECHAZAR / CANCELAR)
     ========================================================================== */
  bindModals() {
    // Cerrar modales
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    // Cerrar al hacer clic en el backdrop
    document.querySelectorAll('.admin-modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeAllModals();
      });
    });

    // Confirmar Aprobación
    document.getElementById('btn-confirm-approve')?.addEventListener('click', () => {
      this.executeAction('aprobada');
    });

    // Confirmar Rechazo
    document.getElementById('btn-confirm-reject')?.addEventListener('click', () => {
      const reason = document.getElementById('input-reject-reason')?.value.trim() || 'No cumple con los requisitos del turno.';
      this.executeAction('rechazada', reason);
    });

    // Confirmar Cancelación
    document.getElementById('btn-confirm-cancel')?.addEventListener('click', () => {
      const reason = document.getElementById('input-cancel-reason')?.value.trim() || 'Cancelado por solicitud del usuario o disposición administrativa.';
      this.executeAction('cancelada', reason);
    });
  },

  closeAllModals() {
    document.querySelectorAll('.admin-modal-backdrop').forEach(m => m.classList.remove('active'));
    this.pendingAction = { type: null, requestId: null };
  },

  openActionModal(type, reqId) {
    this.pendingAction = { type, requestId: reqId };
    const req = AdminData.requests.find(r => r.id === reqId);
    if (!req) return;

    if (type === 'approve') {
      const modal = document.getElementById('modal-approve-confirm');
      document.getElementById('approve-modal-code').textContent = req.id;
      document.getElementById('approve-modal-date').textContent = req.dateFormatted;
      document.getElementById('approve-modal-time').textContent = req.timeFormatted;
      document.getElementById('approve-modal-name').textContent = req.applicant.fullName;
      if (modal) modal.classList.add('active');
    } else if (type === 'reject') {
      const modal = document.getElementById('modal-reject-confirm');
      document.getElementById('reject-modal-code').textContent = req.id;
      document.getElementById('reject-modal-date').textContent = req.dateFormatted;
      document.getElementById('reject-modal-time').textContent = req.timeFormatted;
      const reasonInput = document.getElementById('input-reject-reason');
      if (reasonInput) reasonInput.value = '';
      if (modal) modal.classList.add('active');
    } else if (type === 'cancel') {
      const modal = document.getElementById('modal-cancel-confirm');
      document.getElementById('cancel-modal-code').textContent = req.id;
      document.getElementById('cancel-modal-date').textContent = req.dateFormatted;
      document.getElementById('cancel-modal-time').textContent = req.timeFormatted;
      const reasonInput = document.getElementById('input-cancel-reason');
      if (reasonInput) reasonInput.value = '';
      if (modal) modal.classList.add('active');
    }
  },

  async executeAction(newStatus, reason = '') {
    const reqId = this.pendingAction.requestId;
    const req = AdminData.requests.find(r => r.id === reqId);
    if (!req) return;

    const prevStatus = req.status;
    const token = sessionStorage.getItem('huascar_admin_token');

    // Sincronizar en Google Apps Script
    if (token && typeof ApiService !== 'undefined' && ApiService.isLive) {
      try {
        const res = await ApiService.adminUpdateStatus(token, reqId, newStatus, reason);
        if (!res || !res.success) {
          alert('Error al actualizar en Google Sheets: ' + (res?.error || 'No se pudo actualizar el estado.'));
          return;
        }
      } catch (err) {
        console.warn('[Admin] Error comunicando actualización a Google Sheets:', err);
      }
    }

    req.status = newStatus;
    if (reason) req.resolutionNote = reason;

    // Registrar en Historial de Auditoría
    const now = new Date();
    const timeStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} – ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
    
    let actionLabel = 'Actualización de solicitud';
    if (newStatus === 'aprobada') actionLabel = 'Aprobación de solicitud';
    else if (newStatus === 'rechazada') actionLabel = 'Rechazo de solicitud';
    else if (newStatus === 'cancelada') actionLabel = 'Cancelación de reserva';

    AdminData.auditHistory.unshift({
      id: `AUD-${String(AdminData.auditHistory.length + 1).padStart(3, '0')}`,
      timestamp: timeStr,
      action: actionLabel,
      targetId: req.id,
      prevStatus: prevStatus,
      newStatus: newStatus,
      adminUser: 'Administrador Huáscar',
      notes: reason || `Solicitud marcada como ${newStatus}.`
    });

    // Actualizar UI
    this.closeAllModals();
    this.renderKPIs();
    this.renderRequestsTable();
    this.renderSelectedRequestDetail();
    this.renderHistoryTable();
    this.renderAdminCalendar();

    // Abrir automáticamente la vista previa de WhatsApp con el mensaje predefinido
    setTimeout(() => {
      this.openWhatsAppModal(req.id);
    }, 250);
  },

  /* ==========================================================================
     7. COMUNICACIÓN POR WHATSAPP (MODELOS EXACTOS)
     ========================================================================== */
  buildWhatsAppMessage(req) {
    const nombre = req.applicant.names;
    const codigo = req.id;
    const fecha = req.dateFormatted;
    const horario = req.timeFormatted;
    const actividad = req.activity + (req.activityDetail ? ` (${req.activityDetail})` : '');
    const motivo = req.resolutionNote || 'Disponibilidad comunitaria';

    if (req.status === 'aprobada') {
      return `¡Hola, *${nombre}*! 👋

Te informamos que tu solicitud de reserva en la *Losa Deportiva Huáscar – Santa Anita* ha sido *APROBADA* ✅.

📋 *Detalles de tu reserva:*
• *Código:* ${codigo}
• *Fecha:* ${fecha}
• *Horario:* ${horario}
• *Actividad:* ${actividad}

📍 *Lugar:* Losa Deportiva Huáscar – Santa Anita

Por favor, llega 10 minutos antes y respeta las normas de convivencia comunitaria. ¡Que disfrutes tu turno deportivo! ⚽🏐🏀`;
    } else if (req.status === 'rechazada') {
      return `¡Hola, *${nombre}*! 👋

Te comunicamos que tu solicitud de reserva *${codigo}* en la *Losa Deportiva Huáscar – Santa Anita* no ha podido ser aprobada (*RECHAZADA*) ❌.

📋 *Detalles de la solicitud:*
• *Fecha:* ${fecha}
• *Horario:* ${horario}
• *Motivo:* ${motivo}

Te invitamos a ingresar nuevamente a nuestro portal para elegir otro horario o fecha disponible. ¡Agradecemos tu comprensión!`;
    } else if (req.status === 'cancelada') {
      return `¡Hola, *${nombre}*! 👋

Te informamos que la reserva *${codigo}* en la *Losa Deportiva Huáscar – Santa Anita* ha sido *CANCELADA* 🚫.

📋 *Detalles:*
• *Fecha:* ${fecha}
• *Horario:* ${horario}
• *Motivo de cancelación:* ${motivo}

Si tienes alguna consulta, puedes responder a este mensaje. Lamentamos los inconvenientes.`;
    }

    // Default informativo
    return `¡Hola, *${nombre}*! Te saludamos desde la *Losa Deportiva Huáscar – Santa Anita* en relación a tu solicitud *${codigo}*.`;
  },

  openWhatsAppModal(reqId) {
    const req = AdminData.requests.find(r => r.id === reqId);
    if (!req) return;

    const modal = document.getElementById('modal-whatsapp-preview');
    if (!modal) return;

    const messageText = this.buildWhatsAppMessage(req);
    const waUrl = `https://wa.me/51${req.applicant.phone}?text=${encodeURIComponent(messageText)}`;

    document.getElementById('wa-preview-name').textContent = req.applicant.fullName;
    document.getElementById('wa-preview-phone').textContent = `+51 ${req.applicant.phone}`;
    document.getElementById('wa-preview-content').textContent = messageText;

    const sendBtn = document.getElementById('btn-send-whatsapp-link');
    if (sendBtn) {
      sendBtn.onclick = () => {
        window.open(waUrl, '_blank');
      };
    }

    modal.classList.add('active');
  },

  /* ==========================================================================
     8. MÓDULO DE BLOQUEO DE HORARIOS (CON VALIDACIÓN DE CONFLICTOS)
     ========================================================================== */
  bindBlockModule() {
    const form = document.getElementById('form-create-block');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateBlock();
    });
  },

  handleCreateBlock() {
    const dateInput = document.getElementById('block-date');
    const startSelect = document.getElementById('block-start');
    const endSelect = document.getElementById('block-end');
    const reasonInput = document.getElementById('block-reason');
    const alertBox = document.getElementById('block-alert-box');

    const dateVal = dateInput?.value;
    const startVal = startSelect?.value;
    const endVal = endSelect?.value;
    const reasonVal = reasonInput?.value.trim() || 'Mantenimiento preventivo';

    if (!dateVal || !startVal || !endVal) {
      if (alertBox) {
        alertBox.className = 'admin-alert-box admin-alert-warning';
        alertBox.innerHTML = '⚠️ Por favor completa la fecha y las horas de inicio y fin.';
        alertBox.style.display = 'block';
      }
      return;
    }

    const startMin = this.timeToMin(startVal);
    const endMin = this.timeToMin(endVal);

    if (startMin >= endMin) {
      if (alertBox) {
        alertBox.className = 'admin-alert-box admin-alert-warning';
        alertBox.innerHTML = '⚠️ La hora de término debe ser posterior a la hora de inicio.';
        alertBox.style.display = 'block';
      }
      return;
    }

    // VALIDACIÓN OBLIGATORIA: Comprobar conflicto con solicitudes pendientes o aprobadas
    const conflictingRequest = AdminData.requests.find(req => {
      if (req.date !== dateVal) return false;
      if (req.status !== 'pendiente' && req.status !== 'aprobada') return false;

      const reqStartMin = this.timeToMin(req.start);
      const reqEndMin = this.timeToMin(req.end);

      // Existe cruce si: startMin < reqEndMin && endMin > reqStartMin
      return (startMin < reqEndMin && endMin > reqStartMin);
    });

    if (conflictingRequest) {
      if (alertBox) {
        alertBox.className = 'admin-alert-box admin-alert-warning';
        alertBox.innerHTML = `
          <strong>🚫 Conflicto detectado:</strong><br>
          Existe la solicitud <strong>${conflictingRequest.id}</strong> (${conflictingRequest.status.toUpperCase()}) de <strong>${conflictingRequest.applicant.fullName}</strong> en el horario <strong>${conflictingRequest.timeFormatted}</strong>.<br>
          Debes resolver o cancelar primero esa solicitud antes de poder bloquear este intervalo.
        `;
        alertBox.style.display = 'block';
      }
      return;
    }

    // Crear bloqueo exitoso
    const newId = `BLK-${String(AdminData.blockedSlots.length + 1).padStart(3, '0')}`;
    const now = new Date();
    const createdStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} – ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;

    AdminData.blockedSlots.push({
      id: newId,
      date: dateVal,
      start: startVal,
      end: endVal,
      timeFormatted: `${this.formatTime12(startVal)} – ${this.formatTime12(endVal)}`,
      reason: reasonVal,
      createdBy: 'Administrador Huáscar',
      createdAt: createdStr
    });

    // Registrar en Historial
    AdminData.auditHistory.unshift({
      id: `AUD-${String(AdminData.auditHistory.length + 1).padStart(3, '0')}`,
      timestamp: createdStr,
      action: 'Bloqueo de horario',
      targetId: newId,
      prevStatus: 'disponible',
      newStatus: 'bloqueado',
      adminUser: 'Administrador Huáscar',
      notes: `${reasonVal} (${dateVal} de ${startVal} a ${endVal})`
    });

    if (alertBox) {
      alertBox.className = 'admin-alert-box admin-alert-success';
      alertBox.innerHTML = `✅ Intervalo bloqueado con éxito. Se inhabilitará en el portal público de reservas.`;
      alertBox.style.display = 'block';
    }

    if (reasonInput) reasonInput.value = '';
    this.renderBlockList();
    this.renderHistoryTable();
    this.renderAdminCalendar();
  },

  deleteBlock(blockId) {
    const idx = AdminData.blockedSlots.findIndex(b => b.id === blockId);
    if (idx !== -1) {
      const removed = AdminData.blockedSlots.splice(idx, 1)[0];
      const now = new Date();
      const timeStr = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} – ${now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;

      AdminData.auditHistory.unshift({
        id: `AUD-${String(AdminData.auditHistory.length + 1).padStart(3, '0')}`,
        timestamp: timeStr,
        action: 'Desbloqueo de horario',
        targetId: blockId,
        prevStatus: 'bloqueado',
        newStatus: 'disponible',
        adminUser: 'Administrador Huáscar',
        notes: `Se liberó el bloqueo de ${removed.date} (${removed.timeFormatted}).`
      });

      this.renderBlockList();
      this.renderHistoryTable();
      this.renderAdminCalendar();
    }
  },

  renderBlockList() {
    const listEl = document.getElementById('blocked-slots-table-body');
    if (!listEl) return;

    if (AdminData.blockedSlots.length === 0) {
      listEl.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--admin-text-muted); padding: 20px;">No hay bloqueos activos registrados.</td></tr>`;
      return;
    }

    listEl.innerHTML = AdminData.blockedSlots.map(b => `
      <tr>
        <td style="font-weight: 800;">${b.id}</td>
        <td>${this.formatDisplayDate(b.date)}</td>
        <td><strong>${b.timeFormatted}</strong></td>
        <td>${b.reason}</td>
        <td>
          <button type="button" class="btn-action-icon btn-reject-row" title="Liberar horario" onclick="AdminController.deleteBlock('${b.id}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>
    `).join('');
  },

  /* ==========================================================================
     9. MÓDULO DE HISTORIAL DE ACCIONES (AUDITORÍA)
     ========================================================================== */
  renderHistoryTable() {
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    if (AdminData.auditHistory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--admin-text-muted); padding: 20px;">No hay acciones registradas en el historial.</td></tr>`;
      return;
    }

    tbody.innerHTML = AdminData.auditHistory.map(item => `
      <tr>
        <td style="font-size: 0.8rem; color: var(--admin-text-muted); white-space: nowrap;">${item.timestamp}</td>
        <td style="font-weight: 800; color: var(--admin-navy);">${item.action}</td>
        <td style="font-family: monospace; font-weight: 700;">${item.targetId}</td>
        <td>
          <span style="font-size: 0.78rem; text-transform: capitalize;">${item.prevStatus} → <strong>${item.newStatus}</strong></span>
        </td>
        <td style="font-size: 0.82rem;">${item.adminUser}</td>
        <td style="font-size: 0.82rem; color: var(--admin-text-muted);">${item.notes}</td>
      </tr>
    `).join('');
  },

  /* ==========================================================================
     10. MÓDULO DE CALENDARIO ADMINISTRATIVO
     ========================================================================== */
  renderAdminCalendar() {
    const container = document.getElementById('admin-calendar-timeline');
    if (!container) return;

    const filterDateInput = document.getElementById('cal-admin-date');
    const selectedDate = filterDateInput?.value || new Date().toISOString().split('T')[0];

    // Horas de 7:00 a 22:00
    const hours = [];
    for (let h = 7; h < 22; h++) {
      hours.push(`${String(h).padStart(2, '0')}:00`);
      hours.push(`${String(h).padStart(2, '0')}:30`);
    }

    const dayRequests = AdminData.requests.filter(r => r.date === selectedDate);
    const dayBlocks = AdminData.blockedSlots.filter(b => b.date === selectedDate);

    container.innerHTML = hours.map(timeStr => {
      const curMin = this.timeToMin(timeStr);
      const nextMin = curMin + 30;

      // Buscar si está bloqueado
      const block = dayBlocks.find(b => {
        const bStart = this.timeToMin(b.start);
        const bEnd = this.timeToMin(b.end);
        return curMin >= bStart && curMin < bEnd;
      });

      // Buscar si hay solicitud
      const req = dayRequests.find(r => {
        const rStart = this.timeToMin(r.start);
        const rEnd = this.timeToMin(r.end);
        return curMin >= rStart && curMin < rEnd;
      });

      let statusHtml = '<span style="color: #94a3b8; font-size: 0.78rem;">Disponible</span>';
      let rowBg = '#ffffff';

      if (block) {
        statusHtml = `<span style="color: #b91c1c; font-weight: 700; font-size: 0.82rem;">🚫 Bloqueado (${block.reason})</span>`;
        rowBg = '#fef2f2';
      } else if (req) {
        if (req.status === 'aprobada') {
          statusHtml = `<span style="color: #047857; font-weight: 700; font-size: 0.82rem;">✓ Reservado (${req.applicant.fullName} · ${req.activity})</span>`;
          rowBg = '#ecfdf5';
        } else if (req.status === 'pendiente') {
          statusHtml = `<span style="color: #b45309; font-weight: 700; font-size: 0.82rem;">⏳ Pendiente (${req.applicant.fullName} · ${req.activity})</span>`;
          rowBg = '#fffbeb';
        }
      }

      return `
        <div style="display: flex; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--admin-border-subtle); background: ${rowBg};">
          <div style="width: 110px; font-weight: 800; font-size: 0.86rem; color: var(--admin-navy);">${this.formatTime12(timeStr)}</div>
          <div style="flex: 1;">${statusHtml}</div>
        </div>
      `;
    }).join('');
  },

  /* ==========================================================================
     UTILIDADES DE TIEMPO
     ========================================================================== */
  timeToMin(str) {
    if (!str) return 0;
    const [h, m] = str.split(':').map(Number);
    return h * 60 + m;
  },

  formatTime12(str) {
    if (!str) return '--';
    const [h, m] = str.split(':').map(Number);
    const p = h >= 12 ? 'p. m.' : 'a. m.';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${p}`;
  }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  AdminController.init();
});

// Exponer globalmente
if (typeof window !== 'undefined') {
  window.AdminController = AdminController;
}
