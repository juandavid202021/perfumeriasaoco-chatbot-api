// ══════════════════════════════════════════════
//  js/models/ConfigModel.js
//  Responsabilidad: configuración del negocio
//  - Número de WhatsApp del asesor
//  - Construye las URLs de WhatsApp listas
//    para usar, sin que nadie más sepa
//    cómo se forma un enlace wa.me
// ══════════════════════════════════════════════

import { SheetsAPI } from '../services/SheetsAPI.js';
import { WA_MSG_CLIENTE, WA_MSG_MAYORISTA } from '../config.js';

export const ConfigModel = {
  async getNumero() {
    const rows = await SheetsAPI.get('config');
    if (!rows || rows.length === 0) return '';
    return (rows[0].numero_asesor || '').trim().replace(/\D/g, '');
  },

  async getWhatsAppURL(tipo = 'cliente') {
    const numero  = await this.getNumero();
    const mensaje = tipo === 'mayorista'
      ? WA_MSG_MAYORISTA
      : WA_MSG_CLIENTE;
    return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
  },

  async getClienteWA() {
    return {
      mensaje: WA_MSG_CLIENTE,
      url:     await this.getWhatsAppURL('cliente')
    };
  },

  async getMayoristaWA() {
    return {
      mensaje: WA_MSG_MAYORISTA,
      url:     await this.getWhatsAppURL('mayorista')
    };
  }
};