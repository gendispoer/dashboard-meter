// charts.js
// Warna konsisten untuk status prediksi di semua chart
const STATUS_COLORS = {
  Naik: "#ef4444",
  Tetap: "#3b82f6",
  Turun: "#10b981"
};

function renderBarChart(canvasId, labels, values) {
  new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Jumlah Pelanggan",
        data: values,
        backgroundColor: labels.map(l => STATUS_COLORS[l] || "#6366f1"),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function renderStackedBarChart(canvasId, categories, statuses, dataByCategory) {
  const datasets = statuses.map(status => ({
    label: status,
    data: categories.map(cat => dataByCategory[cat][status]),
    backgroundColor: STATUS_COLORS[status]
  }));

  new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: { labels: categories, datasets },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      }
    }
  });
}

function renderAverageByStatusChart(canvasId, avgObj, unitLabel) {
  const statuses = Object.keys(avgObj);
  new Chart(document.getElementById(canvasId), {
    type: "bar",
    data: {
      labels: statuses,
      datasets: [{
        label: unitLabel,
        data: statuses.map(s => avgObj[s]),
        backgroundColor: statuses.map(s => STATUS_COLORS[s]),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}
