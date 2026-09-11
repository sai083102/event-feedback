document.addEventListener('DOMContentLoaded', () => {
  const form        = document.getElementById('preForm');
  const formCard    = document.getElementById('formCard');
  const successCard = document.getElementById('successCard');
  const submitBtn   = document.getElementById('submitBtn');

  initPillGroup('banquetPills', 'attended_banquet', 'banquetError');
  initCharCount('worked_well',       'workedWellCount',       500);
  initCharCount('improve_last_year', 'improveLastYearCount',  500);
  initCharCount('keep_repeat',       'keepRepeatCount',       500);
  initCharCount('one_change',        'oneChangeCount',        500);

  // Live validation — clear errors as user types/selects
  ['name', 'email', 'worked_well', 'improve_last_year', 'keep_repeat', 'one_change'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => clearError(id));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      form_type:          'pre',
      name:                document.getElementById('name').value.trim(),
      email:               document.getElementById('email').value.trim(),
      attended_banquet:    document.getElementById('attended_banquet').value,
      worked_well:         document.getElementById('worked_well').value.trim(),
      improve_last_year:   document.getElementById('improve_last_year').value.trim(),
      keep_repeat:         document.getElementById('keep_repeat').value.trim(),
      one_change:          document.getElementById('one_change').value.trim(),
    };

    try {
      const res = await fetch('/api/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      formCard.hidden    = false;
      successCard.hidden = false;
      formCard.hidden    = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      showToast('Submission failed — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });

  /* ---------- helpers ---------- */

  function validate() {
    let ok = true;
    ok = checkField('name',  v => v.length >= 2,  'Please enter your full name.')            && ok;
    ok = checkField('email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address.') && ok;
    ok = checkField('worked_well', v => v.length >= 5,
      'Please share what worked well (at least 5 characters).')                                && ok;
    ok = checkField('improve_last_year', v => v.length >= 5,
      'Please share what could be better (at least 5 characters).')                            && ok;
    ok = checkField('keep_repeat', v => v.length >= 5,
      'Please share what we should keep (at least 5 characters).')                             && ok;
    ok = checkField('one_change', v => v.length >= 5,
      'Please share the one change you\'d make (at least 5 characters).')                       && ok;

    if (!document.getElementById('attended_banquet').value) {
      setError('banquetError', 'Please select Yes or No.');
      ok = false;
    }
    return ok;
  }

  function checkField(id, testFn, msg) {
    const el  = document.getElementById(id);
    const val = el.value.trim();
    if (!testFn(val)) {
      el.classList.add('error');
      setError(id + 'Error', msg);
      return false;
    }
    clearError(id);
    return true;
  }

  function clearError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('error');
    const err = document.getElementById(id + 'Error');
    if (err) err.textContent = '';
  }

  function setError(errId, msg) {
    const el = document.getElementById(errId);
    if (el) el.textContent = msg;
  }

  function setLoading(state) {
    submitBtn.disabled = state;
    submitBtn.classList.toggle('loading', state);
  }
});

/* =========================================
   Shared UI helpers (also used by post-form)
   ========================================= */

function initPillGroup(groupId, hiddenId, errorId) {
  const group  = document.getElementById(groupId);
  const hidden = document.getElementById(hiddenId);
  if (!group || !hidden) return;

  group.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      group.querySelectorAll('.pill').forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-pressed', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');
      hidden.value = pill.dataset.value;
      if (errorId) {
        const err = document.getElementById(errorId);
        if (err) err.textContent = '';
      }
    });
  });
}

function initCharCount(textareaId, counterId, max) {
  const textarea = document.getElementById(textareaId);
  const counter  = document.getElementById(counterId);
  if (!textarea || !counter) return;

  textarea.addEventListener('input', () => {
    if (textarea.value.length > max) textarea.value = textarea.value.slice(0, max);
    const len = textarea.value.length;
    counter.textContent = len;
    counter.style.color = len > max * 0.9 ? 'var(--error)' : '';
  });
}

function showToast(msg) {
  let toast = document.getElementById('_toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_toast';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
      background: '#1e293b', color: 'white', padding: '0.75rem 1.25rem',
      borderRadius: '8px', fontSize: '0.875rem', zIndex: '300',
      boxShadow: '0 4px 16px rgba(0,0,0,0.2)', maxWidth: '90vw', textAlign: 'center',
    });
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.display = 'none'; }, 4000);
}
