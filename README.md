# 🌍 Visualisasi Data Gempa Bumi Indonesia

Proyek ini bertujuan untuk menyediakan visualisasi interaktif dari data gempa bumi di Indonesia dari Tahun 2009-2022 menggunakan HTML, JavaScript, dan pustaka seperti Leaflet dan Chart.js. Dengan pendekatan ini, pengguna dapat memahami distribusi spasial dan temporal aktivitas seismik di wilayah rawan gempa.

## 📌 Fitur Utama

* **Peta Interaktif**: Menampilkan lokasi gempa bumi di Indonesia dari tahun 2009-2022 berdasarkan kategori kedalaman dan magnitudo.
* **Histogram**: Visualisasi distribusi frekuensi gempa berdasarkan kedalaman.
* **Line Chart**: Menampilkan tren jumlah gempa dari tahun 2009-2022.
* **ScatterPlot**: Menampilkan hubungan kedalaman dan magnitudo gempa.
* **Bar Chart**: Menampilkan 5 wilayah dengan frekuensi gempa tertinggi.

## 📦 Struktur Direktori

```
/Visualisasi-Data-Gempa-Bumi-Indonesia
├── index.html           # Halaman utama
├── linechart.html       # Grafik tren waktu
├── histogram.html       # Histogram distribusi magnitudo
├── data.csv             # Data gempa bumi
├── indonesia-province.json # Data geoJSON untuk peta
├── css/                 # Gaya CSS
└── js/                  # Skrip JavaScript
```

## 🔧 Prasyarat

* Browser modern (Chrome, Firefox, Safari, dll.)
* Koneksi internet untuk memuat pustaka eksternal dan data geoJSON

## 🚀 Cara Penggunaan

1. **Kloning repositori**:

   ```bash
   git clone https://github.com/marqynew/Visualisasi-Data-Gempa-Bumi-Indonesia.git
   cd Visualisasi-Data-Gempa-Bumi-Indonesia
   ```
2. Buka `index.html` di browser untuk melihat peta interaktif.
3. Akses `linechart.html` untuk melihat grafik tren jumlah gempa dari waktu ke waktu.
4. Lihat `histogram.html` untuk melihat distribusi frekuensi gempa berdasarkan magnitudo.

## 📊 Data

Data gempa bumi diambil dari (https://www.kaggle.com/datasets/kekavigi/earthquakes-in-indonesia/data) dan disimpan dalam format CSV.
File indonesia-province.json berisi data geoJSON untuk peta interaktif.
