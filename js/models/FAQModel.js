// ══════════════════════════════════════════════
//  js/models/FAQModel.js
//  Responsabilidad: datos de Preguntas Frecuentes
//  - Obtiene datos desde SheetsAPI
//  - Transforma al formato que necesita el chat
//  - Mantiene caché para evitar peticiones extra
// ══════════════════════════════════════════════

import { SheetsAPI } from '../services/SheetsAPI.js';

export const FAQModel = {
  async getAll() {
    const rows = await SheetsAPI.get('faq');
    return rows.map(r => ({
      id:        r.id,
      pregunta:  (r.pregunta  || '').trim(),
      respuesta: (r.respuesta || '').trim()
    })).filter(f => f.pregunta && f.respuesta);
  },

  async getByIndex(index) {
    const all = await this.getAll();
    return all[index] || null;
  }
};