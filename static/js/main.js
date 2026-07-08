/* =========================================
   Navigation — mobile toggle
   ========================================= */
(function () {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on nav-link click (mobile)
  links.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
    });
  });
})();

/* =========================================
   Chatbot Widget
   =========================================
   To wire in a real API later:
     1. Set ChatBot.apiEndpoint to your endpoint URL
     2. The endpoint should accept POST { message: string }
        and return JSON { reply: string }
   ========================================= */
const ChatBot = {
  apiEndpoint: null, // e.g. '/api/chat' or 'https://your-api/chat'

  init() {
    this.panel    = document.getElementById('chatPanel');
    this.toggle   = document.getElementById('chatToggle');
    this.closeBtn = document.getElementById('chatClose');
    this.input    = document.getElementById('chatInput');
    this.sendBtn  = document.getElementById('chatSend');
    this.messages = document.getElementById('chatMessages');
    this.badge    = document.getElementById('chatBadge');

    if (!this.panel) return;

    this.toggle.addEventListener('click',  () => this.open());
    this.closeBtn.addEventListener('click', () => this.close());
    this.sendBtn.addEventListener('click',  () => this.send());

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panel.classList.contains('open')) this.close();
    });
  },

  open() {
    this.panel.classList.add('open');
    if (this.badge) this.badge.style.display = 'none';
    requestAnimationFrame(() => this.input.focus());
  },

  close() {
    this.panel.classList.remove('open');
  },

  addMessage(text, role) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const el = document.createElement('div');
    el.className = `chat-message ${role}`;
    el.innerHTML = `
      <div class="message-bubble">${this._escape(text)}</div>
      <div class="message-time">${time}</div>
    `;
    this.messages.appendChild(el);
    this.messages.scrollTop = this.messages.scrollHeight;
  },

  async send() {
    const text = this.input.value.trim();
    if (!text) return;

    this.addMessage(text, 'user');
    this.input.value = '';
    this.input.disabled = true;
    this.sendBtn.disabled = true;

    if (this.apiEndpoint) {
      // ---- Real API call ----
      try {
        const res  = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        this.addMessage(data.reply || "Sorry, I didn't catch that.", 'bot');
      } catch {
        this.addMessage("Couldn't reach the assistant. Please try again.", 'bot');
      }
    } else {
      // ---- Placeholder response ----
      setTimeout(() => {
        this.addMessage('Thanks! Our assistant will respond shortly.', 'bot');
      }, 650);
    }

    this.input.disabled = false;
    this.sendBtn.disabled = false;
    this.input.focus();
  },

  _escape(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },
};

document.addEventListener('DOMContentLoaded', () => ChatBot.init());
