// 1. Fungsi Utama untuk Mengganti Tab dan Menandai Menu Aktif
function switchTab(tabId) {
    // Sembunyikan semua section konten tab
    document.querySelectorAll('.tab-content').forEach(el => {
        el.style.display = 'none';
    });
    
    // Hapus kelas 'active' dari semua menu sidebar
    document.querySelectorAll('.sidebar .menu-list a').forEach(el => {
        el.classList.remove('active');
    });
    
    // Tampilkan tab yang dituju
    const target = document.getElementById(tabId);
    if (target) {
        target.style.display = 'block';
    }

    // Berikan kelas 'active' pada menu sidebar yang sedang diklik
    const activeLink = document.getElementById(`link-${tabId}`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Panggil fungsi data otomatis berdasarkan tab yang dibuka
    if (tabId === 'persediaan') {
        loadInventoryData();
    } else if (tabId === 'transaksi' || tabId === 'laporan') {
        loadPatientDropdown();
        loadInventoryDropdown();
    } else if (tabId === 'statistik') {
        loadStatistics();
    } else if (tabId === 'buku-besar') {
        loadAccountDropdown();
    } else if (tabId === 'jurnal') {
        loadAccountDropdownForJournal();
    }
}

// 2. Fungsi Mengambil Data Stok Persediaan
async function loadInventoryData() {
    try {
        const { data, error } = await supabaseClient.from('persediaan').select('*');
        if (error) throw error;

        const tbody = document.getElementById('inventory-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Belum ada data persediaan.</td></tr>`;
            return;
        }

        data.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.id || item.item_code || '-'}</td>
                    <td>${item.nama_item || item.name || '-'}</td>
                    <td>${item.kategori || '-'}</td>
                    <td>${item.stok || 0}</td>
                    <td>Rp ${Number(item.harga_satuan || item.price || 0).toLocaleString('id-ID')}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Gagal memuat persediaan:", err);
    }
}

// 3. Fungsi Dropdown Pasien
async function loadPatientDropdown() {
    try {
        const { data, error } = await supabaseClient.from('pasien').select('*');
        if (error) throw error;
        const select = document.getElementById('pasien');
        if (!select) return;
        select.innerHTML = `<option value="">-- Pilih Pasien --</option>`;
        data.forEach(p => {
            select.innerHTML += `<option value="${p.id}">${p.nama_pasien || p.name}</option>`;
        });
    } catch (err) {
        console.error("Gagal memuat pasien:", err);
    }
}

// 4. Fungsi Dropdown Obat
async function loadInventoryDropdown() {
    try {
        const { data, error } = await supabaseClient.from('persediaan').select('*');
        if (error) throw error;
        const select = document.getElementById('item-obat');
        if (!select) return;
        select.innerHTML = `<option value="">-- Pilih Obat/Alkes --</option>`;
        data.forEach(item => {
            select.innerHTML += `<option value="${item.id}">${item.nama_item} (Stok: ${item.stok})</option>`;
        });
    } catch (err) {
        console.error("Gagal memuat dropdown obat:", err);
    }
}

// 5. Fungsi Statistik Keuangan
async function loadStatistics() {
    try {
        const { data: journalData, error } = await supabaseClient.from('journal_entries').select('debit, credit, account_code');
        if (error) throw error;

        let totalRevenue = 0;
        if (journalData) {
            journalData.forEach(row => {
                if (row.account_code === '4101') {
                    totalRevenue += (row.credit - row.debit);
                }
            });
        }

        document.getElementById('stat-total-revenue').innerText = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
        document.getElementById('stat-total-patients').innerText = "24 Pasien"; 
        document.getElementById('stat-total-receivable').innerText = "Rp 1.500.000";
    } catch (err) {
        console.error("Gagal memuat statistik:", err);
    }
}

// 6. Fungsi Buku Besar & Akun
async function loadAccountDropdown() {
    const { data: accounts, error } = await supabaseClient.from('accounts').select('*');
    if (error) return;
    const selectEl = document.getElementById('filter-account');
    if (!selectEl) return;
    selectEl.innerHTML = accounts.map(acc => `<option value="${acc.account_code}">${acc.account_code} - ${acc.account_name}</option>`).join('');
    loadGeneralLedger();
}

async function loadAccountDropdownForJournal() {
    const { data: accounts, error } = await supabaseClient.from('accounts').select('*');
    if (error) return;
    const selectEl = document.getElementById('jurnal-account');
    if (!selectEl) return;
    selectEl.innerHTML = accounts.map(acc => `<option value="${acc.account_code}">${acc.account_code} - ${acc.account_name}</option>`).join('');
}

async function loadGeneralLedger() {
    const accountCode = document.getElementById('filter-account')?.value;
    if (!accountCode) return;

    const { data: entries, error } = await supabaseClient
        .from('journal_entries')
        .select('*')
        .eq('account_code', accountCode)
        .order('transaction_date', { ascending: true });

    if (error) return;

    let runningBalance = 0;
    const tbody = document.getElementById('ledger-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

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

// 7. Validasi & Submit Jurnal
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
    const newEntry = {
        transaction_date: document.getElementById('jurnal-date').value,
        reference_number: document.getElementById('jurnal-ref').value,
        description: document.getElementById('jurnal-desc').value,
        account_code: document.getElementById('jurnal-account').value,
        debit: parseFloat(document.getElementById('jurnal-debit').value) || 0,
        credit: parseFloat(document.getElementById('jurnal-credit').value) || 0,
    };

    const { error } = await supabaseClient.from('journal_entries').insert([newEntry]);
    if (error) {
        alert("Gagal menyimpan transaksi: " + error.message);
    } else {
        alert("Transaksi berhasil disimpan!");
        document.getElementById('journal-form').reset();
    }
}
