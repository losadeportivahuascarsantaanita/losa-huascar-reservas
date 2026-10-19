/**
 * Coordinador General de la Aplicación
 * Losa Deportiva Huáscar – Santa Anita
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar el componente del calendario
  const calendar = new HuascarCalendar();

  // 2. Botón CTA principal: desplazamiento suave al calendario
  const ctaBtn = document.getElementById('btn-cta-reserve');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const calendarEl = document.getElementById('calendario-reservas');
      if (calendarEl) {
        calendarEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // 3. Control de Acceso al Panel del Administrador (Etapa 3)
  const openAdminBtn = document.getElementById('btn-open-admin');
  if (openAdminBtn) {
    openAdminBtn.addEventListener('click', (e) => {
      // Navegación directa al panel del administrador
      window.location.href = 'admin.html';
    });
  }
  if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdminModal);
  if (closeAdminActionBtn) closeAdminActionBtn.addEventListener('click', closeAdminModal);

  // Cerrar al hacer clic fuera del diálogo
  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) closeAdminModal();
    });
  }

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && adminModal && adminModal.classList.contains('active')) {
      closeAdminModal();
    }
  });

  console.log('Losa Deportiva Huáscar – Santa Anita: Sistema cargado correctamente.');
});
