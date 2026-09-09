(() => {
  'use strict';
  const webhookUrl = 'https://hook.eu1.make.com/tv6kg71pxh8soivhkc3fts88wbmnu75h';
  const form = document.querySelector('#contact-form');
  if (!form) return;
  const fields = document.querySelector('#contact-fields');
  const status = document.querySelector('#contact-form-status');
  const result = document.querySelector('#contact-form-result');
  const whatsappLink = document.querySelector('#contact-request-link');
  const emailLink = document.querySelector('#contact-email-link');
  const fallback = document.querySelector('#contact-form-fallback');
  const submitButton = form.querySelector('button[type="submit"]');
  const controls = [...fields.querySelectorAll('input, select, textarea')];
  let submissionCache = null;
  let pending = false;

  form.addEventListener('invalid', event => {
    event.target.setAttribute('aria-invalid', 'true');
  }, true);

  function clearResult(event) {
    if (!controls.includes(event.target) || pending) return;
    event.target.setCustomValidity('');
    event.target.removeAttribute('aria-invalid');
    status.textContent = '';
    result.hidden = true;
    whatsappLink.removeAttribute('href');
    emailLink.removeAttribute('href');
    submissionCache = null;
  }
  form.addEventListener('input', clearResult);
  form.addEventListener('change', clearResult);

  function makeLeadId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'lead-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function normalizePhone(value) {
    const compact = value.replace(/[().\s-]/g, '');
    if (!compact) return '';
    if (/^\+\d{8,15}$/.test(compact)) return compact;
    if (/^00\d{8,15}$/.test(compact)) return '+' + compact.slice(2);
    if (/^\d{9,11}$/.test(compact)) return '+39' + compact;
    return null;
  }

  function cleanAttribution(value, maxLength) {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, maxLength);
  }

  function getProvenance() {
    const params = new URLSearchParams(window.location.search);
    const parts = ['utm_source', 'utm_medium', 'utm_campaign']
      .map(key => [key, cleanAttribution(params.get(key), 120)])
      .filter(([, value]) => value)
      .map(([key, value]) => key + '=' + value);
    if (document.referrer) {
      try {
        const referrer = new URL(document.referrer);
        const path = referrer.pathname === '/' ? '' : referrer.pathname;
        const safeReferrer = cleanAttribution(referrer.hostname + path, 200);
        if (safeReferrer) parts.push('referrer=' + safeReferrer);
      } catch { /* Referrer non valido: ignora. */ }
    }
    return parts.join('; ');
  }

  function manualMessage(data) {
    return [
      'Ciao Eric, vorrei un preventivo per la mia attività.', '',
      'Nome: ' + data.name,
      ...(data.company ? ['Azienda: ' + data.company] : []),
      ...(data.business_type ? ['Tipo di attività: ' + data.business_type] : []),
      'Email: ' + data.email,
      ...(data.phone ? ['Telefono: ' + data.phone] : []),
      'Servizio richiesto: ' + data.service, '', 'Messaggio:', data.message
    ].join('\n');
  }

  function showManualFallback(data) {
    const message = manualMessage(data);
    whatsappLink.href = 'https://wa.me/393520422507?text=' + encodeURIComponent(message);
    emailLink.href = 'mailto:info@leidmanagementgroup.it?subject=' + encodeURIComponent('Richiesta di preventivo — ' + data.service) + '&body=' + encodeURIComponent(message);
    result.hidden = false;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending) return;
    const data = {};
    for (const control of controls) {
      control.value = control.value.trim();
      control.setCustomValidity(control.required && !control.value ? 'Compila questo campo.' : '');
      if (control.name === 'email') control.value = control.value.toLowerCase();
      data[control.name] = control.value;
    }
    const phoneControl = document.querySelector('#contact-phone');
    const normalizedPhone = normalizePhone(data.phone);
    if (normalizedPhone === null) {
      phoneControl.setCustomValidity('Inserisci un numero valido con prefisso internazionale oppure un numero italiano di 9–11 cifre.');
      phoneControl.setAttribute('aria-invalid', 'true');
    } else {
      data.phone = normalizedPhone;
      phoneControl.value = normalizedPhone;
    }
    if (!form.reportValidity()) return;

    const provenienza = getProvenance();
    const submissionKey = JSON.stringify({ name: data.name, company: data.company, business_type: data.business_type, email: data.email, phone: data.phone, service: data.service, message: data.message, website: data.website, provenienza });
    const leadId = submissionCache && submissionCache.key === submissionKey ? submissionCache.leadId : makeLeadId();
    const payload = new URLSearchParams({ lead_id: leadId, nome: data.name, azienda: data.company, tipo_attivita: data.business_type, email: data.email, telefono: data.phone, servizio: data.service, note: data.message, fonte: 'Sito', provenienza, social: '', website: data.website });

    pending = true;
    form.setAttribute('aria-busy', 'true');
    fields.disabled = true;
    submitButton.disabled = true;
    status.textContent = 'Invio della richiesta in corso…';
    result.hidden = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(webhookUrl, { method: 'POST', body: payload, signal: controller.signal });
      let responseData = null;
      try { responseData = await response.json(); } catch { /* Risposta non JSON: la richiesta non è confermata. */ }
      if (!response.ok || !responseData || responseData.ok !== true) throw new Error('request-not-confirmed');
      submissionCache = { key: submissionKey, leadId };
      status.textContent = 'Richiesta inviata. Ti ricontatterò per definire insieme il prossimo passo.';
    } catch (error) {
      submissionCache = { key: submissionKey, leadId };
      showManualFallback(data);
      status.textContent = error.name === 'AbortError'
        ? 'Non riesco a confermare l’invio entro il tempo previsto. Riprova oppure contattami con uno dei collegamenti qui sotto.'
        : 'Non riesco a confermare l’invio. Riprova oppure contattami con uno dei collegamenti qui sotto.';
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      form.removeAttribute('aria-busy');
      fields.disabled = false;
      submitButton.disabled = false;
    }
  });

  // Il modulo resta disabilitato se lo script non si carica: i contatti diretti rimangono disponibili.
  fallback.hidden = true;
  fields.disabled = false;
})();
