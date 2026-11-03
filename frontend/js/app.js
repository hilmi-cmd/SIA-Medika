// Jalankan saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
    if (typeof loadInventoryData === 'function') loadInventoryData();
    if (typeof loadDropdowns === 'function') loadDropdowns();
});

// 1. Fungsi Utama untuk Mengganti Tab dan Menandai Menu Aktif
// Fungsi Navigasi Tab & Otomatis Panggil Data
function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.style.display = 'none';
    });

    const activeTab = document.getElementById(tabId);
    if (activeTab) {
        activeTab.style.display = 'block';
    }

    // Panggil data otomatis sesuai menu
    if (tabId === 'persediaan') loadInventoryData();
    else if (tabId === 'laporan') loadReportData();
    else if (tabId === 'statistik') loadStatistics();
    else if (tabId === 'buku-besar') loadGeneralLedger();
    else if (tabId === 'transaksi') loadDropdowns();
}
    // Eksekusi fungsi data sesuai menu yang dibuka
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
    }
}

// Jalankan otomatis saat halaman pertama kali dibuka
document.addEventListener("DOMContentLoaded", () => {
    // Langsung muat data persediaan & dropdown saat pertama kali load
    if (typeof loadInventoryData === 'function') loadInventoryData();
    if (typeof loadDropdowns === 'function') loadDropdowns();
});

// 2. Fungsi Mengambil Data Stok Persediaan dari Supabase
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
            // Menangkap berbagai kemungkinan nama kolom harga di database
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
        console.error("Gagal memuat data persediaan:", err.message);
    }
}

// 3. Fungsi Dropdown Pasien
async function loadPatientDropdown() {
    try {
        const client = window.supabaseClient || supabaseClient;
        const { data, error } = await client.from('pasien').select('*');
        if (error) throw error;
        const select = document.getElementById('pasien');
        if (!select) return;
        select.innerHTML = `<option value="">-- Pilih Pasien --</option>`;
        if (data) {
            data.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.nama_pasien || p.name}</option>`;
            });
        }
    } catch (err) {
        console.error("Gagal memuat pasien:", err);
    }
}

// 4. Fungsi Dropdown Obat
async function loadInventoryDropdown() {
    try {
        const client = window.supabaseClient || supabaseClient;
        const { data, error } = await client.from('persediaan').select('*');
        if (error) throw error;
        const select = document.getElementById('item-obat');
        if (!select) return;
        select.innerHTML = `<option value="">-- Pilih Obat/Alkes --</option>`;
        if (data) {
            data.forEach(item => {
                select.innerHTML += `<option value="${item.id}">${item.nama_item} (Stok: ${item.stok})</option>`;
            });
        }
    } catch (err) {
        console.error("Gagal memuat dropdown obat:", err);
    }
}

// 5. Fungsi Statistik Keuangan
async function loadStatistics() {
    try {
        const client = window.supabaseClient || supabaseClient;
        const { data: journalData, error } = await client.from('journal_entries').select('debit, credit, account_code');
        if (error) throw error;

        let totalRevenue = 0;
        if (journalData) {
            journalData.forEach(row => {
                if (row.account_code === '4101') {
                    totalRevenue += (row.credit - row.debit);
                }
            });
        }

        const revEl = document.getElementById('stat-total-revenue');
        const patEl = document.getElementById('stat-total-patients');
        const recEl = document.getElementById('stat-total-receivable');

        if (revEl) revEl.innerText = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
        if (patEl) patEl.innerText = "24 Pasien"; 
        if (recEl) recEl.innerText = "Rp 1.500.000";
    } catch (err) {
        console.error("Gagal memuat statistik:", err);
    }
}

// 6. Fungsi Buku Besar & Akun
async function loadAccountDropdown() {
    const client = window.supabaseClient || supabaseClient;
    const { data: accounts, error } = await client.from('accounts').select('*');
    if (error) return;
    const selectEl = document.getElementById('filter-account');
    if (!selectEl) return;
    selectEl.innerHTML = accounts.map(acc => `<option value="${acc.account_code}">${acc.account_code} - ${acc.account_name}</option>`).join('');
    loadGeneralLedger();
}

async function loadAccountDropdownForJournal() {
    const client = window.supabaseClient || supabaseClient;
    const { data: accounts, error } = await client.from('accounts').select('*');
    if (error) return;
    const selectEl = document.getElementById('jurnal-account');
    if (!selectEl) return;
    selectEl.innerHTML = accounts.map(acc => `<option value="${acc.account_code}">${acc.account_code} - ${acc.account_name}</option>`).join('');
}

async function loadGeneralLedger() {
    try {
        const client = window.supabaseClient || supabaseClient;
        const { data, error } = await client.from('journal_entries').select('*');
        if (error) throw error;
        
        const tbody = document.getElementById('ledger-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Belum ada data jurnal.</td></tr>`;
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

// 7. Transaksi & Laporan
async function submitTransaction(event) {
    event.preventDefault();
    const client = window.supabaseClient || supabaseClient;

    // Ambil nilai ID dengan benar dari elemen select dropdown
    const pasienId = document.getElementById('pasien').value;
    const obatId = document.getElementById('item-obat').value;
    const jumlah = parseInt(document.getElementById('jumlah-obat').value) || 1;
    const biayaDokter = parseFloat(document.getElementById('biaya-dokter').value) || 0;
    const status = document.getElementById('status-pembayaran').value;

    // Validasi sederhana pastikan pasien & obat sudah dipilih
    if (!pasienId || !obatId) {
        alert("Silakan pilih Pasien dan Item Obat terlebih dahulu!");
        return;
    }

    try {
        const { error } = await client.from('transaksi').insert([{
            pasien_id: pasienId,
            item_id: obatId,
            jumlah_obat: jumlah,
            biaya_dokter: biayaDokter,
            status_pembayaran: status,
            tanggal: new Date().toISOString().split('T')[0]
        }]);

        if (error) throw error;

        alert("Transaksi berhasil diproses!");
        document.getElementById('transaction-form').reset();
        
        // Refresh otomatis data laporan jika sedang dibuka
        if (typeof loadReportData === 'function') {
            loadReportData();
        }
    } catch (err) {
        console.error("Gagal menyimpan transaksi:", err.message);
        alert("Gagal memproses transaksi: " + err.message);
    }
}

// Perbaikan Fungsi Memuat Laporan & Piutang yang Lebih Aman
async function loadReportData() {
    try {
        const client = window.supabaseClient || supabaseClient;
        const { data, error } = await client.from('transaksi').select('*').order('id', { ascending: false });
        
        if (error) throw error;

        const tbody = document.getElementById('report-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data transaksi atau piutang.</td></tr>`;
            return;
        }

        data.forEach(trx => {
            const totalBiaya = (trx.biaya_dokter || 0);
            
            // Pencegahan agar tidak memunculkan undefined
            const idPasienText = (trx.pasien_id && trx.pasien_id !== 'undefined') ? `ID: ${trx.pasien_id}` : 'Umum';
            const idObatText = (trx.item_id && trx.item_id !== 'undefined') ? `Obat ID: ${trx.item_id}` : 'Resep Standar';

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

// 8. Validasi & Submit Jurnal
function validateBalance() {
    const debit = parseFloat(document.getElementById('jurnal-debit').value) || 0;
    const credit = parseFloat(document.getElementById('jurnal-credit').value) || 0;
    const warning = document.getElementById('balance-warning');
    if (warning) {
        warning.innerText = (debit > 0 && credit > 0) ? "Peringatan: Biasanya transaksi diisi salah satu (Debit atau Kredit) per baris akun." : "";
    }
}

async function submitJournal(event) {
    event.preventDefault();
    const client = window.supabaseClient || supabaseClient;
    const newEntry = {
        transaction_date: document.getElementById('jurnal-date').value,
        reference_number: document.getElementById('jurnal-ref').value,
        description: document.getElementById('jurnal-desc').value,
        account_code: document.getElementById('jurnal-account').value,
        debit: parseFloat(document.getElementById('jurnal-debit').value) || 0,
        credit: parseFloat(document.getElementById('jurnal-credit').value) || 0,
    };

    const { error } = await client.from('journal_entries').insert([newEntry]);
    if (error) {
        alert("Gagal menyimpan transaksi: " + error.message);
    } else {
        alert("Transaksi berhasil disimpan!");
        document.getElementById('journal-form').reset();
    }
}

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

        // Ambil data obat/persediaan
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
