// main.js
document.addEventListener("DOMContentLoaded", async () => {
  let data;
  try {
    data = await loadCustomerData();
  } catch (err) {
    console.error(err);
    document.querySelector(".main").insertAdjacentHTML(
      "beforeend",
      `<p style="color:red">Gagal memuat data: ${err.message}</p>`
    );
    return;
  }

  // ---------- Halaman: Overview ----------
  if (document.getElementById("kpi-total")) {
    const kpi = computeKPI(data);
    document.getElementById("kpi-total").textContent = kpi.total.toLocaleString("id-ID");
    document.getElementById("kpi-naik").textContent = kpi.naik.toLocaleString("id-ID");
    document.getElementById("kpi-tetap").textContent = kpi.tetap.toLocaleString("id-ID");
    document.getElementById("kpi-turun").textContent = kpi.turun.toLocaleString("id-ID");

    renderBarChart("chart-distribusi", ["Naik", "Tetap", "Turun"], [kpi.naik, kpi.tetap, kpi.turun]);

    const bySubzona = groupByCategoryAndStatus(data, "subzona");
    renderStackedBarChart("chart-subzona", bySubzona.categories, bySubzona.statuses, bySubzona.result);

    const byTarif = groupByCategoryAndStatus(data, "kd_tarif");
    renderStackedBarChart("chart-tarif", byTarif.categories, byTarif.statuses, byTarif.result);
  }

  // ---------- Halaman: Model Analysis ----------
  if (document.getElementById("chart-penghuni")) {
    renderAverageByStatusChart("chart-penghuni", averageByStatus(data, "jml_penghuni"), "Rata-rata jumlah penghuni");
    renderAverageByStatusChart("chart-pressure", averageByStatus(data, "pressure"), "Rata-rata pressure");
    renderAverageByStatusChart("chart-pakai10", averageByStatus(data, "pakai_gt10"), "Rata-rata pakai >10");
    renderAverageByStatusChart("chart-pakai0", averageByStatus(data, "pakai_0"), "Rata-rata pakai 0");

    const sumur = sumurByStatus(data);
    renderStackedBarChart("chart-sumur", ["Ya", "Tidak"], sumur.statuses, sumur.result);
  }

  // ---------- Halaman: Customer Monitoring ----------
    // ---------- Halaman: Customer Monitoring ----------
  if (document.getElementById("table-body")) {
    initMonitoringPage(data);
    setupUploadHandlers();
    const trainData = loadTrainDataFromStorage();
    if (trainData) renderConfusionMatrix(trainData);
  }
});

function initMonitoringPage(data) {
  const statusSel = document.getElementById("f-status");
  const subzonaSel = document.getElementById("f-subzona");
  const tarifSel = document.getElementById("f-tarif");
  const searchInput = document.getElementById("f-search");
  const tbody = document.getElementById("table-body");
  const rowCount = document.getElementById("row-count");

  // Isi opsi filter subzona & kd_tarif secara dinamis dari data
  [...new Set(data.map(d => d.subzona))].sort().forEach(v => {
    subzonaSel.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`);
  });
  [...new Set(data.map(d => d.kd_tarif))].sort().forEach(v => {
    tarifSel.insertAdjacentHTML("beforeend", `<option value="${v}">${v}</option>`);
  });

  function render() {
    const status = statusSel.value;
    const subzona = subzonaSel.value;
    const tarif = tarifSel.value;
    const search = searchInput.value.trim().toLowerCase();

    const filtered = data.filter(d => {
      if (status && d.prediksi !== status) return false;
      if (subzona && d.subzona !== subzona) return false;
      if (tarif && d.kd_tarif !== tarif) return false;
      if (search && !(d.no_plg.toLowerCase().includes(search) || d.nama.toLowerCase().includes(search))) return false;
      return true;
    });

    rowCount.textContent = `Menampilkan ${filtered.length} dari ${data.length} pelanggan`;

    tbody.innerHTML = filtered.map(d => `
      <tr>
        <td>${d.no_plg}</td>
        <td>${d.nama}</td>
        <td>${d.kd_tarif}</td>
        <td>${d.subzona}</td>
        <td>${d.jml_penghuni}</td>
        <td>${d.sumur}</td>
        <td>${d.pakai_gt10}</td>
        <td>${d.pakai_0}</td>
        <td>${d.pressure}</td>
        <td><span class="badge ${d.prediksi}">${d.prediksi}</span></td>
      </tr>
    `).join("");
  }

  [statusSel, subzonaSel, tarifSel].forEach(el => el.addEventListener("change", render));
  searchInput.addEventListener("input", render);

  render();
}

function setupUploadHandlers() {
  const testInput = document.getElementById("upload-test");
  const trainInput = document.getElementById("upload-train");
  const resetBtn = document.getElementById("btn-reset-data");
  const statusEl = document.getElementById("upload-status");

  testInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = await parseUploadedFile(file);
      saveTestData(parsed);
      statusEl.textContent = `Data test (${parsed.length} baris) berhasil diupload.`;
      location.reload();
    } catch (err) {
      statusEl.textContent = "Gagal membaca file: " + err.message;
    }
  });

  trainInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = await parseUploadedFile(file);
      saveTrainData(parsed);
      statusEl.textContent = `Data train (${parsed.length} baris) berhasil diupload.`;
      renderConfusionMatrix(parsed);
    } catch (err) {
      statusEl.textContent = "Gagal membaca file: " + err.message;
    }
  });

  resetBtn.addEventListener("click", () => {
    clearTestData();
    clearTrainData();
    location.reload();
  });
}

function renderConfusionMatrix(trainData) {
  const { matrix, statuses, accuracy, total } = computeConfusionMatrix(trainData);
  const panel = document.getElementById("panel-evaluasi");
  const table = document.getElementById("confusion-matrix");

  if (!total) { panel.style.display = "none"; return; }

  let html = `<thead><tr><th>Aktual \\ Prediksi</th>${statuses.map(s => `<th>${s}</th>`).join("")}</tr></thead><tbody>`;
  statuses.forEach(actual => {
    html += `<tr><td><strong>${actual}</strong></td>`;
    statuses.forEach(pred => {
      const correct = actual === pred;
      html += `<td class="${correct ? "cm-correct" : ""}">${matrix[actual][pred]}</td>`;
    });
    html += "</tr>";
  });
  table.innerHTML = html + "</tbody>";
  panel.style.display = "block";
  panel.querySelector("h3").textContent = `Evaluasi Model — Akurasi ${accuracy}% (${total} baris)`;
}
