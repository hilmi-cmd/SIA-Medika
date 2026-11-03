// ==========================================
// 1. SISTEM NAVIGASI TAB & OTOMATIS LOAD DATA
// ==========================================
function switchTab(tabId) {
    // Sembunyikan semua section tab
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });

    // Tampilkan hanya tab yang diklik
    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.style.display = 'block';
    }

    // Panggil fungsi data otomatis sesuai menu yang dibuka
    if (tabId === 'persediaan') {
        if (typeof loadInventoryData === 'function') loadInventoryData();
    } else if (tabId === 'laporan') {
        if (typeof loadReportData === 'function') loadReportData();
    } else if (tabId === 'statistik') {
        if (typeof loadStatistics === 'function') loadStatistics();
    } else if (tabId === 'buku-besar') {
        if (typeof loadGeneralLedger === 'function') loadGeneralLedger();
    } else if (tabId === 'transaksi') {
        if (typeof loadDropdowns === 'function') loadDropdowns();
    } else if (tabId === 'jurnal') {
        if (typeof loadAccountDropdown === 'function') loadAccountDropdown(); // Mengisi pilihan nama akun di form jurnal
    }
}

// ==========================================
// 2. FUNGSI STOK PERSEDIAAN
// ==========================================
async function loadInventoryData() {
    try {
        const client = window.supabaseClient || supabaseClient;
        const { data, error } = await client.from('persediaan').select('*');
        
        if (error) throw error;

        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data persediaan.</td></tr>`;
            return;
        }

        data.forEach(item => {
            const hargaItem = item.harga || item.harga_satuan || item.price || item.harga_jual || 0;
            
            tbody.innerHTML += `
                <tr>
                    <td>${item.id || '-'}</td>
                    <td>${item.nama_item || item.name || '-'}</td>
                    <td>${item.kategori || '-'}</td>
                    <td>${item.stok || 0}</td>
                    <td>Rp ${Number(hargaItem).toLocaleString('id-ID')}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Gagal memuat persediaan:", err.message);
    }
}

// ==========================================
// 3. FUNGSI DROPDOWN PASIEN & OBAT (INPUT TRANSAKSI)
// ==========================================
async function loadDropdowns() {
    try {
        const client = window.supabaseClient || supabaseClient;
        
        // Ambil data pasien
        const { data: pasienData } = await client.from('pasien').select('*');
        const selectPasien = document.getElementById('pasien');
        if (selectPasien && pasienData) {
            selectPasien.innerHTML = '<option value="">-- Pilih Pasien --</option>';
            pasienData.forEach(p => {
                selectPasien.innerHTML += `<option value="${p.id}">${p.nama || p.nama_pasien || 'Pasien ' + p.id}</option>`;
            });
        }

        // Ambil data obat
        const { data: obatData } = await client.from('persediaan').select('*');
        const selectObat = document.getElementById('item-obat');
        if (selectObat && obatData) {
            selectObat.innerHTML = '<option value="">-- Pilih Obat/Alkes --</option>';
            obatData.forEach(o => {
                selectObat.innerHTML += `<option value="${o.id}">${o.nama_item || o.name || 'Item ' + o.id}</option>`;
            });
        }
    } catch (err) {
        console.error("Gagal memuat dropdown:", err.message);
    }
}

async function loadAccountDropdown() {
    try {
        const client = window.supabaseClient || supabaseClient;
        
        // Ambil data dari tabel master akun di Supabase (misal: 'accounts' atau 'daftar_akun')
        // Sesuaikan nama tabel jika di database Anda berbeda
        const { data, error } = await client.from('accounts').select('*');
        
        const selectAccount = document.getElementById('jurnal-account');
        if (!selectAccount) return;

        selectAccount.innerHTML = '<option value="">-- Pilih Akun --</option>';

        if (error || !data || data.length === 0) {
            // Data cadangan standar akuntansi klinik jika tabel database belum ada
            const defaultAccounts = [
                { kode: '1101', nama: 'Kas / Bank' },
                { kode: '1201', nama: 'Persediaan Obat & Medis' },
                { kode: '4101', nama: 'Pendapatan Jasa Medis' },
                { kode: '5101', nama: 'Beban Persediaan / Operasional' }
            ];
            defaultAccounts.forEach(acc => {
                selectAccount.innerHTML += `<option value="${acc.kode}">${acc.kode} - ${acc.nama}</option>`;
            });
            return;
        }

        // Jika data dari Supabase ada
        data.forEach(acc => {
            const kode = acc.kode || acc.account_code || acc.id;
            const nama = acc.nama || acc.account_name || '';
            selectAccount.innerHTML += `<option value="${kode}">${kode} - ${nama}</option>`;
        });

    } catch (err) {
        console.error("Gagal memuat daftar akun:", err.message);
    }
}

// ==========================================
// 4. FUNGSI LAPORAN & PIUTANG
// ==========================================
async function loadReportData() {
    try {
        const client = window.supabaseClient || supabaseClient;
        const { data, error } = await client.from('transaksi').select('*').order('id', { ascending: false });
        
        if (error) throw error;

        const tbody = document.getElementById('report-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data transaksi.</td></tr>`;
            return;
        }

        data.forEach(trx => {
            const totalBiaya = trx.biaya_dokter || 0;
            const idPasienText = trx.pasien_id ? `ID: ${trx.pasien_id}` : 'Umum';
            const idObatText = trx.item_id ? `Obat ID: ${trx.item_id}` : 'Resep Standar';

            tbody.innerHTML += `
                <tr>
                    <td>${trx.tanggal || '-'}</td>
                    <td>Pasien (${idPasienText})</td>
                    <td>Pemeriksaan Medis & ${idObatText}</td>
                    <td>Rp ${Number(totalBiaya).toLocaleString('id-ID')}</td>
                    <td><span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; background: ${trx.status_pembayaran === 'Lunas' ? '#d1fae5; color: #065f46;' : '#fef3c7; color: #92400e;'}">${trx.status_pembayaran || 'Lunas'}</span></td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Gagal memuat laporan:", err.message);
    }
}

// ==========================================
// 5. FUNGSI STATISTIK & GRAFIK
// ==========================================
let myChart = null;

async function loadStatistics() {
    try {
        const client = window.supabaseClient || supabaseClient;
        const { data, error } = await client.from('transaksi').select('*');
        if (error) throw error;

        const tanggalList = [];
        const pendapatanList = [];

        if (data && data.length > 0) {
            data.forEach(trx => {
                tanggalList.push(trx.tanggal || 'Hari Ini');
                pendapatanList.push(trx.biaya_dokter || 0);
            });
        } else {
            tanggalList.push('Belum ada data');
            pendapatanList.push(0);
        }

        const ctx = document.getElementById('grafikPendapatan');
        if (!ctx) return;

        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tanggalList,
                datasets: [{
                    label: 'Pendapatan Jasa Medis (Rp)',
                    data: pendapatanList,
                    backgroundColor: 'rgba(13, 148, 136, 0.6)',
                    borderColor: 'rgba(13, 148, 136, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + Number(value).toLocaleString('id-ID');
                            }
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Gagal memuat statistik:", err.message);
    }
}

// ==========================================
// 6. FUNGSI BUKU BESAR
// ==========================================
async function loadGeneralLedger() {
    try {
        const client = window.supabaseClient || supabaseClient;
        const { data, error } = await client.from('journal_entries').select('*');
        if (error) throw error;
        
        const tbody = document.getElementById('ledger-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Belum ada data buku besar / jurnal.</td></tr>`;
            return;
        }
        
        data.forEach(entry => {
            tbody.innerHTML += `
                <tr>
                    <td>${entry.tanggal || '-'}</td>
                    <td>${entry.referensi || '-'}</td>
                    <td>${entry.keterangan || '-'}</td>
                    <td>Rp ${Number(entry.debit || 0).toLocaleString('id-ID')}</td>
                    <td>Rp ${Number(entry.kredit || 0).toLocaleString('id-ID')}</td>
                    <td>-</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Gagal memuat buku besar:", err.message);
    }
}

// ==========================================
// 7. INISIALISASI SAAT HALAMAN DIBUKA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadInventoryData();
    loadDropdowns();
});
