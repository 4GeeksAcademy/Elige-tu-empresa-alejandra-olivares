const form = document.querySelector('#registration-form');

if (form) {
  const countryField = form.querySelector('#pais');
  const cityField = form.querySelector('#ciudad');
  const branchField = form.querySelector('#sede');
  const phoneField = form.querySelector('#telefono');
  const statusNode = form.querySelector('#registration-status');
  const requiredControls = Array.from(form.querySelectorAll('[required]'));
  const originalClasses = new Map(requiredControls.map((field) => [field, field.className]));

  const locationCatalog = {
    CO: {
      medellin: { label: 'Medellín', branches: ['Brasaland El Poblado', 'Brasaland Laureles', 'Brasaland Envigado', 'Brasaland Sabaneta'] },
      bogota: { label: 'Bogotá', branches: ['Brasaland Usaquén', 'Brasaland Chapinero', 'Brasaland Zona Rosa'] },
      cali: { label: 'Cali', branches: ['Brasaland Granada', 'Brasaland Ciudad Jardín', 'Brasaland Unicentro'] },
    },
    US: {
      miami: { label: 'Miami', branches: ['Brasaland Brickell', 'Brasaland Coral Gables'] },
      orlando: { label: 'Orlando', branches: ['Brasaland Downtown', 'Brasaland International Drive'] },
    },
  };

  const errorMessages = {
    nombre: 'Ingresa tu nombre completo (nombre y apellido)',
    email: 'Ingresa un email válido (ejemplo: <nombre@correo.com>)',
    telefono: 'El teléfono debe incluir código de país (ejemplo: +57 300 123 4567 o +1 305 123 4567)',
    pais: 'Selecciona tu país',
    ciudad: 'Selecciona tu ciudad',
    origen: 'Cuéntanos cómo conociste Brasaland',
    cumpleanos: 'Debes ser mayor de 18 años para registrarte en Brasa Points',
    terminos: 'Debes aceptar los términos del programa Brasa Points para continuar',
  };

  const clearFieldState = (field) => {
    field.className = originalClasses.get(field);
    field.removeAttribute('aria-invalid');
    const messageNode = document.getElementById(`${field.id}-error`);
    messageNode.textContent = '';
    messageNode.className = 'hidden text-xs';
  };

  const setFieldState = (field, valid) => {
    clearFieldState(field);
    field.setAttribute('aria-invalid', String(!valid));
    if (valid) return;

    field.classList.remove('border-white/10', 'focus:border-amber-400', 'focus:ring-amber-500/20');
    field.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500/20');
    const messageNode = document.getElementById(`${field.id}-error`);
    messageNode.textContent = errorMessages[field.id];
    messageNode.className = 'mt-2 text-xs leading-5 text-red-300';
  };

  const clearStatus = () => {
    statusNode.classList.add('hidden');
    statusNode.textContent = '';
  };

  const updateBranches = () => {
    const city = locationCatalog[countryField.value]?.[cityField.value];
    branchField.replaceChildren(new Option(city ? 'Sin ubicación favorita' : 'Selecciona primero una ciudad', '', true, true));
    branchField.disabled = !city;
    city?.branches.forEach((branch) => branchField.add(new Option(branch, branch)));
  };

  const updateCities = () => {
    const cities = Object.entries(locationCatalog[countryField.value] || {});
    cityField.replaceChildren(new Option(cities.length ? 'Selecciona una ciudad' : 'Selecciona primero un país', '', true, true));
    cityField.disabled = cities.length === 0;
    cities.forEach(([value, city]) => cityField.add(new Option(city.label, value)));
    clearFieldState(cityField);
    updateBranches();
  };

  const isAdult = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const birthday = new Date(`${value}T00:00:00`);
    const today = new Date();
    if (year < 1 || Number.isNaN(birthday.getTime())
      || birthday.getFullYear() !== year || birthday.getMonth() !== month - 1
      || birthday.getDate() !== day || birthday > today) return false;

    const beforeBirthday = today.getMonth() < month - 1
      || (today.getMonth() === month - 1 && today.getDate() < day);
    return today.getFullYear() - year - Number(beforeBirthday) >= 18;
  };

  const validateField = (field) => {
    const value = field.value.trim();
    let valid;

    switch (field.id) {
      case 'nombre':
        valid = value.split(/\s+/).length >= 2;
        break;
      case 'email':
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !field.validity.typeMismatch;
        break;
      case 'telefono': {
        const prefix = { CO: '+57', US: '+1' }[countryField.value];
        const normalized = value.replace(/[\s().-]/g, '');
        valid = Boolean(prefix) && normalized.startsWith(prefix)
          && /^\+\d+$/.test(normalized) && normalized.length > prefix.length;
        break;
      }
      case 'pais':
        valid = Object.hasOwn(locationCatalog, value);
        break;
      case 'ciudad':
        valid = Object.hasOwn(locationCatalog[countryField.value] || {}, value);
        break;
      case 'origen':
        valid = ['redes', 'recomendacion', 'restaurante', 'busqueda', 'otro'].includes(value);
        break;
      case 'cumpleanos':
        valid = isAdult(value);
        break;
      case 'terminos':
        valid = field.checked;
        break;
    }

    setFieldState(field, valid);
    return valid;
  };

  countryField.addEventListener('change', () => {
    updateCities();
    phoneField.placeholder = countryField.value === 'CO' ? '+57 300 123 4567' : '+1 305 123 4567';
    if (phoneField.value || phoneField.hasAttribute('aria-invalid')) validateField(phoneField);
  });

  cityField.addEventListener('change', updateBranches);

  requiredControls.forEach((field) => {
    ['input', 'change', 'blur'].forEach((eventName) => {
      field.addEventListener(eventName, () => validateField(field));
    });
  });

  form.addEventListener('input', clearStatus);
  form.addEventListener('change', clearStatus);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearStatus();
    const invalidFields = requiredControls.filter((field) => !validateField(field));
    if (invalidFields.length) {
      invalidFields[0].focus();
      return;
    }

    statusNode.className = 'whitespace-pre-line rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100';
    statusNode.textContent = '¡Bienvenido a Brasa Points!\n\nTu registro ha sido exitoso. Recibirás un email de confirmación en los próximos minutos con los detalles de tu cuenta y cómo empezar a acumular puntos.\n\n¡Ya puedes disfrutar de tus beneficios en cualquiera de nuestras 14 ubicaciones!';
  });

  form.addEventListener('reset', () => {
    clearStatus();
    requiredControls.forEach(clearFieldState);
    phoneField.placeholder = 'Selecciona un país primero';
    // The native reset restores select defaults after this event finishes.
    window.setTimeout(updateCities, 0);
  });

  updateCities();
}
