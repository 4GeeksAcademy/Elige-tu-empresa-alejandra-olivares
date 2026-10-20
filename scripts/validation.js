const form = document.querySelector('#registration-form');

if (form) {
  const countryField = form.querySelector('#pais');
  const cityField = form.querySelector('#ciudad');
  const branchField = form.querySelector('#sede');
  const phoneField = form.querySelector('#telefono');
  const birthdayField = form.querySelector('#cumpleanos');
  const statusNode = form.querySelector('#registration-status');
  const controls = Array.from(form.querySelectorAll('input[name], select[name]'));
  const originalClasses = new Map(controls.map((field) => [field, field.className]));
  let preserveStatusAfterReset = false;

  const locationCatalog = {
    CO: { medellin: { label: 'Medellín', branches: [] } },
    US: { miami: { label: 'Miami', branches: [] } },
  };

  const messageFor = (field) => document.getElementById(`${field.id}-error`);

  const setFieldState = (field, message = '', isValid = false, isWarning = false) => {
    const messageNode = messageFor(field);
    if (!messageNode) return;

    field.setAttribute('aria-invalid', String(!isValid));
    field.classList.remove(
      'border-white/10', 'border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20', 'bg-red-950/20',
      'border-emerald-400', 'focus:border-emerald-400', 'focus:ring-emerald-500/20', 'bg-emerald-950/10'
    );

    if (!message) {
      messageNode.textContent = '';
      messageNode.className = 'hidden text-xs';
      return;
    }

    messageNode.textContent = message;
    messageNode.className = `mt-2 text-xs leading-5 ${isValid ? (isWarning ? 'text-amber-200' : 'text-emerald-200') : 'text-red-300'}`;
    field.classList.add(...(isValid
      ? ['border-emerald-400', 'focus:border-emerald-400', 'focus:ring-emerald-500/20', 'bg-emerald-950/10']
      : ['border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20', 'bg-red-950/20']));
  };

  const normalizePhone = (value) => value.replace(/[\s().-]/g, '');

  const validatePhone = (value) => {
    const prefix = countryField.value === 'CO' ? '+57' : countryField.value === 'US' ? '+1' : '';
    if (!prefix) return { valid: false, message: 'Selecciona primero el país para validar el prefijo.' };
    if (!value.startsWith(prefix)) {
      return { valid: false, message: `El teléfono debe comenzar con ${prefix}, según el país seleccionado.` };
    }
    if (!/^\+[\d\s().-]+$/.test(value)) {
      return { valid: false, message: 'Usa el prefijo internacional y solo dígitos, espacios, guiones o paréntesis.' };
    }

    const normalized = normalizePhone(value);
    const nationalNumber = normalized.slice(prefix.length);
    const validNationalNumber = countryField.value === 'CO'
      ? /^(?:3\d{9}|60[1-8]\d{7})$/.test(nationalNumber)
      : /^[2-9]\d{2}[2-9]\d{6}$/.test(nationalNumber);

    return validNationalNumber
      ? { valid: true, message: 'Teléfono válido.' }
      : { valid: false, message: countryField.value === 'CO'
        ? 'Después de +57 ingresa un móvil de 10 dígitos que empiece por 3 o un fijo colombiano de 10 dígitos.'
        : 'Después de +1 ingresa un número NANP de 10 dígitos con códigos de área y central entre 2 y 9.' };
  };

  const updateCities = () => {
    const cities = Object.entries(locationCatalog[countryField.value] || {});
    cityField.replaceChildren(new Option(cities.length ? 'Selecciona una ciudad' : 'Selecciona primero un país', '', true, true));
    cityField.disabled = cities.length === 0;
    cities.forEach(([value, city]) => cityField.add(new Option(city.label, value)));
    cityField.value = '';
    updateBranches();
    setFieldState(cityField);
    setFieldState(branchField);
  };

  const updateBranches = () => {
    branchField.replaceChildren(new Option('Selecciona primero una ciudad', '', true, true));
    branchField.disabled = !cityField.value;
    if (!cityField.value) return;

    const city = locationCatalog[countryField.value]?.[cityField.value];
    const branches = city?.branches || [];
    branchField.replaceChildren(new Option('Selecciona una opción', '', true, true));
    if (branches.length) {
      branches.forEach((branch) => branchField.add(new Option(branch.label, branch.value)));
    } else {
      branchField.add(new Option('Sede pendiente: catálogo no confirmado', 'pending'));
    }
    branchField.value = '';
  };

  const validateField = (field) => {
    if (field.name === 'preferencias') return true;
    if (field.type === 'checkbox') {
      const checked = field.checked;
      setFieldState(field, checked ? 'Entendido: esta casilla no registra aceptación legal.' : 'Debes marcar la casilla de términos para continuar con esta demostración.', checked);
      return checked;
    }

    const value = field.value.trim();
    if (field === cityField && !value) {
      setFieldState(field, countryField.value ? 'Selecciona una ciudad.' : 'Selecciona primero un país para elegir una ciudad.');
      return false;
    }

    if (field === branchField && !value) {
      setFieldState(field, cityField.value ? 'Selecciona una sede preferida.' : 'Selecciona primero una ciudad para ver las sedes disponibles.');
      return false;
    }

    if (field.required && !value) {
      const requiredMessages = {
        nombre: 'Ingresa tu nombre.',
        apellido: 'Ingresa tu apellido.',
        email: 'Ingresa tu correo electrónico.',
        telefono: 'Ingresa tu número de teléfono.',
        pais: 'Selecciona un país.',
        ciudad: 'Selecciona una ciudad.',
        sede: 'Selecciona una sede preferida.',
        origen: 'Indica cómo conociste Brasaland.',
      };
      const fieldLabel = form.querySelector(`label[for="${field.id}"]`)?.textContent.replace('*', '').trim();
      setFieldState(field, requiredMessages[field.name] || `Completa el campo ${fieldLabel || field.name}.`);
      return false;
    }

    if (field === birthdayField && value) {
      const selectedDate = new Date(`${value}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (Number.isNaN(selectedDate.getTime())) {
        setFieldState(field, 'Ingresa una fecha de cumpleaños válida.');
        return false;
      }
      if (selectedDate > today) {
        setFieldState(field, 'La fecha de cumpleaños no puede ser futura.');
        return false;
      }
    }

    if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldState(field, 'Ingresa un correo electrónico válido.');
      return false;
    }

    if (field === phoneField) {
      const result = validatePhone(value);
      setFieldState(field, result.message, result.valid);
      return result.valid;
    }

    if (field === cityField) {
      const allowedCities = locationCatalog[countryField.value] || {};
      if (!Object.hasOwn(allowedCities, value)) {
        setFieldState(field, 'Selecciona una ciudad documentada para el país elegido.');
        return false;
      }
    }

    if (field === branchField) {
      if (!cityField.value) {
        setFieldState(field, 'Selecciona primero una ciudad.');
        return false;
      }
      const branches = locationCatalog[countryField.value]?.[cityField.value]?.branches || [];
      if (branches.length && !branches.some((branch) => branch.value === value)) {
        setFieldState(field, 'Selecciona una sede incluida en el catálogo confirmado para esta ciudad.');
        return false;
      }
      if (!branches.length && value !== 'pending') {
        setFieldState(field, 'El catálogo de sedes está pendiente; selecciona la opción de sede pendiente para continuar con la demostración.');
        return false;
      }
      setFieldState(field, branches.length ? 'Sede confirmada.' : 'No se registrará una sede específica hasta confirmar el catálogo.', true, !branches.length);
      return true;
    }

    setFieldState(field, value ? 'Correcto.' : '', true);
    return true;
  };

  const validateForm = () => {
    let isValid = true;
    controls.forEach((field) => {
      if (field.name === 'preferencias') return;
      if (!validateField(field)) isValid = false;
    });
    return isValid;
  };

  countryField.addEventListener('change', () => {
    updateCities();
    validateField(countryField);
    validateField(phoneField);
  });

  cityField.addEventListener('change', () => {
    updateBranches();
    validateField(cityField);
    setFieldState(branchField);
  });

  controls.forEach((field) => {
    if (field.name === 'preferencias') return;
    field.addEventListener('input', () => validateField(field));
    field.addEventListener('change', () => validateField(field));
    field.addEventListener('blur', () => validateField(field));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    statusNode.classList.add('hidden');

    if (!validateForm()) {
      const firstInvalidField = controls.find((field) => field.getAttribute('aria-invalid') === 'true');
      if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    statusNode.className = 'rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100';
    statusNode.textContent = 'Registro de demostración completado. No se guardaron datos, no se creó una cuenta y no se registró aceptación legal.';
    preserveStatusAfterReset = true;
    form.reset();
  });

  form.addEventListener('reset', () => {
    const shouldPreserveStatus = preserveStatusAfterReset;
    preserveStatusAfterReset = false;
    window.setTimeout(() => {
      controls.forEach((field) => {
        field.className = originalClasses.get(field);
        field.removeAttribute('aria-invalid');
        setFieldState(field);
      });
      if (!shouldPreserveStatus) {
        statusNode.classList.add('hidden');
        statusNode.textContent = '';
      }
      updateCities();
    }, 0);
  });
}
