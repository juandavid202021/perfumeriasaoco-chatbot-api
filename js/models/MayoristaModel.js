// ══════════════════════════════════════════════
//  js/models/MayoristaModel.js
//  Responsabilidad: datos de Imágenes Mayorista
//  - Obtiene IDs desde SheetsAPI
//  - Construye las URLs de Google Drive
//  - Prepara la secuencia de imágenes para
//    el chat lista para que el controlador
//    solo la ejecute
// ══════════════════════════════════════════════

import { SheetsAPI } from '../services/SheetsAPI.js';

export const MayoristaModel = {
  async getImagenes() {
    const rows = await SheetsAPI.get('mayorista');
    return rows
      .map(r => (r.imagen || '').trim())
      .filter(url => url);
  },

  async getImageSequence() {
    const imagenes = await this.getImagenes();
    if (imagenes.length === 0) return [];
    return imagenes.map(url => ({
      text:    url,
      delay:   600,
      isImage: true
    }));
  }
};