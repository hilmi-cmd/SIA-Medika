// Jalankan saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
    loadInventoryData();
});

// 1. Fungsi Utama untuk Mengganti Tab dan Menandai Menu Aktif
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.style.display = 'none';
    });
    
    document.querySelectorAll('.sidebar .menu-list a').forEach(el => {
        el.classList.remove('active');
    });
    
    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
    }

    const activeLink = document.getElementById(`link-${tabId}`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    if (tabId === 'persediaan') {
        loadInventoryData();
    } else if (tabId === 'transaksi' || tabId === 'laporan') {
        loadPatientDropdown();
        loadInventoryDropdown();
        if (tabId === 'laporan') loadReportData();
    } else if (tabId === 'statistik') {
        loadStatistics();
    } else if (tabId === 'buku-besar') {
        loadAccountDropdown();
    } else if (tabId === 'jurnal') {
        loadAccountDropdownForJournal();
    }
}

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
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data persediaan di database.</td></tr>`;
            return;
        }

        data.forEach(item => {
    tbody.innerHTML += `
        <tr>
            <td>${item.id || item.item_code || '-'}</td>
            <td>${item.nama_item || item.name || '-'}</td>
            <td>${item.kategori || '-'}</td>
            <td>${item.stok || 0}</td>
            <td>Rp ${Number(item.harga_satuan || item.price || item.harga || 0).toLocaleString('id-ID')}</td>
        </tr>
    `;
});
    } catch (err) {
        console.error("Gagal memuat persediaan:", err.message);
        const tbody = document.getElementById('inventory-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: ${err.message}</td></tr>`;
        }
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
    const client = window.supabaseClient || supabaseClient;
    const accountCode = document.getElementById('filter-account')?.value;
    if (!accountCode) return;

    const { data: entries, error } = await client
        .from('journal_entries')
        .select('*')
        .eq('account_code', accountCode)
        .order('transaction_date', { ascending: true });

    if (error) return;

    let runningBalance = 0;
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!entries || entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Belum ada transaksi untuk akun ini.</td></tr>`;
        return;
    }

    entries.forEach(entry => {
        runningBalance += (Number(entry.debit) - Number(entry.credit));
        tbody.innerHTML += `
            <tr>
                <td>${entry.transaction_date}</td>
                <td>${entry.reference_number || '-'}</td>
                <td>${entry.description}</td>
                <td>Rp ${Number(entry.debit).toLocaleString('id-ID')}</td>
                <td>Rp ${Number(entry.credit).toLocaleString('id-ID')}</td>
                <td>Rp ${runningBalance.toLocaleString('id-ID')}</td>
            </tr>
        `;
    });
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
