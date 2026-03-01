/* ─── Configuration ─────────────────────────────────────────── */
const API_BASE = 'http://127.0.0.1:5000';

/* ─── Location Data (from columns.json, indices 3+) ─────────── */
// These are fetched from the server on load; fallback hardcoded for offline use.
let LOCATIONS = [];

/* ─── DOM References ────────────────────────────────────────── */
const form         = document.getElementById('predict-form');
const sqftInput    = document.getElementById('sqft');
const bhkInput     = document.getElementById('bhk');
const bathInput    = document.getElementById('bath');
const bhkVal       = document.getElementById('bhk-val');
const bathVal      = document.getElementById('bath-val');
const locationInput = document.getElementById('location-input');
const locationValue = document.getElementById('location-value');
const locationHint  = document.getElementById('location-hint');
const dropdown      = document.getElementById('location-dropdown');
const submitBtn     = document.getElementById('submit-btn');
const btnText       = submitBtn.querySelector('.btn-text');
const btnLoader     = submitBtn.querySelector('.btn-loader');
const resultPanel   = document.getElementById('result-panel');
const resultPrice   = document.getElementById('result-price');
const resetBtn      = document.getElementById('reset-btn');

/* ─── Fetch Locations from Server ───────────────────────────── */
async function loadLocations() {
  try {
    const res  = await fetch(`${API_BASE}/get_location`);
    const data = await res.json();
    LOCATIONS  = data.location.map(l => toTitleCase(l));
  } catch (e) {
    console.warn('Could not fetch locations from server. Using fallback.', e);
    // Minimal fallback so the UI still works offline during development
    LOCATIONS = [
      '1st Block Jayanagar','1st Phase JP Nagar','Banashankari',
      'Bannerghatta Road','Basavangudi','Bellandur','BTM Layout',
      'Electronic City','Hebbal','HSR Layout','Indira Nagar',
      'JP Nagar','Koramangala','Marathahalli','Rajaji Nagar',
      'Sarjapur Road','Whitefield','Yelahanka','Yeshwanthpur'
    ];
  }
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/* ─── Stepper Logic ─────────────────────────────────────────── */
function initSteppers() {
  document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;   // 'bhk' or 'bath'
      const dir    = parseInt(btn.dataset.dir);
      const hidden = document.getElementById(target);
      const display= document.getElementById(`${target}-val`);
      let val      = parseInt(hidden.value) + dir;
      val = Math.max(1, Math.min(10, val));
      hidden.value   = val;
      display.textContent = val;
      // Animate
      display.style.transform = 'scale(1.3)';
      setTimeout(() => (display.style.transform = ''), 150);
    });
  });
}

/* ─── Location Autocomplete ─────────────────────────────────── */
let activeIndex = -1;

function buildDropdown(filter) {
  const q = filter.trim().toLowerCase();
  dropdown.innerHTML = '';
  activeIndex = -1;

  const matches = q
    ? LOCATIONS.filter(l => l.toLowerCase().includes(q)).slice(0, 40)
    : LOCATIONS.slice(0, 40);

  if (!matches.length) {
    dropdown.classList.remove('open');
    return;
  }

  matches.forEach((loc, i) => {
    const li = document.createElement('li');
    li.textContent = loc;
    li.addEventListener('mousedown', e => {
      e.preventDefault(); // prevent input blur before click fires
      selectLocation(loc);
    });
    dropdown.appendChild(li);
  });

  dropdown.classList.add('open');
}

function selectLocation(loc) {
  locationInput.value  = loc;
  locationValue.value  = loc.toLowerCase();
  dropdown.classList.remove('open');
  locationHint.textContent = '';
  activeIndex = -1;
}

locationInput.addEventListener('input', () => {
  buildDropdown(locationInput.value);
  locationValue.value = '';
});

locationInput.addEventListener('focus', () => {
  buildDropdown(locationInput.value);
});

locationInput.addEventListener('blur', () => {
  // Small delay so mousedown on li fires first
  setTimeout(() => {
    dropdown.classList.remove('open');
    // Validate: if typed value doesn't match any location exactly
    const typed = locationInput.value.trim().toLowerCase();
    const match = LOCATIONS.find(l => l.toLowerCase() === typed);
    if (typed && !match) {
      locationHint.textContent = 'Location not in dataset — prediction may be approximate.';
      locationValue.value = typed;
    } else if (match) {
      locationValue.value = match.toLowerCase();
      locationHint.textContent = '';
    }
  }, 150);
});

// Keyboard navigation
locationInput.addEventListener('keydown', e => {
  const items = dropdown.querySelectorAll('li');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = (activeIndex + 1) % items.length;
    highlight(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = (activeIndex - 1 + items.length) % items.length;
    highlight(items);
  } else if (e.key === 'Enter') {
    if (activeIndex >= 0 && items[activeIndex]) {
      e.preventDefault();
      selectLocation(items[activeIndex].textContent);
    }
  } else if (e.key === 'Escape') {
    dropdown.classList.remove('open');
  }
});

function highlight(items) {
  items.forEach((li, i) => li.classList.toggle('active', i === activeIndex));
  if (activeIndex >= 0) {
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }
}

/* ─── Form Submission ───────────────────────────────────────── */
form.addEventListener('submit', async e => {
  e.preventDefault();

  // Basic validation
  if (!sqftInput.value || parseFloat(sqftInput.value) < 100) {
    sqftInput.focus();
    sqftInput.style.borderColor = 'var(--rust)';
    setTimeout(() => (sqftInput.style.borderColor = ''), 2000);
    return;
  }

  if (!locationValue.value) {
    locationHint.textContent = 'Please select or type a location.';
    locationInput.focus();
    return;
  }

  setLoading(true);

  const body = new FormData();
  body.append('total_sqft', sqftInput.value);
  body.append('bath',       bathInput.value);
  body.append('bhk',        bhkInput.value);
  body.append('location',   locationValue.value);

  try {
    const res  = await fetch(`${API_BASE}/predict_price`, { method: 'POST', body });
    const data = await res.json();

    if (data.price !== undefined) {
      showResult(data.price);
    } else {
      throw new Error('No price in response');
    }
  } catch (err) {
    alert('Could not reach the prediction server. Make sure server.py is running on port 5000.');
    console.error(err);
  } finally {
    setLoading(false);
  }
});

function setLoading(on) {
  submitBtn.disabled   = on;
  btnText.hidden       = on;
  btnLoader.hidden     = !on;
}

function showResult(price) {
  form.hidden         = true;
  resultPanel.hidden  = false;
  // Format: price is in Lakhs; convert to Crores if >= 100 Lakhs
  let formatted;
  if (price >= 100) {
    const crores = price / 100;
    formatted = `₹ ${crores.toFixed(2)} Crore${crores !== 1 ? 's' : ''}`;
  } else if (price >= 1) {
    formatted = `₹ ${price.toFixed(2)} Lakhs`;
  } else {
    // below 1 lakh — show in thousands
    const thousands = (price * 100).toFixed(0);
    formatted = `₹ ${thousands} Thousands`;
  }
  resultPrice.textContent = formatted;
}

/* ─── Reset ─────────────────────────────────────────────────── */
resetBtn.addEventListener('click', () => {
  form.hidden        = false;
  resultPanel.hidden = true;
  form.reset();
  bhkVal.textContent  = '2'; bhkInput.value  = '2';
  bathVal.textContent = '2'; bathInput.value = '2';
  locationInput.value = ''; locationValue.value = '';
  locationHint.textContent = '';
});

/* ─── Init ──────────────────────────────────────────────────── */
(async () => {
  initSteppers();
  await loadLocations();
})();