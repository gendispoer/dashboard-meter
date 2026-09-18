// data.js
// Loader data pelanggan. Ganti sumbernya sesuai kebutuhan:
// - JSON statis (default, cocok untuk GitHub Pages)
// - atau fetch ke API/CSV lalu di-convert ke bentuk array of object berikut:
//   { no_plg, nama, kd_tarif, subzona, jml_penghuni, sumur,
//     pakai_gt10, pakai_0, pressure, status_aktual, prediksi }

async function loadCustomerData() {
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
