// ══════════════════════════════════════════════
//  js/models/PromoModel.js
//  Responsabilidad: datos de Promociones
//  - Obtiene datos desde SheetsAPI
//  - Transforma al formato que necesita el chat
//  - Construye la secuencia de mensajes lista
//    para que el controlador solo la ejecute
// ══════════════════════════════════════════════

import { SheetsAPI } from '../services/SheetsAPI.js';

export const PromoModel = {
  async getAll() {
    const rows = await SheetsAPI.get('promociones');
    return rows.map(r => ({
      id:          r.id,
      titulo:      (r.titulo      || '').trim(),
      descripcion: (r.descripcion || '').trim(),
      imagen:      (r.imagen      || '').trim()
    })).filter(p => p.titulo);
  },

  async getMessageSequence() {
    const all = await this.getAll();
    if (all.length === 0) return null;
    const sequence = [];
    all.forEach(promo => {
      sequence.push({
        text:  `🎁 ${promo.titulo}`,
        delay: 600
      });
      if (promo.imagen) {
        sequence.push({
          text:    promo.imagen,
          delay:   300,
          isImage: true
        });
      }
      sequence.push({
        text:  promo.descripcion,
        delay: 400
      });
    });
    return sequence;
  }
};