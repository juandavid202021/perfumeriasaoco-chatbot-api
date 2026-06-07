// ══════════════════════════════════════════════
//  js/models/PagoModel.js
//  Responsabilidad: datos de Medios de Pago
//  - Obtiene datos desde SheetsAPI
//  - Transforma al formato que necesita el chat
//  - Mantiene caché para evitar peticiones extra
// ══════════════════════════════════════════════

import { SheetsAPI } from '../services/SheetsAPI.js';

export const PagoModel = {
  async getAll() {
    const rows = await SheetsAPI.get('pagos');
    return rows.map(r => ({
      id:      r.id,
      medio:   (r.medio   || '').trim(),
      detalle: (r.detalle || '').trim()
    })).filter(p => p.medio);
  },

  async getFormattedText() {
    const all = await this.getAll();
    if (all.length === 0) {
      return 'No hay medios de pago configurados.\nContacta a un asesor para más información.';
    }
    return all.map(p => `💳 ${p.medio}\n${p.detalle}`).join('\n\n');
  }
};