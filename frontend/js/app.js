// Jalankan saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
    loadInventoryData();
});

// 1. Fungsi Utama untuk Mengganti Tab dan Menandai Menu Aktif
function switchTab(targetId) {
    // 1. Sembunyikan semua section yang memiliki kelas 'content-section'
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(sec => {
        sec.style.display = 'none';
    });

    // 2. Tampilkan hanya section yang dipilih
    const selectedSection = document.getElementById(targetId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // 3. Panggil fungsi data otomatis berdasarkan menu yang dibuka
    if (targetId === 'stok-section' && typeof loadInventoryData === 'function') {
        loadInventoryData();
    } else if (targetId === 'laporan-section' && typeof loadReportData === 'function') {
        loadReportData();
    } else if (targetId === 'statistik-section' && typeof loadStatistics === 'function') {
        loadStatistics();
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
    // Menangkap berbagai kemungkinan nama kolom harga di database Anda
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
let myChart = null; // Variabel untuk menyimpan instance chart agar tidak menumpuk

async function loadStatistics() {
    try {
        const client = window.supabaseClient || supabaseClient;
        
        // Ambil data transaksi dari Supabase
        const { data, error } = await client.from('transaksi').select('*');
        if (error) throw error;

        // Kelompokkan data atau siapkan data dummy jika data masih kosong
        // Contoh sederhana: Menampilkan tren biaya/pendapatan berdasarkan tanggal
        const tanggalList = [];
        const pendapatanList = [];

        if (data && data.length > 0) {
            data.forEach(trx => {
                tanggalList.push(trx.tanggal || 'Hari Ini');
                pendapatanList.push(trx.biaya_dokter || 0);
            });
        } else {
            // Data cadangan jika tabel masih kosong agar grafik tetap tampil rapi
            tanggalList.push('Belum ada data', 'Belum ada data');
            pendapatanList.push(0, 0);
        }

        const ctx = document.getElementById('grafikPendapatan');
        if (!ctx) return;

        // Hancurkan chart lama jika sudah ada supaya tidak bug saat berpindah menu
        if (myChart) {
            myChart.destroy();
        }

        // Buat Grafik Baru menggunakan Chart.js
        myChart = new Chart(ctx, {
            type: 'bar', // Bisa diganti 'line' untuk grafik garis
            data: {
                labels: tanggalList,
                datasets: [{
                    label: 'Pendapatan Jasa Medis (Rp)',
                    data: pendapatanList,
                    backgroundColor: 'rgba(13, 148, 136, 0.6)', // Warna teal khas medis
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
        console.error("Gagal memuat statistik grafik:", err.message);
    }
}
