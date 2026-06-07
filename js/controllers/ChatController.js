// ══════════════════════════════════════════════
//  js/controllers/ChatController.js
//  Responsabilidad: coordinar el flujo del chat
//  - Recibe input del usuario
//  - Consulta los Models
//  - Le dice a ChatView qué renderizar
//  - Maneja estados y persistencia
// ══════════════════════════════════════════════

import { LS_STATE, LS_MSGS } from '../config.js';
import { FAQModel }       from '../models/FAQModel.js';
import { PagoModel }      from '../models/PagoModel.js';
import { PromoModel }     from '../models/PromoModel.js';
import { MayoristaModel } from '../models/MayoristaModel.js';
import { ConfigModel }    from '../models/ConfigModel.js';
import { ChatView }       from '../views/ChatView.js';

export const ChatController = {

  state:   'menu',
  botBusy: false,

  // ── INIT ─────────────────────────────────
  async init() {
    ChatView.initTheme();
    ChatView.initAutoResize();
    this._bindEvents();

    const msgs = this._loadMessages();
    setTimeout(async () => {
      ChatView.hideLoading();
      if (msgs.length === 0) {
        setTimeout(() => this.showWelcome(), 400);
      } else {
        await this._restoreChat(msgs);
      }
    }, 1800);
  },

  _bindEvents() {
    // Enviar con Enter
    document.getElementById('user-input')
      .addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

    // Botón enviar
    document.getElementById('send-btn')
      .addEventListener('click', () => this.sendMessage());

    // Botón tema
    document.getElementById('theme-btn')
      .addEventListener('click', () => ChatView.toggleTheme());

    // Botón config
    document.getElementById('config-btn')
      .addEventListener('click', () => ChatView.openConfig());

    // Cerrar config al hacer click en fondo
    document.getElementById('config-panel')
      .addEventListener('click', (e) => {
        if (e.target === document.getElementById('config-panel')) {
          ChatView.closeConfig();
        }
      });

    // Limpiar chat
    document.getElementById('clear-chat-btn')
      .addEventListener('click', () => this.clearChat());

    // Cerrar config
    document.getElementById('close-config-btn')
      .addEventListener('click', () => ChatView.closeConfig());
  },

  // ── PERSISTENCIA ─────────────────────────
  _loadMessages() {
    try {
      const msgs = JSON.parse(localStorage.getItem(LS_MSGS) || '[]');
      this.state = localStorage.getItem(LS_STATE) || 'menu';
      return msgs;
    } catch(e) { return []; }
  },

  _saveMessages(msgs) {
    try {
      localStorage.setItem(LS_MSGS, JSON.stringify(msgs.slice(-80)));
      localStorage.setItem(LS_STATE, this.state);
    } catch(e) {}
  },

  async _restoreChat(msgs) {
  let lastRole = null;
  for (const m of msgs) {
    const isFirst = m.role !== lastRole;
    let waUrl = null;
    if (m.isWA) {
      const tipo = m.content.includes('MAYORISTA') ? 'mayorista' : 'cliente';
      waUrl = await ConfigModel.getWhatsAppURL(tipo);
    }
    await ChatView.renderBubble({
      role:    m.role,
      content: m.content,
      time:    m.time,
      isFirst,
      isImage: m.isImage || false,
      animate: false,
      isWA:    m.isWA   || false,
      waUrl
    });
    lastRole = m.role;
  }
  ChatView.scrollBottom(false);
  this._updateQuickReplies();
},

  clearChat() {
  localStorage.removeItem(LS_MSGS);
  localStorage.removeItem(LS_STATE);
  this.state  = 'menu';
  this.botBusy = false;
  document.getElementById('send-btn').disabled = false;
  ChatView.clearMessages();
  ChatView.clearQuickReplies();
  ChatView.closeConfig();
  setTimeout(() => this.showWelcome(), 300);
},

  // ── ENVÍO DE MENSAJES ────────────────────
  async sendMessage() {
    if (this.botBusy) return;
    const raw = ChatView.getInput();
    if (!raw) return;

    ChatView.clearInput();
    ChatView.setSendDisabled(true);
    ChatView.clearQuickReplies();
    this.botBusy = true;

    // Guardar y renderizar mensaje del usuario
    const msgs    = this._loadMessages();
    const last    = msgs[msgs.length - 1];
    const isFirst = !last || last.role !== 'user';
    const time    = ChatView.nowTime();
    msgs.push({ role: 'user', content: raw, time });
    this._saveMessages(msgs);
    await ChatView.renderBubble({
      role: 'user', content: raw, time, isFirst,
      isImage: false, animate: true, isWA: false
    });
    ChatView.scrollBottom();

    await this._processInput(raw);

    this.botBusy = false;
    ChatView.setSendDisabled(false);
    this._updateQuickReplies();
  },

  // ── DETECCIÓN DE INTENT ──────────────────
  _detectIntent(text) {
    const t = text.toLowerCase().trim();
    const menuTriggers = [
      'hola','menu','menú','volver','inicio',
      'empezar','start','hey','buenas','buenos',
      'hi','hello','regresar'
    ];
    const salirTriggers = [
      'adios','adiós','chao','bye','salir',
      'hasta luego','hasta pronto'
    ];
    if (menuTriggers.some(k => t === k || t.startsWith(k + ' '))) return 'MENU';
    if (salirTriggers.some(k => t.includes(k))) return 'SALIR';
    return 'INPUT';
  },

  async _processInput(raw) {
    const intent = this._detectIntent(raw);
    if (intent === 'MENU')  { await this.showMenu(); return; }
    if (intent === 'SALIR') { await this.showGoodbye(); return; }

    const num = parseInt(raw.trim());
    const txt = raw.toLowerCase().trim();

    switch(this.state) {
      case 'menu':           await this._handleMenu(num); break;
      case 'faq':            await this._handleFAQ(num); break;
      case 'mayorista':      await this._handleMayorista(num, txt); break;
      case 'faq_respuesta':  await this._handlePostRespuesta(num); break;
      case 'faq_post':       await this._handlePostFAQ(num); break;
      case 'finalizado':
        await this._botSay('¡Hola de nuevo! 👋 Escribe "menú" para empezar.', 600);
        break;
      default: await this.showMenu();
    }
  },

  // ── BOT SAY ──────────────────────────────
  // Muestra typing → espera delay → renderiza
  async _botSay(text, delay = 800, isImage = false, isWA = false, waUrl = null) {
    return new Promise(resolve => {
      ChatView.showTyping();
      setTimeout(async () => {
        ChatView.hideTyping();
        const msgs    = this._loadMessages();
        const last    = msgs[msgs.length - 1];
        const isFirst = !last || last.role !== 'bot';
        const time    = ChatView.nowTime();
        msgs.push({ role: 'bot', content: text, time, isImage, isWA });
        this._saveMessages(msgs);
        await ChatView.renderBubble({
          role: 'bot', content: text, time, isFirst,
          isImage, animate: true, isWA, waUrl
        });
        ChatView.scrollBottom();
        resolve();
      }, delay);
    });
  },

  async _botSaySequence(messages) {
    for (const m of messages) {
      await this._botSay(
        m.text,
        m.delay   || 700,
        m.isImage || false,
        m.isWA    || false,
        m.waUrl   || null
      );
    }
  },

  // ── QUICK REPLIES ────────────────────────
  async _updateQuickReplies() {
  const map = {
    menu:          ['1','2','3','4','5'],
    mayorista:     ['1 — Sí','2 — No'],
    faq_respuesta: ['1 — Menú','2 — Salir'],
    faq_post:      ['1 — Otra','2 — Menú','3 — Salir']
  };

  const chips = map[this.state];

  if (chips && chips.length) {
    ChatView.setQuickReplies(chips, (val) => {
      document.getElementById('user-input').value = val;
      this.sendMessage();
    });
  } else {
    ChatView.clearQuickReplies();
  }
},

  // ── WELCOME / MENU ───────────────────────
  async showWelcome() {
    this.state = 'menu';
    await this._botSaySequence([
      { text: '¡Hola! 👋\n\nBienvenido a SAOCO PERFUMES 🌸', delay: 600 },
      { text: this._buildMainMenu(), delay: 900 }
    ]);
    this._updateQuickReplies();
    this._saveMessages(this._loadMessages());
  },

  async showMenu() {
    this.state = 'menu';
    localStorage.setItem(LS_STATE, this.state);
    await this._botSay(this._buildMainMenu(), 700);
    this._updateQuickReplies();
  },

  _buildMainMenu() {
    return `¿En qué podemos ayudarte?\n\n1. Preguntas frecuentes\n2. Clientes mayoristas\n3. Promociones\n4. Medios de pago\n5. Comunicarme con un asesor\n\nSelecciona una opción del 1 al 5.`;
  },

  async _handleMenu(num) {
    switch(num) {
      case 1: await this._showFAQ(); break;
      case 2: await this._showMayorista(); break;
      case 3: await this._showPromociones(); break;
      case 4: await this._showPayments(); break;
      case 5: await this._showAsesor(); break;
      default:
        await this._botSay('Por favor selecciona una opción del 1 al 5. 🌸', 500);
    }
  },

  // ── OPCIÓN 1: FAQ ────────────────────────
  async _showFAQ() {
    this.state = 'faq';
    localStorage.setItem(LS_STATE, this.state);
    let faqs = [];
    try { faqs = await FAQModel.getAll(); } catch(e) {
      await this._botSay('😔 No se pudo cargar las preguntas. Intenta de nuevo.', 700);
      return;
    }
    if (faqs.length === 0) {
      await this._botSay('😔 No hay preguntas disponibles en este momento.', 700);
      this.state = 'faq_respuesta';
      return;
    }
    const list = faqs.map((f, i) => `${i + 1}. ${f.pregunta}`).join('\n');
    await this._botSay(
      `❓ Preguntas frecuentes:\n\n${list}\n\nResponde con el número de la pregunta.`,
      800
    );
  },

  async _handleFAQ(num) {
    const faqs = await FAQModel.getAll();
    if (num >= 1 && num <= faqs.length) {
      const f = faqs[num - 1];
      this.state = 'faq_post';
      localStorage.setItem(LS_STATE, this.state);
      await this._botSaySequence([
        { text: `❓ ${f.pregunta}\n\n${f.respuesta}`, delay: 700 },
        { text: `━━━━━━━━━━━━━━━\n1. Otra pregunta\n2. Volver al menú\n3. Salir`, delay: 500 }
      ]);
    } else {
      await this._botSay(`Por favor responde con un número del 1 al ${faqs.length}.`, 500);
    }
  },

  // ── OPCIÓN 2: MAYORISTAS ─────────────────
  async _showMayorista() {
    this.state = 'mayorista';
    localStorage.setItem(LS_STATE, this.state);
    const imgSeq = await MayoristaModel.getImageSequence();
    const waUrl  = await ConfigModel.getWhatsAppURL('mayorista');
    await this._botSaySequence([
      ...imgSeq,
      {
        text:  '🤝 Clientes Mayoristas SAOCO PERFUMES\n\n¿Quieres hablar con un asesor?\n\n1. Sí\n2. No',
        delay: 700
      }
    ]);
  },

  async _handleMayorista(num, txt) {
    const yes = num === 1 || txt === 'si' || txt === 'sí';
    const no  = num === 2 || txt === 'no';
    this.state = 'faq_respuesta';
    localStorage.setItem(LS_STATE, this.state);
    if (yes) {
      const waUrl = await ConfigModel.getWhatsAppURL('mayorista');
      await this._botSaySequence([
        { text: '✅ Perfecto. Te conectamos con nuestro asesor mayorista.', delay: 700 },
        { text: 'Hola, soy cliente MAYORISTA y me interesa recibir información sobre compras al por mayor en SAOCO PERFUMES.', delay: 200, isWA: true, waUrl },
        { text: '━━━━━━━━━━━━━━━\n1. Volver al menú\n2. Salir', delay: 400 }
      ]);
    } else if (no) {
      await this._botSaySequence([
        { text: '😊 Entendido.', delay: 700 },
        { text: '━━━━━━━━━━━━━━━\n1. Volver al menú\n2. Salir', delay: 400 }
      ]);
    } else {
      await this._botSay('Por favor responde:\n1 para Sí\n2 para No.', 500);
      this.state = 'mayorista';
      localStorage.setItem(LS_STATE, this.state);
    }
  },

  // ── OPCIÓN 3: PROMOCIONES ────────────────
  async _showPromociones() {
    this.state = 'faq_respuesta';
    localStorage.setItem(LS_STATE, this.state);
    const seq = await PromoModel.getMessageSequence();
    if (!seq) {
      await this._botSaySequence([
        { text: '😔 No hay promociones disponibles en este momento.', delay: 700 },
        { text: '━━━━━━━━━━━━━━━\n1. Volver al menú\n2. Salir', delay: 500 }
      ]);
      return;
    }
    await this._botSaySequence([
      ...seq,
      { text: '━━━━━━━━━━━━━━━\n1. Volver al menú\n2. Salir', delay: 500 }
    ]);
  },

  // ── OPCIÓN 4: PAGOS ──────────────────────
  async _showPayments() {
    this.state = 'faq_respuesta';
    localStorage.setItem(LS_STATE, this.state);
    const txt = await PagoModel.getFormattedText();
    await this._botSaySequence([
      { text: `💳 Medios de Pago SAOCO PERFUMES\n\n${txt}`, delay: 700 },
      { text: '━━━━━━━━━━━━━━━\n1. Volver al menú\n2. Salir', delay: 500 }
    ]);
  },

  // ── OPCIÓN 5: ASESOR ─────────────────────
  async _showAsesor() {
    this.state = 'faq_respuesta';
    localStorage.setItem(LS_STATE, this.state);
    const waUrl = await ConfigModel.getWhatsAppURL('cliente');
    await this._botSaySequence([
      { text: '💬 Con gusto te conectamos con uno de nuestros asesores.', delay: 600 },
      { text: 'Hola, me interesa recibir asesoría de SAOCO PERFUMES.', delay: 120, isWA: true, waUrl },
      { text: '━━━━━━━━━━━━━━━\n1. Volver al menú\n2. Salir', delay: 400 }
    ]);
  },

  // ── POST HANDLERS ────────────────────────
  async _handlePostRespuesta(num) {
    if      (num === 1) await this.showMenu();
    else if (num === 2) await this.showGoodbye();
    else await this._botSay('Por favor responde:\n1 para volver al menú\n2 para salir.', 500);
  },

  async _handlePostFAQ(num) {
    if      (num === 1) await this._showFAQ();
    else if (num === 2) await this.showMenu();
    else if (num === 3) await this.showGoodbye();
    else await this._botSay('Por favor responde:\n1 para otra pregunta\n2 para menú\n3 para salir.', 500);
  },

  // ── GOODBYE ──────────────────────────────
  async showGoodbye() {
    this.state = 'finalizado';
    localStorage.setItem(LS_STATE, this.state);
    await this._botSay(
      '👋 Gracias por comunicarte con SAOCO PERFUMES.\n\n¡Te esperamos pronto! 🌸',
      700
    );
    ChatView.clearQuickReplies();
  }
};
