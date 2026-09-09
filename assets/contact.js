(() => {
  'use strict';
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const fields = document.querySelector('#contact-fields');
  const status = document.querySelector('#contact-form-status');
  const result = document.querySelector('#contact-form-result');
  const whatsappLink = document.querySelector('#contact-request-link');
  const emailLink = document.querySelector('#contact-email-link');
  const controls = [...fields.querySelectorAll('input, select, textarea')];

  form.addEventListener('invalid', event => {
    event.target.setAttribute('aria-invalid', 'true');
  }, true);

  function clearResult(event) {
    if (!controls.includes(event.target)) return;
    event.target.setCustomValidity('');
    event.target.removeAttribute('aria-invalid');
    status.textContent = '';
    result.hidden = true;
    whatsappLink.removeAttribute('href');
    emailLink.removeAttribute('href');
  }
  form.addEventListener('input', clearResult);
  form.addEventListener('change', clearResult);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = {};
    for (const control of controls) {
      control.value = control.value.trim();
      control.setCustomValidity(control.required && !control.value ? 'Compila questo campo.' : '');
      data[control.name] = control.value;
    }
    if (!form.reportValidity()) return;

    const message = [
      'Ciao Eric, vorrei un preventivo per la mia attività.',
      '',
      'Nome: ' + data.name,
      ...(data.company ? ['Azienda: ' + data.company] : []),
      'Email: ' + data.email,
      ...(data.phone ? ['Telefono: ' + data.phone] : []),
      'Servizio richiesto: ' + data.service,
      '',
      'Messaggio:',
      data.message
    ].join('\n');
    const url = 'https://wa.me/393520422507?text=' + encodeURIComponent(message);
    whatsappLink.href = url;
    emailLink.href = 'mailto:leidmanagementgroup@gmail.com?subject=' + encodeURIComponent('Richiesta di preventivo — ' + data.service) + '&body=' + encodeURIComponent(message);
    result.hidden = false;
    status.textContent = 'Richiesta preparata. Conferma l’invio su WhatsApp. Se la finestra non si apre, usa il collegamento qui sotto.';
    // Il link resta disponibile anche quando il browser blocca la nuova finestra.
    try { window.open(url, '_blank', 'noopener,noreferrer'); } catch { /* Il collegamento manuale resta utilizzabile. */ }
  });

  // Il modulo resta disabilitato se lo script non si carica: i contatti diretti rimangono disponibili.
  document.querySelector('#contact-form-fallback').hidden = true;
  fields.disabled = false;
})();
