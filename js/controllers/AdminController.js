// ══════════════════════════════════════════════
//  js/controllers/AdminController.js
// ══════════════════════════════════════════════

import { ADMIN_PASSWORD, LS_AUTH } from '../config.js';
import { SheetsAPI }      from '../services/SheetsAPI.js';
import { FAQModel }       from '../models/FAQModel.js';
import { PagoModel }      from '../models/PagoModel.js';
import { PromoModel }     from '../models/PromoModel.js';
import { MayoristaModel } from '../models/MayoristaModel.js';
import { ConfigModel }    from '../models/ConfigModel.js';
import { AdminView }      from '../views/AdminView.js';

export const AdminController = {

  currentSection: 'faq',

  _data: {
    faq:        [],
    pagos:      [],
    promociones:[],
    mayorista:  [],
    config:     []
  },

  // ── INIT ─────────────────────────────────
  init() {
    this._bindEvents();
    if (sessionStorage.getItem(LS_AUTH) === '1') {
      AdminView.showAdminScreen();
      this.loadSection('faq');
    }
  },

  _bindEvents() {
    document.getElementById('pwd-input')
      .addEventListener('keydown', e => {
        if (e.key === 'Enter') this.login();
      });
    document.getElementById('login-btn')
      .addEventListener('click', () => this.login());
    document.getElementById('logout-btn')
      .addEventListener('click', () => this.logout());
    document.querySelector('.tabs')
      .addEventListener('click', e => {
        const btn = e.target.closest('[data-tab]');
        if (!btn) return;
        this.switchTab(btn.dataset.tab);
      });
    document.getElementById('add-faq-btn')
      .addEventListener('click', () => this.openModal('faq'));
    document.getElementById('add-pagos-btn')
      .addEventListener('click', () => this.openModal('pagos'));
    document.getElementById('add-promos-btn')
      .addEventListener('click', () => this.openModal('promociones'));
    document.getElementById('add-mayorista-btn')
      .addEventListener('click', () => this.openModal('mayorista'));
    document.getElementById('save-config-btn')
      .addEventListener('click', () => this.saveConfig());
    document.getElementById('modal-save-btn')
      .addEventListener('click', () => this.saveModal());
    document.getElementById('modal-cancel-btn')
      .addEventListener('click', () => AdminView.closeModal());
    document.getElementById('modal-bg')
      .addEventListener('click', e => {
        if (e.target === document.getElementById('modal-bg')) {
          AdminView.closeModal();
        }
      });
  },

  // ── LOGIN / LOGOUT ───────────────────────
  login() {
    const val = document.getElementById('pwd-input').value;
    if (val === ADMIN_PASSWORD) {
      sessionStorage.setItem(LS_AUTH, '1');
      AdminView.showAdminScreen();
      this.loadSection('faq');
    } else {
      AdminView.showLoginError('Contraseña incorrecta.');
    }
  },

  logout() {
    sessionStorage.removeItem(LS_AUTH);
    AdminView.reloadPage();
  },

  // ── TABS ─────────────────────────────────
  switchTab(section) {
    this.currentSection = section;
    AdminView.switchTab(section);
    this.loadSection(section);
  },

  // ── CARGA DE SECCIONES ───────────────────
  async loadSection(section) {
    if (section === 'faq')        await this._loadFAQ();
    if (section === 'pagos')      await this._loadPagos();
    if (section === 'promociones')await this._loadPromos();
    if (section === 'promos')      await this._loadPromos();
    if (section === 'mayorista')  await this._loadMayorista();
    if (section === 'config')     await this._loadConfig();
  },

  async _loadFAQ() {
    AdminView.showTableLoading('faq-tbody', 4);
    try {
      this._data.faq = await SheetsAPI.get('faq');
      AdminView.renderFAQ(
        this._data.faq,
        (id) => this.openModal('faq', id),
        (id) => this.deleteRow('faq', id)
      );
    } catch(e) {
      AdminView.showToast('Error cargando FAQ: ' + e.message, 'err');
    }
  },

  async _loadPagos() {
    AdminView.showTableLoading('pagos-tbody', 4);
    try {
      this._data.pagos = await SheetsAPI.get('pagos');
      AdminView.renderPagos(
        this._data.pagos,
        (id) => this.openModal('pagos', id),
        (id) => this.deleteRow('pagos', id)
      );
    } catch(e) {
      AdminView.showToast('Error cargando pagos: ' + e.message, 'err');
    }
  },

  async _loadPromos() {
    AdminView.showTableLoading('promos-tbody', 5);
    try {
      this._data.promociones = await SheetsAPI.get('promociones');
      AdminView.renderPromos(
        this._data.promociones,
        (id) => this.openModal('promociones', id),
        (id) => this.deleteRow('promociones', id)
      );
    } catch(e) {
      AdminView.showToast('Error cargando promos: ' + e.message, 'err');
    }
  },

  async _loadMayorista() {
    AdminView.showTableLoading('mayorista-tbody', 4);
    try {
      this._data.mayorista = await SheetsAPI.get('mayorista');
      AdminView.renderMayorista(
        this._data.mayorista,
        (id) => this.openModal('mayorista', id),
        (id) => this.deleteRow('mayorista', id)
      );
    } catch(e) {
      AdminView.showToast('Error cargando mayorista: ' + e.message, 'err');
    }
  },

  async _loadConfig() {
    try {
      this._data.config = await SheetsAPI.get('config');
      const numero = this._data.config.length > 0
        ? (this._data.config[0].numero_asesor || '')
        : '';
      AdminView.setConfigNumero(numero);
    } catch(e) {
      AdminView.showToast('Error cargando config: ' + e.message, 'err');
    }
  },

  // ── MODAL ────────────────────────────────
  openModal(table, id = null) {
    let rowData = null;
    if (id !== null) {
      rowData = this._data[table].find(r => r.id === id) || null;
    }
    this._modalContext = { table, rowData };
    AdminView.openModal(table, rowData);
  },

  async saveModal() {
    const { table, rowData } = this._modalContext;

    const error = AdminView.validateModalFields(table);
    if (error) { AdminView.showToast(error, 'err'); return; }

    AdminView.setSaveLoading(true);

    try {
      // Manejar subida de imagen si existe
      const imageFile = AdminView.getImageFile();
      let imageUrl = rowData ? (rowData.imagen || '') : '';

      if (imageFile) {
        // Determinar carpeta según tabla
        const folder = table === 'mayorista' ? 'mayorista' : 'promociones';
        // Si había imagen anterior la eliminamos
        if (imageUrl) await SheetsAPI.deleteImage(imageUrl);
        // Subir nueva imagen
        imageUrl = await SheetsAPI.uploadImage(folder, imageFile);
      }

      const { fields, toRow } = AdminView.getModalFields(table);

      // Inyectar URL de imagen en los campos
      if (table === 'promociones' || table === 'mayorista') {
        fields.imagen = imageUrl;
      }

      const row = toRow(fields);

      if (rowData) {
        await SheetsAPI.update(table, rowData.id, row);
        AdminView.showToast('Guardado correctamente');
      } else {
        await SheetsAPI.add(table, row);
        AdminView.showToast('Agregado correctamente');
      }

      AdminView.closeModal();
      await this.loadSection(table === 'promociones' ? 'promociones' : this.currentSection);

    } catch(e) {
      AdminView.showToast('Error: ' + e.message, 'err');
    }

    AdminView.setSaveLoading(false);
  },

  // ── DELETE ───────────────────────────────
  async deleteRow(table, id) {
    if (!confirm('¿Eliminar este registro?')) return;
    try {
      // Si tiene imagen la eliminamos del storage también
      const row = this._data[table].find(r => r.id === id);
      if (row && row.imagen) {
        await SheetsAPI.deleteImage(row.imagen);
      }
      await SheetsAPI.delete(table, id);
      AdminView.showToast('Eliminado correctamente');
      await this.loadSection(this.currentSection);
    } catch(e) {
      AdminView.showToast('Error: ' + e.message, 'err');
    }
  },

  // ── CONFIG ───────────────────────────────
  async saveConfig() {
    const numero = AdminView.getConfigNumero();
    if (!numero) { AdminView.showToast('Ingresa un número', 'err'); return; }
    try {
      if (this._data.config.length > 0) {
        await SheetsAPI.update('config', this._data.config[0].id, { numero_asesor: numero });
      } else {
        await SheetsAPI.add('config', { numero_asesor: numero });
      }
      AdminView.showToast('Número guardado correctamente');
      await this._loadConfig();
    } catch(e) {
      AdminView.showToast('Error: ' + e.message, 'err');
    }
  }
};
