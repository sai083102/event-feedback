document.addEventListener('DOMContentLoaded', () => {
  const form        = document.getElementById('postForm');
  const formCard    = document.getElementById('formCard');
  const successCard = document.getElementById('successCard');
  const submitBtn   = document.getElementById('submitBtn');

  initStarRating();
  initPillGroup('recommendPills', 'recommend', 'recommendError');
  initCharCount('went_well', 'wellCount',    500);
  initCharCount('improve',   'improveCount', 500);
  initCharCount('comments',  'commentsCount', 500);

  // Live validation — clear errors as user types
  ['name', 'email', 'went_well'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => clearFieldError(id));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    const payload = {
      form_type:  'post',
      name:       document.getElementById('name').value.trim(),
      email:      document.getElementById('email').value.trim(),
      rating:     parseInt(document.getElementById('rating').value, 10),
      went_well:  document.getElementById('went_well').value.trim(),
      improve:    document.getElementById('improve').value.trim(),
      recommend:  document.getElementById('recommend').value,
      comments:   document.getElementById('comments').value.trim(),
    };

    try {
      const res = await fetch('/api/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      formCard.hidden    = true;
      successCard.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      showToast('Submission failed — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });

  /* ---------- star rating ---------- */

  function initStarRating() {
    const stars       = document.querySelectorAll('#starRating .star');
    const ratingInput = document.getElementById('rating');
    const label       = document.getElementById('ratingLabel');
    const labels      = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    let selected      = 0;

    function paint(n) {
      stars.forEach((s, i) => {
        s.classList.toggle('lit',    i < n);
        s.classList.toggle('active', i < selected);
      });
    }

    stars.forEach((star, idx) => {
      const val = idx + 1;

      star.addEventListener('mouseenter', () => paint(val));
      star.addEventListener('mouseleave', () => paint(selected));

      star.addEventListener('click', () => {
        selected          = val;
        ratingInput.value = val;
        label.textContent = `${val} / 5 — ${labels[val]}`;
        label.style.color = 'var(--text)';
        paint(selected);
        const err = document.getElementById('ratingError');
        if (err) err.textContent = '';
      });

      // Keyboard: space / enter to select
      star.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); star.click(); }
      });
    });
  }

  /* ---------- validation ---------- */

  function validate() {
    let ok = true;
    ok = checkField('name',  v => v.length >= 2,  'Please enter your full name.')           && ok;
    ok = checkField('email', v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Enter a valid email address.') && ok;
    ok = checkField('went_well', v => v.length >= 10,
      'Please describe what went well (at least 10 characters).')                            && ok;

    if (!document.getElementById('rating').value) {
      document.getElementById('ratingError').textContent = 'Please select a star rating.';
      ok = false;
    }

    if (!document.getElementById('recommend').value) {
      document.getElementById('recommendError').textContent = 'Please choose an option.';
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
    clearFieldError(id);
    return true;
  }

  function clearFieldError(id) {
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
   Shared helpers (duplicated from pre-form
   so each page is self-contained)
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
