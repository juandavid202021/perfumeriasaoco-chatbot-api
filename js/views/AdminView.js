// ══════════════════════════════════════════════
//  js/views/AdminView.js
// ══════════════════════════════════════════════

export const AdminView = {

  // ── LOGIN ──────────────────────────────────
  showLoginError(msg) {
    document.getElementById('login-error').textContent = msg;
  },

  showAdminScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-screen').classList.add('visible');
  },

  reloadPage() { location.reload(); },

  // ── TABS ───────────────────────────────────
  switchTab(section) {
    document.querySelectorAll('.tab-btn')
      .forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-tab="${section}"]`)
      .classList.add('active');
    document.querySelectorAll('.section')
      .forEach(s => s.classList.remove('active'));
    document.getElementById(`sec-${section}`)
      .classList.add('active');
  },

  // ── TOAST ──────────────────────────────────
  showToast(msg, type = 'ok') {
    const t = document.getElementById('toast');
    t.textContent = (type === 'ok' ? '✓ ' : '✕ ') + msg;
    t.className = `show ${type}`;
    setTimeout(() => { t.className = ''; }, 3000);
  },

  // ── TABLA LOADING ──────────────────────────
  showTableLoading(tbodyId, cols) {
    document.getElementById(tbodyId).innerHTML = `
      <tr class="loading-row">
        <td colspan="${cols}"><div class="spinner"></div></td>
      </tr>`;
  },

  showTableEmpty(tbodyId, cols, msg) {
    document.getElementById(tbodyId).innerHTML = `
      <tr>
        <td colspan="${cols}" class="empty-state">${msg}</td>
      </tr>`;
  },

  // ── TABLAS ─────────────────────────────────
  renderFAQ(data, onEdit, onDelete) {
    const tb = document.getElementById('faq-tbody');
    if (!data.length) {
      this.showTableEmpty('faq-tbody', 4, 'No hay preguntas aún.');
      return;
    }
    tb.innerHTML = data.map((r, i) => `
      <tr>
        <td style="color:var(--text-sub);width:36px">${i + 1}</td>
        <td style="max-width:200px;word-break:break-word">${this._esc(r.pregunta)}</td>
        <td style="max-width:260px;word-break:break-word;color:var(--text-sub)">${this._esc(r.respuesta)}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-ghost btn-sm" data-id="${r.id}" data-action="edit">Editar</button>
            <button class="btn btn-red btn-sm"   data-id="${r.id}" data-action="delete">Eliminar</button>
          </div>
        </td>
      </tr>`).join('');
    this._bindTableActions(tb, onEdit, onDelete);
  },

  renderPagos(data, onEdit, onDelete) {
    const tb = document.getElementById('pagos-tbody');
    if (!data.length) {
      this.showTableEmpty('pagos-tbody', 4, 'No hay medios de pago.');
      return;
    }
    tb.innerHTML = data.map((r, i) => `
      <tr>
        <td style="color:var(--text-sub);width:36px">${i + 1}</td>
        <td style="font-weight:500">${this._esc(r.medio)}</td>
        <td style="color:var(--text-sub);max-width:280px;word-break:break-word">${this._esc(r.detalle)}</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-ghost btn-sm" data-id="${r.id}" data-action="edit">Editar</button>
            <button class="btn btn-red btn-sm"   data-id="${r.id}" data-action="delete">Eliminar</button>
          </div>
        </td>
      </tr>`).join('');
    this._bindTableActions(tb, onEdit, onDelete);
  },

  renderPromos(data, onEdit, onDelete) {
    const tb = document.getElementById('promos-tbody');
    if (!data.length) {
      this.showTableEmpty('promos-tbody', 5, 'No hay promociones.');
      return;
    }
    tb.innerHTML = data.map((r, i) => `
      <tr>
        <td style="color:var(--text-sub);width:36px">${i + 1}</td>
        <td style="font-weight:500">${this._esc(r.titulo)}</td>
        <td style="color:var(--text-sub);max-width:200px;word-break:break-word">${this._esc(r.descripcion)}</td>
        <td>${r.imagen
          ? `<img src="${r.imagen}"
                  style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--border)"
                  onerror="this.style.display='none'">`
          : '<span style="color:var(--text-sub);font-size:12px">Sin imagen</span>'
        }</td>
        <td>
          <div class="td-actions">
            <button class="btn btn-ghost btn-sm" data-id="${r.id}" data-action="edit">Editar</button>
            <button class="btn btn-red btn-sm"   data-id="${r.id}" data-action="delete">Eliminar</button>
          </div>
        </td>
      </tr>`).join('');
    this._bindTableActions(tb, onEdit, onDelete);
  },

  renderMayorista(data, onEdit, onDelete) {
    const tb = document.getElementById('mayorista-tbody');
    if (!data.length) {
      this.showTableEmpty('mayorista-tbody', 4, 'No hay imágenes.');
      return;
    }
    tb.innerHTML = data.map((r, i) => `
      <tr>
        <td style="color:var(--text-sub);width:36px">${i + 1}</td>
        <td>${r.imagen
          ? `<img src="${r.imagen}"
                  style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid var(--border)"
                  onerror="this.style.display='none'">`
          : '<span style="color:var(--text-sub);font-size:12px">Sin imagen</span>'
        }</td>
        <td style="font-family:monospace;font-size:11px;color:var(--text-sub);word-break:break-all">
          ${r.imagen ? this._esc(r.imagen) : ''}
        </td>
        <td>
          <div class="td-actions">
            <button class="btn btn-ghost btn-sm" data-id="${r.id}" data-action="edit">Editar</button>
            <button class="btn btn-red btn-sm"   data-id="${r.id}" data-action="delete">Eliminar</button>
          </div>
        </td>
      </tr>`).join('');
    this._bindTableActions(tb, onEdit, onDelete);
  },

  setConfigNumero(numero) {
    document.getElementById('config-numero').value = numero || '';
  },

  getConfigNumero() {
    return document.getElementById('config-numero').value.trim();
  },

  // ── MODAL ──────────────────────────────────
  _modalConfigs: {
    faq: {
      titleAdd:  'Agregar pregunta',
      titleEdit: 'Editar pregunta',
      fields: [
        { id: 'pregunta',  label: 'PREGUNTA',  type: 'input',
          placeholder: 'Ej: ¿Hacen envíos a todo el país?' },
        { id: 'respuesta', label: 'RESPUESTA', type: 'textarea',
          placeholder: 'Respuesta completa para el cliente…' }
      ],
      toRow: (f) => ({ pregunta: f.pregunta, respuesta: f.respuesta })
    },
    pagos: {
      titleAdd:  'Agregar medio de pago',
      titleEdit: 'Editar medio de pago',
      fields: [
        { id: 'medio',   label: 'MEDIO',   type: 'input',
          placeholder: 'Ej: Nequi, Bancolombia…' },
        { id: 'detalle', label: 'DETALLE', type: 'textarea',
          placeholder: 'Número de cuenta, instrucciones…' }
      ],
      toRow: (f) => ({ medio: f.medio, detalle: f.detalle })
    },
    promociones: {
      titleAdd:  'Agregar promoción',
      titleEdit: 'Editar promoción',
      fields: [
        { id: 'titulo',      label: 'TÍTULO',      type: 'input',
          placeholder: 'Ej: 2x1 en perfumes orientales' },
        { id: 'descripcion', label: 'DESCRIPCIÓN', type: 'textarea',
          placeholder: 'Detalles de la promoción…' },
        { id: 'imagen', label: 'IMAGEN', type: 'image',
          optional: true }
      ],
      toRow: (f) => ({ titulo: f.titulo, descripcion: f.descripcion, imagen: f.imagen || '' })
    },
    mayorista: {
      titleAdd:  'Agregar imagen mayorista',
      titleEdit: 'Editar imagen mayorista',
      fields: [
        { id: 'imagen', label: 'IMAGEN', type: 'image' }
      ],
      toRow: (f) => ({ imagen: f.imagen || '' })
    }
  },

  openModal(table, rowData = null) {
    const cfg = this._modalConfigs[table];
    document.getElementById('modal-title').textContent =
      rowData ? cfg.titleEdit : cfg.titleAdd;

    document.getElementById('modal-body').innerHTML = cfg.fields.map(f => {
      if (f.type === 'image') {
        // Campo especial para subir imagen
        const preview = rowData && rowData.imagen
          ? `<img src="${rowData.imagen}"
                  id="img-preview"
                  style="width:100%;max-height:160px;object-fit:cover;
                         border-radius:8px;margin-bottom:8px;
                         border:1px solid var(--border)">`
          : `<div id="img-preview" style="display:none"></div>`;
        return `
          <div class="form-group">
            <label class="form-label">${f.label}${f.optional ? ' (opcional)' : ''}</label>
            ${preview}
            <input id="mf-imagen" type="file" accept="image/*"
                   style="width:100%;padding:10px;background:#2A2A2A;
                          border:1px solid var(--border);border-radius:8px;
                          color:var(--text);font-family:var(--font-b);
                          font-size:13px;cursor:pointer;">
            <div class="form-hint">📌 Formatos: JPG, PNG, WEBP. Máximo 5MB.</div>
          </div>`;
      }
      if (f.type === 'textarea') {
        return `
          <div class="form-group">
            <label class="form-label">${f.label}</label>
            <textarea id="mf-${f.id}" class="form-textarea"
                      placeholder="${f.placeholder}">${rowData ? this._esc(rowData[f.id] || '') : ''}</textarea>
          </div>`;
      }
      return `
        <div class="form-group">
          <label class="form-label">${f.label}</label>
          <input id="mf-${f.id}" class="form-input" type="text"
                 placeholder="${f.placeholder}"
                 value="${rowData ? this._esc(rowData[f.id] || '') : ''}">
        </div>`;
    }).join('');

    // Preview de imagen al seleccionar archivo
    const fileInput = document.getElementById('mf-imagen');
    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const preview = document.getElementById('img-preview');
        preview.src   = URL.createObjectURL(file);
        preview.style.display = 'block';
        preview.tagName === 'DIV'
          ? preview.outerHTML = `<img id="img-preview" src="${URL.createObjectURL(file)}"
              style="width:100%;max-height:160px;object-fit:cover;
                     border-radius:8px;margin-bottom:8px;
                     border:1px solid var(--border)">`
          : (preview.src = URL.createObjectURL(file));
      });
    }

    document.getElementById('modal-bg').classList.add('open');
    setTimeout(() => {
      const first = document.querySelector('#modal-body input[type="text"], #modal-body textarea');
      if (first) first.focus();
    }, 100);
  },

  closeModal() {
    document.getElementById('modal-bg').classList.remove('open');
  },

  // Devuelve el archivo de imagen seleccionado si existe
  getImageFile() {
    const input = document.getElementById('mf-imagen');
    return input && input.files[0] ? input.files[0] : null;
  },

  getModalFields(table) {
    const cfg    = this._modalConfigs[table];
    const fields = {};
    for (const f of cfg.fields) {
      if (f.type === 'image') continue; // imagen se maneja aparte
      const el = document.getElementById(`mf-${f.id}`);
      fields[f.id] = el ? el.value.trim() : '';
    }
    return { fields, toRow: cfg.toRow };
  },

  validateModalFields(table) {
    const cfg = this._modalConfigs[table];
    for (const f of cfg.fields) {
      if (f.optional || f.type === 'image') continue;
      const el = document.getElementById(`mf-${f.id}`);
      if (el && !el.value.trim()) {
        return `El campo "${f.label}" es requerido`;
      }
    }
    return null;
  },

  setSaveLoading(loading) {
    const btn = document.getElementById('modal-save-btn');
    btn.disabled  = loading;
    btn.innerHTML = loading ? '<div class="spinner"></div>' : 'Guardar';
  },

  // ── UTILIDADES ─────────────────────────────
  _esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  _bindTableActions(tbody, onEdit, onDelete) {
    tbody.onclick = (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = parseInt(btn.dataset.id);
      if (btn.dataset.action === 'edit')   onEdit(id);
      if (btn.dataset.action === 'delete') onDelete(id);
    };
  }
};