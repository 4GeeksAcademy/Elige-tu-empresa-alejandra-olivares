const form = document.querySelector('form');

if (form) {
  const fields = Array.from(
    form.querySelectorAll('input, select, textarea')
  ).filter(
    (field) =>
      field.name &&
      !['submit', 'reset', 'button'].includes(field.type)
  );

  const originalClasses = new Map(fields.map((field) => [field, field.className]));

  const getMessageNode = (field) => {
    let messageNode = field.parentElement.querySelector('.validation-message');

    if (!messageNode) {
      messageNode = document.createElement('small');
      messageNode.className = 'validation-message error-message mt-2 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-200 shadow-sm';
      messageNode.setAttribute('aria-live', 'polite');
      field.parentElement.appendChild(messageNode);
    }

    return messageNode;
  };

  const setFieldState = (field, isValid) => {
    const messageNode = getMessageNode(field);

    field.setAttribute('aria-invalid', String(!isValid));
    field.classList.remove('border-white/10', 'border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20', 'bg-red-950/20');
    field.classList.remove('border-emerald-400', 'focus:border-emerald-400', 'focus:ring-emerald-500/20', 'bg-emerald-950/10');

    if (!isValid) {
      field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20', 'bg-red-950/20');
      messageNode.classList.remove('hidden');
      messageNode.className = 'validation-message error-message mt-2 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-200 shadow-sm';
      messageNode.textContent = field.dataset.errorMessage || 'Este campo es obligatorio.';
      return;
    }

    field.classList.add('border-emerald-400', 'focus:border-emerald-400', 'focus:ring-emerald-500/20', 'bg-emerald-950/10');
    messageNode.className = 'validation-message error-message mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-200 shadow-sm';
    messageNode.textContent = field.dataset.successMessage || '✔ Correcto';
    messageNode.classList.remove('hidden');
  };

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const isValidPhone = (value) => /^[0-9+()\s-]{8,20}$/.test(value);

  // Converts values to a common unit: number -> units, date -> days, time -> seconds.
  const toComparable = (type, raw) => {
    if (type === 'number') return Number(raw);
    if (type === 'date') return Date.parse(`${raw}T00:00:00Z`) / 86400000;
    if (type === 'time') {
      const [h, m, s = '0'] = raw.split(':');
      return Number(h) * 3600 + Number(m) * 60 + Number(s);
    }
    return NaN;
  };

  const defaultSteps = { number: 1, date: 1, time: 60 };

  const describeStep = (type, step) => {
    if (type === 'date') return `intervalos de ${step} día(s)`;
    if (type === 'time') {
      return step % 60 === 0 ? `intervalos de ${step / 60} minuto(s)` : `intervalos de ${step} segundo(s)`;
    }
    return `múltiplos de ${step}`;
  };

  // Returns an error message, or null when min/max/step are satisfied.
  const checkRangeAndStep = (field, value) => {
    const { type } = field;
    const current = toComparable(type, value);
    if (Number.isNaN(current)) return 'Ingresa un valor válido.';

    const minAttr = field.getAttribute('min');
    const maxAttr = field.getAttribute('max');
    const min = minAttr ? toComparable(type, minAttr) : NaN;
    const max = maxAttr ? toComparable(type, maxAttr) : NaN;

    if (!Number.isNaN(min) && current < min) {
      return type === 'number'
        ? `El valor debe ser mayor o igual a ${minAttr}.`
        : `El valor debe ser igual o posterior a ${minAttr}.`;
    }

    if (!Number.isNaN(max) && current > max) {
      return type === 'number'
        ? `El valor debe ser menor o igual a ${maxAttr}.`
        : `El valor debe ser igual o anterior a ${maxAttr}.`;
    }

    const stepAttr = field.getAttribute('step');
    if (stepAttr === 'any') return null;

    const step = stepAttr && Number(stepAttr) > 0 ? Number(stepAttr) : defaultSteps[type];
    const base = Number.isNaN(min) ? 0 : min;
    const remainder = Math.abs((current - base) / step - Math.round((current - base) / step));

    if (remainder > 1e-9) {
      return `El valor debe ir en ${describeStep(type, step)}${minAttr ? ` a partir de ${minAttr}` : ''}.`;
    }

    return null;
  };

  const validateField = (field) => {
    const value = field.type === 'checkbox' ? field.checked : field.value.trim();

    if (field.type === 'checkbox') {
      if (!value) {
        field.dataset.errorMessage = 'Debes aceptar la confirmación para continuar.';
        field.dataset.successMessage = 'Gracias, la confirmación quedó correcta.';
        setFieldState(field, false);
        return false;
      }

      field.dataset.successMessage = 'Gracias, la confirmación quedó correcta.';
      setFieldState(field, true);
      return true;
    }

    if (field.tagName === 'SELECT' && !value) {
      field.dataset.errorMessage = 'Selecciona una opción válida.';
      setFieldState(field, false);
      return false;
    }

    if (field.hasAttribute('required') && !value) {
      field.dataset.errorMessage = 'Este campo es obligatorio.';
      setFieldState(field, false);
      return false;
    }

    if (field.name === 'nombre' || field.name === 'apellido') {
      if (value.length < 2) {
        field.dataset.errorMessage = 'Debe contener al menos 2 caracteres.';
        field.dataset.successMessage = 'Se ve bien.';
        setFieldState(field, false);
        return false;
      }

      field.dataset.successMessage = 'Nombre válido.';
    }

    if (field.type === 'email') {
      if (!isValidEmail(value)) {
        field.dataset.errorMessage = 'Ingresa un correo electrónico válido.';
        field.dataset.successMessage = 'Correo correcto.';
        setFieldState(field, false);
        return false;
      }

      field.dataset.successMessage = 'Correo correcto.';
    }

    if (field.type === 'tel') {
      if (!isValidPhone(value)) {
        field.dataset.errorMessage = 'Ingresa un teléfono válido.';
        field.dataset.successMessage = 'Teléfono correcto.';
        setFieldState(field, false);
        return false;
      }

      field.dataset.successMessage = 'Teléfono correcto.';
    }

    if (field.type === 'date') {
      if (!value || Number.isNaN(new Date(value).getTime())) {
        field.dataset.errorMessage = 'Selecciona una fecha válida para la reserva.';
        field.dataset.successMessage = 'Fecha correcta.';
        setFieldState(field, false);
        return false;
      }

      field.dataset.successMessage = 'Fecha correcta.';
    }

    if (field.type === 'time') {
      if (!value) {
        field.dataset.errorMessage = 'Selecciona una hora válida para la reserva.';
        field.dataset.successMessage = 'Hora correcta.';
        setFieldState(field, false);
        return false;
      }

      field.dataset.successMessage = 'Hora correcta.';
    }

    if (field.type === 'number') {
      if (!value || Number.isNaN(Number(value))) {
        field.dataset.errorMessage = 'Ingresa un número válido.';
        field.dataset.successMessage = 'Cantidad válida.';
        setFieldState(field, false);
        return false;
      }

      field.dataset.successMessage = 'Cantidad válida.';
    }

    if (['number', 'date', 'time'].includes(field.type) && value) {
      const rangeError = checkRangeAndStep(field, value);
      if (rangeError) {
        field.dataset.errorMessage = rangeError;
        setFieldState(field, false);
        return false;
      }
    }

    if (field.name === 'ambiente' && !value) {
      field.dataset.errorMessage = 'Selecciona un ambiente para tu reserva.';
      field.dataset.successMessage = 'Ambiente seleccionado.';
      setFieldState(field, false);
      return false;
    }

    if (field.name === 'ambiente') {
      field.dataset.successMessage = 'Ambiente seleccionado.';
    }

    if (field.name === 'evento' && !value) {
      field.dataset.errorMessage = 'Selecciona el tipo de evento.';
      field.dataset.successMessage = 'Tipo de evento correcto.';
      setFieldState(field, false);
      return false;
    }

    if (field.name === 'evento') {
      field.dataset.successMessage = 'Tipo de evento correcto.';
    }

    if (field.name === 'comentarios' && value.length < 10) {
      field.dataset.errorMessage = 'Agrega más detalle para ayudarnos a preparar tu reserva.';
      field.dataset.successMessage = 'Comentario suficiente.';
      setFieldState(field, false);
      return false;
    }

    if (field.name === 'comentarios') {
      field.dataset.successMessage = 'Comentario suficiente.';
    }

    setFieldState(field, true);
    return true;
  };

  const validateForm = () => {
    let isFormValid = true;

    fields.forEach((field) => {
      const isValid = validateField(field);
      if (!isValid) isFormValid = false;
    });

    return isFormValid;
  };

  fields.forEach((field) => {
    field.addEventListener('input', () => {
      validateField(field);
    });

    field.addEventListener('blur', () => {
      validateField(field);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const isValid = validateForm();

    if (!isValid) {
      const firstInvalidField = fields.find((field) => field.getAttribute('aria-invalid') === 'true');

      if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      return;
    }

    window.alert('¡Reserva enviada correctamente! Te contactaremos pronto para confirmar los detalles.');
    form.reset();

    fields.forEach((field) => {
      field.setAttribute('aria-invalid', 'false');
      const messageNode = getMessageNode(field);

      messageNode.textContent = '';
      messageNode.classList.add('hidden');
      messageNode.className = 'validation-message hidden';

      field.classList.remove(
        'border-red-500',
        'focus:border-red-500',
        'focus:ring-red-500/20',
        'bg-red-950/20',
        'border-emerald-400',
        'focus:border-emerald-400',
        'focus:ring-emerald-500/20',
        'bg-emerald-950/10'
      );
    });
  });

  form.addEventListener('reset', () => {
    // Defer so cleanup runs after the browser restores default values.
    setTimeout(() => {
      form.querySelectorAll('.error-message, .validation-message').forEach((node) => node.remove());

      fields.forEach((field) => {
        field.className = originalClasses.get(field);
        field.removeAttribute('aria-invalid');
        delete field.dataset.errorMessage;
        delete field.dataset.successMessage;
      });
    }, 0);
  });
}
