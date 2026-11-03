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
        if (typeof loadAccountDropdown === 'function') loadAccountDropdown();
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
// 3. FUNGSI DROPDOWN (PASIEN, OBAT, & AKUN)
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
        const selectAccount = document.getElementById('jurnal-account');
        if (!selectAccount) return;

        selectAccount.innerHTML = '<option value="">-- Pilih Akun --</option>';
        const defaultAccounts = [
            { kode: '1101', nama: 'Kas / Bank' },
            { kode: '1201', nama: 'Persediaan Obat & Medis' },
            { kode: '4101', nama: 'Pendapatan Jasa Medis' },
            { kode: '5101', nama: 'Beban Persediaan / Operasional' }
        ];
        defaultAccounts.forEach(acc => {
            selectAccount.innerHTML += `<option value="${acc.kode}">${acc.kode} - ${acc.nama}</option>`;
        });
    } catch (err) {
        console.error("Gagal memuat akun:", err.message);
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
// FUNGSI BUKU BESAR (GENERAL LEDGER)
// ==========================================
async function loadGeneralLedger() {
    try {
        const client = window.supabaseClient || supabaseClient;
        
        // Ambil data dari tabel journal_entries di Supabase
        const { data, error } = await client.from('journal_entries').select('*');
        if (error) throw error;

        const tbody = document.getElementById('ledger-table-body');
        const filterSelect = document.getElementById('filter-account');
        
        if (!tbody) return;
        tbody.innerHTML = '';

        // Isi dropdown filter akun di halaman Buku Besar jika masih kosong
        if (filterSelect && filterSelect.options.length <= 1) {
            filterSelect.innerHTML = '<option value="">-- Semua Akun --</option>';
            const defaultAccounts = [
                { kode: '1101', nama: 'Kas / Bank' },
                { kode: '1201', nama: 'Persediaan Obat & Medis' },
                { kode: '4101', nama: 'Pendapatan Jasa Medis' },
                { kode: '5101', nama: 'Beban Persediaan / Operasional' }
            ];
            defaultAccounts.forEach(acc => {
                filterSelect.innerHTML += `<option value="${acc.kode}">${acc.kode} - ${acc.nama}</option>`;
            });
        }

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Belum ada data jurnal / buku besar. Silakan input melalui menu Debit / Kredit (Jurnal).</td></tr>`;
            return;
        }

        // Ambil nilai filter akun yang sedang dipilih
        const selectedAccount = filterSelect ? filterSelect.value : '';

        // Filter data jika pengguna memilih akun tertentu pada dropdown
        const filteredData = selectedAccount 
            ? data.filter(item => (item.account_code || item.akun || item.account) === selectedAccount)
            : data;

        if (filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Tidak ada transaksi untuk akun ini.</td></tr>`;
            return;
        }

        let runningBalance = 0;

        filteredData.forEach(entry => {
            const tgl = entry.tanggal || entry.date || entry.tgl || '-';
            const ref = entry.referensi || entry.ref || entry.no_ref || '-';
            const ket = entry.keterangan || entry.deskripsi || entry.description || entry.memo || '-';
            
            // Menangkap data akun agar tampil terpisah di tabel
            const akun = entry.account_code || entry.akun || entry.account || entry.kode_akun || '-';
            
            const debit = Number(entry.debit || entry.jumlah_debit || 0);
            const kredit = Number(entry.kredit || entry.jumlah_kredit || 0);

            runningBalance += (debit - kredit);

            tbody.innerHTML += `
                <tr>
                    <td>${tgl}</td>
                    <td>${ref}</td>
                    <td><strong>${akun}</strong></td>
                    <td>${ket}</td>
                    <td>Rp ${debit.toLocaleString('id-ID')}</td>
                    <td>Rp ${kredit.toLocaleString('id-ID')}</td>
                    <td>Rp ${runningBalance.toLocaleString('id-ID')}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Gagal memuat buku besar:", err.message);
    }
}

// ==========================================
// 7. FUNGSI VALIDASI & SIMPAN JURNAL
// ==========================================
function validateBalance() {
    const debit = parseFloat(document.getElementById('jurnal-debit').value) || 0;
    const kredit = parseFloat(document.getElementById('jurnal-credit').value) || 0;
    const warning = document.getElementById('balance-warning');

    if (!warning) return;

    if (debit !== kredit && (debit > 0 || kredit > 0)) {
        warning.textContent = "Peringatan: Jumlah Debit dan Kredit belum seimbang (balance)!";
    } else {
        warning.textContent = "";
    }
}

async function submitJournal(event) {
    event.preventDefault();
    
    const tanggal = document.getElementById('jurnal-date').value;
    const referensi = document.getElementById('jurnal-ref').value;
    const keterangan = document.getElementById('jurnal-desc').value;
    const akun = document.getElementById('jurnal-account').value;
    const debit = parseFloat(document.getElementById('jurnal-debit').value) || 0;
    const kredit = parseFloat(document.getElementById('jurnal-credit').value) || 0;

    if (debit === 0 && kredit === 0) {
        alert("Nilai debit atau kredit tidak boleh kosong semua!");
        return;
    }

    try {
        const client = window.supabaseClient || supabaseClient;
        
        // SESUAIKAN NAMA KIRI (key) DENGAN KOLOM DI TABEL SUPABASE ANDA
        const { error } = await client.from('journal_entries').insert([{
            tanggal: tanggal,         // Cek apakah di Supabase namanya 'date' atau 'tanggal'
            referensi: referensi,     // Cek apakah di Supabase namanya 'ref' atau 'referensi'
            account_code: akun,       // Cek apakah di Supabase namanya 'akun' atau 'account_code'
            debit: debit,             // Cek apakah di Supabase namanya 'debit'
            credit: kredit            // <-- Ubah 'kredit' menjadi 'credit' jika di Supabase menggunakan bahasa Inggris
        }]);

        if (error) throw error;

        alert("Jurnal transaksi berhasil disimpan!");
        document.getElementById('journal-form').reset();
        
        if (typeof loadGeneralLedger === 'function') {
            loadGeneralLedger();
        }
    } catch (err) {
        console.error("Gagal menyimpan jurnal:", err.message);
        alert("Gagal menyimpan jurnal: " + err.message);
    }
}

// ==========================================
// 8. FUNGSI SIMPAN TRANSAKSI MEDIS
// ==========================================
async function submitTransaction(event) {
    event.preventDefault();

    const pasien_id = document.getElementById('pasien').value;
    const item_id = document.getElementById('item-obat').value;
    const jumlah = parseInt(document.getElementById('jumlah-obat').value) || 1;
    const biaya_dokter = parseFloat(document.getElementById('biaya-dokter').value) || 0;
    const status_pembayaran = document.getElementById('status-pembayaran').value;
    const tanggal = new Date().toISOString().split('T')[0];

    try {
        const client = window.supabaseClient || supabaseClient;

        const { error } = await client.from('transaksi').insert([
            { pasien_id, item_id, jumlah, biaya_dokter, status_pembayaran, tanggal }
        ]);

        if (error) throw error;

        alert("Transaksi medis berhasil diproses!");
        document.getElementById('transaction-form').reset();

        if (typeof loadReportData === 'function') loadReportData();
        if (typeof loadStatistics === 'function') loadStatistics();
    } catch (err) {
        console.error("Gagal memproses transaksi:", err.message);
        alert("Gagal memproses transaksi: " + err.message);
    }
}

// ==========================================
// 9. INISIALISASI SAAT HALAMAN DIBUKA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    loadInventoryData();
    loadDropdowns();
    loadAccountDropdown();
});
