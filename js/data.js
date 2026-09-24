// data.js
// Loader data pelanggan. Ganti sumbernya sesuai kebutuhan:
// - JSON statis (default, cocok untuk GitHub Pages)
// - atau fetch ke API/CSV lalu di-convert ke bentuk array of object berikut:
//   { no_plg, nama, kd_tarif, subzona, jml_penghuni, sumur,
//     pakai_gt10, pakai_0, pressure, status_aktual, prediksi }

async function loadCustomerData() {
  const uploaded = loadTestDataFromStorage();
  if (uploaded) return uploaded;

  const res = await fetch("data/sample_data.json");
  if (!res.ok) throw new Error("Gagal memuat data: " + res.status);
  return res.json();
}

// Hitung ringkasan KPI dari data
function computeKPI(data) {
  const total = data.length;
  const naik = data.filter(d => d.prediksi === "Naik").length;
  const tetap = data.filter(d => d.prediksi === "Tetap").length;
  const turun = data.filter(d => d.prediksi === "Turun").length;
  return { total, naik, tetap, turun };
}

// Grouping generic: hitung count prediksi per kategori (subzona / kd_tarif / dll)
function groupByCategoryAndStatus(data, categoryKey) {
  const categories = [...new Set(data.map(d => d[categoryKey]))].sort();
  const statuses = ["Naik", "Tetap", "Turun"];
  const result = {};
  categories.forEach(cat => {
    result[cat] = { Naik: 0, Tetap: 0, Turun: 0 };
  });
  data.forEach(d => {
    result[d[categoryKey]][d.prediksi]++;
  });
  return { categories, statuses, result };
}

// Rata-rata variabel numerik per status prediksi (untuk halaman Model Analysis)
function averageByStatus(data, numericKey) {
  const statuses = ["Naik", "Tetap", "Turun"];
  const out = {};
  statuses.forEach(s => {
    const rows = data.filter(d => d.prediksi === s);
    const avg = rows.length
      ? rows.reduce((sum, r) => sum + Number(r[numericKey]), 0) / rows.length
      : 0;
    out[s] = Number(avg.toFixed(2));
  });
  return out;
}

// SUMUR: kategorikal (Ya/Tidak) -> stacked count per status
function sumurByStatus(data) {
  const statuses = ["Naik", "Tetap", "Turun"];
  const result = { Ya: {}, Tidak: {} };
  ["Ya", "Tidak"].forEach(s => {
    statuses.forEach(st => result[s][st] = 0);
  });
  data.forEach(d => {
    result[d.sumur][d.prediksi]++;
  });
  return { statuses, result };
}

// ===== Upload & mapping kolom =====
const FIELD_ALIASES = {
  no_plg: ["noplg","nomorpelanggan","idpelanggan","customerid"],
  nama: ["nama","name","namapelanggan"],
  kd_tarif: ["kdtarif","tarif","kodetarif"],
  subzona: ["subzona","subzone","zona"],
  jml_penghuni: ["jmlpenghuni","jumlahpenghuni"],
  sumur: ["sumur"],
  pakai_gt10: ["pakaigt10","jumlahpakai10","pakai10","jumlahpakailebihdari10","pakailebihdari10"],
  pakai_0: ["pakai0","jumlahpakai0"],
  pressure: ["pressure","tekanan"],
  status_aktual: ["status","statusaktual","actualstatus","label"],
  prediksi: ["prediksi","prediksistatus","predictedstatus","hasilprediksi","predictionstatus"]
};

function normalizeHeader(h) {
  return h.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Ubah 1 baris hasil parse CSV/JSON (header apapun) jadi skema internal dashboard
function mapRowToSchema(row) {
  const mapped = {};
  Object.keys(row).forEach(key => {
    const norm = normalizeHeader(key);
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(norm)) { mapped[field] = row[key]; break; }
    }
  });
  ["jml_penghuni", "pakai_gt10", "pakai_0", "pressure"].forEach(f => {
    if (mapped[f] !== undefined) mapped[f] = Number(mapped[f]);
  });
  ["sumur", "status_aktual", "prediksi"].forEach(f => {
    if (mapped[f] !== undefined) mapped[f] = String(mapped[f]).trim();
  });
  return mapped;
}

// Baca file .csv atau .json yang diupload, kembalikan array data sesuai skema
function parseUploadedFile(file) {
  return new Promise((resolve, reject) => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "json") {
      const reader = new FileReader();
      reader.onload = e => {
        try { resolve(JSON.parse(e.target.result).map(mapRowToSchema)); }
        catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: results => resolve(results.data.map(mapRowToSchema)),
        error: reject
      });
    }
  });
}

// ===== localStorage =====
const LS_TEST_KEY = "dashboard_test_data";
const LS_TRAIN_KEY = "dashboard_train_data";

function saveTestData(data) { localStorage.setItem(LS_TEST_KEY, JSON.stringify(data)); }
function loadTestDataFromStorage() {
  const raw = localStorage.getItem(LS_TEST_KEY);
  return raw ? JSON.parse(raw) : null;
}
function clearTestData() { localStorage.removeItem(LS_TEST_KEY); }

function saveTrainData(data) { localStorage.setItem(LS_TRAIN_KEY, JSON.stringify(data)); }
function loadTrainDataFromStorage() {
  const raw = localStorage.getItem(LS_TRAIN_KEY);
  return raw ? JSON.parse(raw) : null;
}
function clearTrainData() { localStorage.removeItem(LS_TRAIN_KEY); }

// ===== Confusion matrix untuk data train =====
function computeConfusionMatrix(trainData) {
  const statuses = ["Naik", "Tetap", "Turun"];
  const matrix = {};
  statuses.forEach(a => { matrix[a] = {}; statuses.forEach(p => matrix[a][p] = 0); });
  let correct = 0, total = 0;
  trainData.forEach(d => {
    if (!statuses.includes(d.status_aktual) || !statuses.includes(d.prediksi)) return;
    matrix[d.status_aktual][d.prediksi]++;
    total++;
    if (d.status_aktual === d.prediksi) correct++;
  });
  return { matrix, statuses, accuracy: total ? (correct / total * 100).toFixed(1) : 0, total };
}
