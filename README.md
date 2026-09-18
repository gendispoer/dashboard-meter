# Dashboard Monitoring Status Meter

Dashboard statis (HTML/CSS/JS murni, tanpa framework) untuk menyajikan hasil prediksi status meter pelanggan. Siap deploy ke GitHub Pages.

## Struktur folder

```
dashboard-meter/
├── index.html          # Halaman Overview (KPI + distribusi)
├── monitoring.html      # Halaman Customer Monitoring (tabel + filter + search)
├── analysis.html         # Halaman Model Analysis (variabel input vs prediksi)
├── css/
│   └── style.css
├── js/
│   ├── data.js            # loader data + helper agregasi
│   ├── charts.js         # helper render chart (Chart.js)
│   └── main.js           # logic tiap halaman
├── data/
│   └── sample_data.json  # data contoh, ganti dengan hasil prediksi asli
└── README.md
```

## Cara pakai

1. Ganti isi `data/sample_data.json` dengan hasil prediksi kamu. Formatnya:
   ```json
   {
     "no_plg": "100001",
     "nama": "Andi Wijaya",
     "kd_tarif": "A1",
     "subzona": "SZ-01",
     "jml_penghuni": 4,
     "sumur": "Tidak",
     "pakai_gt10": 8,
     "pakai_0": 0,
     "pressure": 2.4,
     "status_aktual": "Naik",
     "prediksi": "Naik"
   }
   ```
   Kalau data real belum punya `status_aktual` (label), field ini boleh diisi `null` — dashboard tetap jalan karena field itu hanya dipakai untuk evaluasi terpisah (belum diimplementasikan di starter ini).

2. Buka `index.html` lewat local server (fetch JSON tidak jalan kalau dibuka langsung via `file://`). Contoh cepat:
   ```bash
   npx serve .
   # atau
   python -m http.server
   ```

3. Deploy ke GitHub Pages: push folder ini ke repo, aktifkan GitHub Pages dari branch `main` folder root (atau `/docs`).

## Kalau data ribuan/puluhan ribu baris

`sample_data.json` cukup untuk contoh, tapi untuk 80 ribuan baris:
- Pertimbangkan load data terpisah per subzona/tarif (lazy load) supaya file JSON tidak terlalu besar.
- Tabel di `monitoring.html` saat ini render semua baris hasil filter sekaligus — untuk performa lebih baik pada dataset besar, tambahkan pagination di `main.js` (render per 50–100 baris).

## Yang belum ada (bisa dikembangkan lanjut)

- Halaman **Detail Pelanggan** per NO_PLG (klik baris tabel → modal/halaman detail).
- Perbandingan **Status Aktual vs Prediksi** (confusion matrix) sebagai halaman evaluasi terpisah, memakai subset data training/testing yang berlabel.
- Pagination untuk tabel monitoring pada dataset besar.
