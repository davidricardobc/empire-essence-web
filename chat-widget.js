// Empire Essence — Chat Widget con AI (Alex)
// Botón elegante + chat conectado a n8n/Ollama
(function() {
  const WEBHOOK_URL = 'https://antonio-initially-remarks-mambo.trycloudflare.com/webhook/chat';
  const WA = '573156753404';

  // Estilos
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&family=Cormorant:wght@400;500;600&display=swap');

    #ee-chat * { margin:0; padding:0; box-sizing:border-box; }

    /* ═══ BOTÓN FLOTANTE ═══ */
    #ee-trigger {
      position:fixed; bottom:28px; left:28px; z-index:99998;
      display:flex; align-items:center; gap:0;
      cursor:pointer; user-select:none;
      animation: ee-enter 0.8s cubic-bezier(0.16,1,0.3,1) both;
      animation-delay: 2s;
    }
    @keyframes ee-enter {
      from { opacity:0; transform:translateY(40px) scale(0.8); }
      to { opacity:1; transform:translateY(0) scale(1); }
    }

    /* Tooltip "¿Te ayudo?" */
    #ee-tooltip {
      background: rgba(10,10,10,0.92);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(201,169,78,0.3);
      border-radius: 12px 12px 12px 4px;
      padding: 10px 16px;
      margin-left: 12px;
      order: 2;
      color: #f0ece2;
      font-family: 'Montserrat', sans-serif;
      font-size: 13px;
      font-weight: 400;
      white-space: nowrap;
      opacity: 0;
      transform: translateX(10px);
      animation: ee-tooltip-in 0.5s 3.5s cubic-bezier(0.16,1,0.3,1) forwards;
      transition: opacity 0.3s;
    }
    #ee-tooltip span { color: #c9a94e; font-weight: 500; }
    @keyframes ee-tooltip-in {
      to { opacity:1; transform:translateX(0); }
    }

    /* Botón circular */
    #ee-fab {
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #c9a94e 0%, #8a6914 100%);
      box-shadow: 0 4px 20px rgba(201,169,78,0.35), 0 0 0 0 rgba(201,169,78,0.4);
      display: flex; align-items: center; justify-content: center;
      transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
      position: relative;
    }
    #ee-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(201,169,78,0.5);
    }
    #ee-fab:active { transform: scale(0.95); }
    #ee-fab svg {
      width: 26px; height: 26px; fill: #0a0a0a;
      transition: transform 0.3s;
    }
    #ee-trigger.open #ee-fab svg.chat-icon { display:none; }
    #ee-trigger.open #ee-fab svg.close-icon { display:block; }
    #ee-trigger:not(.open) #ee-fab svg.close-icon { display:none; }

    /* Pulso sutil */
    #ee-fab::after {
      content:''; position:absolute; inset:-4px;
      border-radius:50%; border:2px solid rgba(201,169,78,0.3);
      animation: ee-ring 3s ease-in-out infinite;
    }
    @keyframes ee-ring {
      0%,100% { transform:scale(1); opacity:0.6; }
      50% { transform:scale(1.15); opacity:0; }
    }
    #ee-trigger.open #ee-fab::after { display:none; }

    /* ═══ VENTANA DE CHAT ═══ */
    #ee-window {
      position:fixed; bottom:100px; left:28px; z-index:99999;
      width:380px; max-width:calc(100vw - 24px);
      height:520px; max-height:calc(100vh - 140px);
      background: #0a0a0a;
      border: 1px solid rgba(201,169,78,0.25);
      border-radius: 20px;
      overflow:hidden;
      display:none; flex-direction:column;
      box-shadow: 0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,169,78,0.1);
      font-family: 'Montserrat', sans-serif;
    }
    #ee-window.open {
      display:flex;
      animation: ee-window-in 0.4s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes ee-window-in {
      from { opacity:0; transform:translateY(16px) scale(0.96); }
      to { opacity:1; transform:translateY(0) scale(1); }
    }

    /* Header */
    #ee-header {
      background: linear-gradient(180deg, #111 0%, #0a0a0a 100%);
      border-bottom: 1px solid rgba(201,169,78,0.15);
      padding: 18px 16px;
      display: flex; align-items: center; gap: 12px;
    }
    #ee-avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: linear-gradient(135deg, #c9a94e, #8a6914);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    #ee-header .info { flex:1; }
    #ee-header .name {
      color: #c9a94e; font-size: 14px; font-weight: 600;
      letter-spacing: 0.3px;
    }
    #ee-header .tagline {
      color: #6b6560; font-size: 11px; margin-top: 2px;
      font-style: italic;
    }

    /* Messages */
    #ee-msgs {
      flex:1; overflow-y:auto; padding:20px 16px;
      display:flex; flex-direction:column; gap:10px;
      scrollbar-width:thin; scrollbar-color:rgba(201,169,78,0.3) transparent;
    }
    .ee-msg {
      max-width:82%; padding:11px 15px; border-radius:18px;
      font-size:13.5px; line-height:1.55; color:#f0ece2;
      animation: ee-msg-in 0.35s cubic-bezier(0.16,1,0.3,1);
    }
    @keyframes ee-msg-in {
      from { opacity:0; transform:translateY(8px); }
      to { opacity:1; transform:translateY(0); }
    }
    .ee-msg.bot {
      background: #141414;
      border: 1px solid rgba(201,169,78,0.08);
      border-bottom-left-radius: 6px;
      align-self: flex-start;
    }
    .ee-msg.user {
      background: linear-gradient(135deg, rgba(201,169,78,0.2), rgba(160,124,42,0.15));
      border: 1px solid rgba(201,169,78,0.2);
      border-bottom-right-radius: 6px;
      align-self: flex-end;
    }
    .ee-msg a { color:#c9a94e; text-decoration:underline; }

    /* Typing */
    .ee-typing-wrap {
      display:flex; flex-direction:column; gap:4px; align-self:flex-start;
      animation: ee-msg-in 0.3s ease;
    }
    .ee-typing-label {
      color: rgba(201,169,78,0.6); font-size: 11px;
      font-family: 'Montserrat', sans-serif;
      padding-left: 4px;
    }
    .ee-typing {
      display:flex; gap:5px; padding:12px 16px;
      background:#141414; border:1px solid rgba(201,169,78,0.08);
      border-radius:18px; border-bottom-left-radius:6px;
    }
    .ee-typing span {
      width:6px; height:6px; border-radius:50%;
      background: rgba(201,169,78,0.5);
      animation: ee-dot 1.4s infinite;
    }
    .ee-typing span:nth-child(2) { animation-delay:0.2s; }
    .ee-typing span:nth-child(3) { animation-delay:0.4s; }
    @keyframes ee-dot {
      0%,60%,100% { transform:translateY(0); opacity:0.4; }
      30% { transform:translateY(-6px); opacity:1; }
    }

    /* Input */
    #ee-input-area {
      padding: 12px 14px;
      border-top: 1px solid rgba(201,169,78,0.1);
      display: flex; gap: 8px;
      background: #0e0e0e;
    }
    #ee-input {
      flex:1; background:#141414;
      border:1px solid rgba(201,169,78,0.12);
      border-radius:24px; padding:10px 18px;
      color:#f0ece2; font-size:13px;
      font-family:'Montserrat',sans-serif;
      outline:none; transition:border-color 0.2s;
    }
    #ee-input:focus { border-color:rgba(201,169,78,0.4); }
    #ee-input::placeholder { color:#4a4540; }
    #ee-send {
      width:40px; height:40px; border-radius:50%;
      background: linear-gradient(135deg,#c9a94e,#8a6914);
      border:none; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition: all 0.2s;
      opacity:0.7;
    }
    #ee-send:hover { opacity:1; transform:scale(1.05); }
    #ee-send svg { width:16px; height:16px; fill:#0a0a0a; }

    /* WhatsApp fallback link */
    .ee-wa-link {
      display:inline-flex; align-items:center; gap:6px;
      color:#25d366 !important; text-decoration:none !important;
      font-weight:500;
    }
    .ee-wa-link:hover { text-decoration:underline !important; }

    /* Power by */
    #ee-footer {
      text-align:center; padding:6px;
      font-size:9px; color:#2a2520; letter-spacing:0.5px;
    }

    /* Mobile responsive */
    @media (max-width: 480px) {
      #ee-window {
        width:100vw; height:100vh; max-height:100vh;
        bottom:0; left:0;
        border-radius:0; border:none;
      }
      #ee-trigger.open #ee-tooltip { display:none; }
    }
  `;
  document.head.appendChild(style);

  // HTML
  const container = document.createElement('div');
  container.id = 'ee-chat';
  container.innerHTML = `
    <div id="ee-trigger" onclick="EEChat.toggle()">
      <div id="ee-tooltip">¿Buscas tu <span>fragancia ideal</span>? 💬</div>
      <div id="ee-fab">
        <svg class="chat-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.76 1.36 5.22 3.5 6.84V22l3.74-2.06c.87.24 1.8.36 2.76.36 5.52 0 10-4.04 10-9S17.52 2 12 2zm1.07 12.15l-2.54-2.72L5.8 14.15l5.12-5.44 2.6 2.72 4.67-2.72-5.12 5.44z"/></svg>
        <svg class="close-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </div>
    </div>

    <div id="ee-window">
      <div id="ee-header">
        <div id="ee-avatar">👑</div>
        <div class="info">
          <div class="name">Alex · Tu Asesor</div>
          <div class="tagline">Empire Essence</div>
        </div>
      </div>
      <div id="ee-msgs"></div>
      <div id="ee-input-area">
        <input id="ee-input" type="text" placeholder="Escríbeme..." autocomplete="off">
        <button id="ee-send" onclick="EEChat.send()">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div id="ee-footer">EMPIRE ESSENCE</div>
    </div>
  `;
  document.body.appendChild(container);

  // Lógica
  const EEChat = {
    isOpen: false,
    greeted: false,

    toggle() {
      this.isOpen = !this.isOpen;
      const trigger = document.getElementById('ee-trigger');
      const win = document.getElementById('ee-window');
      const tooltip = document.getElementById('ee-tooltip');
      
      trigger.classList.toggle('open', this.isOpen);
      win.classList.toggle('open', this.isOpen);
      
      if (this.isOpen) {
        tooltip.style.opacity = '0';
        tooltip.style.pointerEvents = 'none';
        if (!this.greeted) {
          this.greeted = true;
          setTimeout(() => {
            this.showTyping();
            setTimeout(() => {
              this.hideTyping();
              this.addMsg('¡Hola! 👋 Soy Alex, tu asesor de fragancias.\n\n¿Buscas algo para ti, para regalar, o solo quieres explorar?', 'bot');
            }, 1200);
          }, 400);
        }
        setTimeout(() => document.getElementById('ee-input').focus(), 100);
      }
    },

    addMsg(text, sender) {
      const msgs = document.getElementById('ee-msgs');
      const d = document.createElement('div');
      d.className = 'ee-msg ' + sender;
      // Convert markdown bold and newlines
      let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#c9a94e">$1</strong>')
        .replace(/\n/g, '<br>');
      d.innerHTML = html;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    },

    showTyping() {
      const msgs = document.getElementById('ee-msgs');
      const wrap = document.createElement('div');
      wrap.className = 'ee-typing-wrap';
      wrap.id = 'ee-typing-wrap';
      wrap.innerHTML = `
        <div class="ee-typing-label">Alex está escribiendo...</div>
        <div class="ee-typing"><span></span><span></span><span></span></div>
      `;
      msgs.appendChild(wrap);
      msgs.scrollTop = msgs.scrollHeight;
    },

    hideTyping() {
      const el = document.getElementById('ee-typing-wrap');
      if (el) el.remove();
    },

    async send() {
      const input = document.getElementById('ee-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';

      this.addMsg(text, 'user');
      this.showTyping();
      
      const sendBtn = document.getElementById('ee-send');
      sendBtn.style.opacity = '0.3';
      sendBtn.style.pointerEvents = 'none';

      try {
        const res = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        this.hideTyping();
        const response = data.response || 'Disculpa, no pude procesar tu mensaje. ¿Podrías repetirlo?';
        this.addMsg(response, 'bot');
      } catch (err) {
        this.hideTyping();
        this.addMsg('Parece que tengo problemas de conexión 😔\n\n¿Te gustaría que te asesore por WhatsApp?\n<a class="ee-wa-link" href="https://wa.me/' + WA + '?text=Hola%2C%20quiero%20asesor%C3%ADa%20de%20fragancias" target="_blank">📲 Abrir WhatsApp</a>', 'bot');
      }

      sendBtn.style.opacity = '0.7';
      sendBtn.style.pointerEvents = 'auto';
      input.focus();
    }
  };

  // Enter key
  const initInput = () => {
    const el = document.getElementById('ee-input');
    if (el) {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); EEChat.send(); }
      });
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInput);
  } else {
    initInput();
  }

  // Auto-hide tooltip after 8s
  setTimeout(() => {
    const tt = document.getElementById('ee-tooltip');
    if (tt && !EEChat.isOpen) {
      tt.style.transition = 'opacity 1s';
      tt.style.opacity = '0';
      // Show again briefly every 30s
      setInterval(() => {
        if (!EEChat.isOpen && tt) {
          tt.style.opacity = '1';
          setTimeout(() => { if (!EEChat.isOpen) tt.style.opacity = '0'; }, 5000);
        }
      }, 30000);
    }
  }, 12000);

  window.EEChat = EEChat;
})();
