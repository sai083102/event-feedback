document.addEventListener('DOMContentLoaded', () => {
  const form        = document.getElementById('preForm');
  const formCard    = document.getElementById('formCard');
  const successCard = document.getElementById('successCard');
  const submitBtn   = document.getElementById('submitBtn');

  initPillGroup('experiencePills', 'experience_level', 'experienceError');
  initCheckboxPills('topicPills');
  initCharCount('expectations', 'expCount', 500);

  // Live validation — clear errors as user types/selects
  ['name', 'email', 'role', 'expectations'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => clearError(id));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const topics = [...document.querySelectorAll('#topicPills .checkbox-pill.active')]
      .map(p => p.dataset.value);

    const payload = {
      form_type:        'pre',
      name:             document.getElementById('name').value.trim(),
      email:            document.getElementById('email').value.trim(),
      role:             document.getElementById('role').value.trim(),
      experience_level: document.getElementById('experience_level').value,
      topics,
      expectations:     document.getElementById('expectations').value.trim(),
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
    ok = checkField('role',  v => v.length >= 2,  'Please enter your role or designation.')  && ok;
    ok = checkField('expectations', v => v.length >= 10,
      'Please describe your expectations (at least 10 characters).')                          && ok;

    if (!document.getElementById('experience_level').value) {
      setError('experienceError', 'Please select your experience level.');
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

function initCheckboxPills(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.checkbox-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      pill.setAttribute('aria-pressed', pill.classList.contains('active'));
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
