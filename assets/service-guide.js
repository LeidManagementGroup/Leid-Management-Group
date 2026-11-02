(() => {
  'use strict';

  const filters = document.querySelector('#pricing-filters');
  const cards = [...document.querySelectorAll('.pricing-card[data-pricing-category]')];
  const groups = [...document.querySelectorAll('.pricing-group')];
  const filterStatus = document.querySelector('#pricing-filter-status');

  if (filters && cards.length) {
    const buttons = [...filters.querySelectorAll('button[data-pricing-filter]')];
    const applyFilter = (filter, announce) => {
      let visibleCount = 0;
      cards.forEach(card => {
        const categories = card.dataset.pricingCategory.split(/\s+/);
        card.hidden = filter !== 'all' && !categories.includes(filter);
        if (!card.hidden) visibleCount += 1;
      });
      groups.forEach(group => {
        group.hidden = !cards.some(card => group.contains(card) && !card.hidden);
      });
      buttons.forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.pricingFilter === filter));
      });
      if (filterStatus) {
        filterStatus.textContent = visibleCount === 1
          ? '1 servizio disponibile.'
          : visibleCount + ' servizi disponibili.';
      }
      if (announce) filters.dataset.activeFilter = filter;
    };

    buttons.forEach(button => {
      button.addEventListener('click', () => applyFilter(button.dataset.pricingFilter, true));
    });
    applyFilter('all', false);
    filters.hidden = false;
  }

  const serviceSelect = document.querySelector('#contact-service');
  const form = document.querySelector('#contact-form');
  const selectionNote = document.querySelector('#contact-selection');
  const serviceLinks = [...document.querySelectorAll('a[data-service-choice]')];
  if (!serviceSelect || !form) return;

  function showSelection() {
    const selected = serviceSelect.value;
    if (selectionNote) {
      selectionNote.textContent = selected
        ? 'Servizio scelto: ' + selected + '. Puoi cambiarlo nel campo qui sotto.'
        : '';
      selectionNote.hidden = !selected;
    }
    serviceLinks.forEach(link => {
      const card = link.closest('.pricing-card');
      if (card) card.classList.toggle('is-service-selected', Boolean(selected) && link.dataset.serviceChoice === selected);
    });
  }

  serviceLinks.forEach(link => {
    link.addEventListener('click', event => {
      // Mantiene il comportamento dei link aperti in una nuova scheda.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (form.getAttribute('aria-busy') === 'true' || serviceSelect.matches(':disabled')) return;
      const service = link.dataset.serviceChoice;
      if (![...serviceSelect.options].some(option => option.value === service)) return;

      serviceSelect.value = service;
      serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
      // Mostra subito il contenitore animato prima che il link calcoli il salto.
      // Il modulo orienta chi usa la tastiera, senza aprire la tastiera mobile.
      form.focus({ preventScroll: true });
    });
  });

  serviceSelect.addEventListener('change', showSelection);
  showSelection();
})();
