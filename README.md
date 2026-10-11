# SIA Medika - Sistem Informasi Akuntansi Praktik Dokter Umum

SIA Medika adalah aplikasi berbasis web (*Web-Based Accounting Information System*) yang dirancang khusus untuk mengelola pencatatan keuangan operasional pada praktik dokter umum atau klinik mandiri. Sistem ini berfokus pada manajemen persediaan obat/alkes, pencatatan transaksi layanan medis harian, serta pemantauan siklus piutang klaim asuransi (seperti BPJS Kesehatan dan asuransi swasta).

---

## 🚀 Fitur Utama Sistem

1. **Dashboard Beranda & Akses Cepat**:
   - Halaman sambutan interaktif dengan navigasi menu samping (*Sidebar*) bergaya modern ala *dashboard* korporat.
2. **Manajemen Stok Persediaan (Inventory)**:
   - Pencatatan stok obat dan alat kesehatan secara *real-time*.
   - Otomatis mengurangi kuantitas stok di database setiap kali transaksi penjualan/pelayanan medis berhasil diproses.
3. **Input Transaksi Medis**:
   - Pencatatan layanan pasien terintegrasi dengan pilihan jenis penjamin/asuransi (Umum/Tunai, BPJS Kesehatan, Prudential, Manulife, Mandiri Inhealth, dll.).
   - Perhitungan otomatis biaya total yang mencakup harga obat/alkes dikali kuantitas ditambah biaya jasa medis dokter.
   - Pilihan metode pembayaran fleksibel: **Lunas (Tunai)** atau **Piutang Asuransi**.
4. **Laporan Pendapatan & Piutang Asuransi (Accounting Reports)**:
   - Rekapitulasi otomatis untuk **Total Pendapatan (Kas Lunas)**, **Total Piutang Asuransi**, dan **Total Omset/Omzet**.
   - Fitur interaktif **Cairkan/Lunasi** untuk mengubah status piutang asuransi yang sudah dibayarkan menjadi kas masuk.
   - Tombol operasional untuk mereset perhitungan summary maupun menghapus seluruh data laporan transaksi langsung dari basis data.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, CSS3 (Modern Flexbox & CSS Grid, Custom Sidebar Layout), JavaScript (ES6+ Modules).
* **Backend & Database**: Supabase (PostgreSQL), diakses secara *real-time* melalui Supabase JavaScript Client SDK.

---

## 📂 Struktur Folder Proyek

```text
klinik-sia-app/
│
├── backend/
│   └── schema.sql         # Skrip SQL tabel Relasional (Pasien, Persediaan, Transaksi)
│
└── frontend/
    ├── html/
    │   └── index.html     # Halaman Antarmuka Utama (SPA dengan Tab Navigasi)
    ├── css/
    │   └── style.css      # Styling Tampilan UI Modern
    └── js/
        ├── supabaseClient.js  # Konfigurasi Koneksi Kredensial Supabase
        └── app.js             # Logika Bisnis, CRUD, & Perhitungan Akuntansi