// ══════════════════════════════════════════════
//  js/services/SheetsAPI.js
//  Capa de comunicación con Supabase
//  - Lee y escribe via REST API de Supabase
//  - Sube imágenes a Supabase Storage
// ══════════════════════════════════════════════

import { SUPABASE_URL, SUPABASE_KEY, STORAGE_URL } from '../config.js';

// ── HEADERS BASE ──────────────────────────────
const headers = {
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation'
};

// ── LECTURA ───────────────────────────────────
async function get(table) {
  const res  = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.asc`,
    { headers }
  );
  if (!res.ok) throw new Error(`Error leyendo ${table}: ${res.status}`);
  return res.json();
}

// ── ESCRITURA ─────────────────────────────────
async function add(table, row) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}`,
    { method: 'POST', headers, body: JSON.stringify(row) }
  );
  if (!res.ok) throw new Error(`Error agregando en ${table}: ${res.status}`);
  return res.json();
}

async function update(table, id, row) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,
    { method: 'PATCH', headers, body: JSON.stringify(row) }
  );
  if (!res.ok) throw new Error(`Error actualizando ${table}: ${res.status}`);
  return res.json();
}

async function remove(table, id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`,
    { method: 'DELETE', headers }
  );
  if (!res.ok) throw new Error(`Error eliminando en ${table}: ${res.status}`);
}

// ── STORAGE — subir imagen ────────────────────
async function uploadImage(folder, file) {
  const ext      = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}.${ext}`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/imagenes/${filename}`,
    {
      method:  'POST',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type':  file.type
      },
      body: file
    }
  );
  if (!res.ok) throw new Error(`Error subiendo imagen: ${res.status}`);
  // Devuelve la URL pública directa
  return `${STORAGE_URL}/${filename}`;
}

// ── STORAGE — eliminar imagen ─────────────────
async function deleteImage(url) {
  // Extraemos el path relativo desde la URL pública
  const path = url.split('/public/imagenes/')[1];
  if (!path) return;
  await fetch(
    `${SUPABASE_URL}/storage/v1/object/imagenes/${path}`,
    {
      method:  'DELETE',
      headers: {
        'apikey':        SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
}

// ── EXPORTACIONES ─────────────────────────────
export const SheetsAPI = {
  get,
  add,
  update,
  delete:      remove,
  uploadImage,
  deleteImage
};