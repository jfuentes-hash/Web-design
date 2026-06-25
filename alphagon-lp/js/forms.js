/* ============================================================
   forms.js — formulario conversacional paso a paso
   Validación (email, teléfono, edad, consentimientos), progreso,
   auto-avance, toast y pantalla de éxito.
   El envío real está preparado pero desactivado (ver handleSubmit).
   ============================================================ */
(function () {
  'use strict';

  var form = document.getElementById('lead-form');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.form-step'));
  var success = form.querySelector('.form-success');
  var fill = form.querySelector('.form-progress__fill');
  var label = form.querySelector('.form-progress__label');
  var btnNext = form.querySelector('[data-action="next"]');
  var btnBack = form.querySelector('[data-action="back"]');
  var toast = document.getElementById('toast');

  var current = 0;
  var data = {};

  /* ---------- Mostrar paso ---------- */
  function showStep(i) {
    steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
    current = i;
    var pct = Math.round(((i) / steps.length) * 100);
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = 'Paso ' + (i + 1) + ' de ' + steps.length;
    if (btnBack) btnBack.hidden = i === 0;

    var step = steps[i];
    var isOptionStep = step.getAttribute('data-type') === 'option';
    if (btnNext) btnNext.style.display = isOptionStep ? 'none' : '';

    var firstInput = step.querySelector('input');
    if (firstInput) {
      window.setTimeout(function () { firstInput.focus(); }, 60);
    }
  }

  /* ---------- Validación por paso ---------- */
  function validateStep(step) {
    var type = step.getAttribute('data-type');
    var field = step.querySelector('.field');
    var input = step.querySelector('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]');

    function fail(msg) {
      if (field) {
        field.classList.add('has-error');
        var err = field.querySelector('.field__error');
        if (err) err.textContent = msg;
      }
      if (input) input.focus();
      return false;
    }

    if (type === 'option') {
      return !!step.querySelector('.option.is-selected');
    }

    if (!input) return true;
    var val = input.value.trim();

    if (type === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) return fail('Escribe un correo valido.');
    } else if (type === 'tel') {
      var digits = val.replace(/[^0-9]/g, '');
      if (digits.length < 9) return fail('Escribe un telefono valido.');
    } else if (type === 'age') {
      var n = parseInt(val, 10);
      if (isNaN(n) || n < 10 || n > 30) return fail('Indica una edad entre 10 y 30.');
    } else {
      if (val.length < 2) return fail('Este campo es necesario.');
    }

    var key = input.getAttribute('name');
    if (key) data[key] = val;
    return true;
  }

  /* ---------- Avanzar / retroceder ---------- */
  function next() {
    if (!validateStep(steps[current])) return;
    if (current < steps.length - 1) {
      showStep(current + 1);
    } else {
      submit();
    }
  }
  function back() {
    if (current > 0) showStep(current - 1);
  }

  if (btnNext) btnNext.addEventListener('click', next);
  if (btnBack) btnBack.addEventListener('click', back);

  /* ---------- Limpiar error al escribir ---------- */
  form.querySelectorAll('.field input').forEach(function (input) {
    input.addEventListener('input', function () {
      var f = input.closest('.field');
      if (f) f.classList.remove('has-error');
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); next(); }
    });
  });

  /* ---------- Opciones grandes con auto-avance ---------- */
  form.querySelectorAll('.form-step[data-type="option"]').forEach(function (step) {
    var opts = step.querySelectorAll('.option');
    opts.forEach(function (opt) {
      opt.addEventListener('click', function () {
        opts.forEach(function (o) { o.classList.remove('is-selected'); });
        opt.classList.add('is-selected');
        var key = step.getAttribute('data-name');
        if (key) data[key] = opt.getAttribute('data-value');
        window.setTimeout(next, 240);
      });
    });
  });

  /* ---------- Chips de deporte ---------- */
  var sportInput = form.querySelector('input[name="deporte"]');
  form.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      form.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-selected'); });
      chip.classList.add('is-selected');
      if (sportInput) {
        sportInput.value = chip.textContent.trim();
        var f = sportInput.closest('.field');
        if (f) f.classList.remove('has-error');
      }
    });
  });

  /* ---------- Toast ---------- */
  function showToast(message) {
    if (!toast) return;
    var text = toast.querySelector('.toast__text');
    if (text) text.textContent = message;
    toast.classList.add('is-visible');
    window.setTimeout(function () { toast.classList.remove('is-visible'); }, 4200);
  }

  /* ---------- Envío ---------- */
  function submit() {
    var privacy = form.querySelector('#consent-privacy');
    var whatsapp = form.querySelector('#consent-whatsapp');
    var newsletter = form.querySelector('#consent-news');
    var consentError = form.querySelector('.consents-error');

    if (!privacy.checked || !whatsapp.checked) {
      if (consentError) consentError.style.display = 'block';
      return;
    }
    if (consentError) consentError.style.display = 'none';

    data.consent_privacy = privacy.checked;
    data.consent_whatsapp = whatsapp.checked;
    data.consent_newsletter = newsletter ? newsletter.checked : false;

    handleSubmit(data);

    if (fill) fill.style.width = '100%';
    if (label) label.textContent = 'Completado';
    if (btnBack) btnBack.hidden = true;
    if (btnNext) btnNext.style.display = 'none';
    steps.forEach(function (s) { s.classList.remove('is-active'); });
    if (success) success.classList.add('is-active');
    showToast('Solicitud recibida. Te respondemos en menos de 24 horas.');
  }

  /* ---------- Conexion del lead (preparada, sin enviar todavia) ----------
     Mapeo de campos listo para HubSpot Forms. Para activarlo, descomenta
     la linea de abajo e indica portalId y formId reales. */
  function handleSubmit(payload) {
    var fields = [
      { name: 'perfil', value: payload.perfil },
      { name: 'firstname', value: payload.nombre },
      { name: 'athlete_name', value: payload.atleta },
      { name: 'athlete_age', value: payload.edad },
      { name: 'sport', value: payload.deporte },
      { name: 'email', value: payload.email },
      { name: 'phone', value: payload.telefono },
      { name: 'objetivo', value: payload.objetivo },
      { name: 'presupuesto', value: payload.presupuesto }
    ];
    // submitToHubSpot('PORTAL_ID', 'FORM_ID', fields, payload.consent_privacy, payload.consent_whatsapp, payload.consent_newsletter);
    void fields;
  }

  /* ---------- Inicio ---------- */
  showStep(0);
})();
