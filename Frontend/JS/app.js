import { supabase } from './supabaseClient.js';

// Elemen UI
const tablePersediaan = document.querySelector('#table-persediaan tbody');
const tableTransaksi = document.querySelector('#table-transaksi tbody');
const selectPasien = document.querySelector('#select-pasien');
const selectItem = document.querySelector('#select-item');
const formTransaksi = document.querySelector('#form-transaksi');

// Elemen Summary Card Laporan
const statPendapatan = document.querySelector('#stat-pendapatan');
const statPiutang = document.querySelector('#stat-piutang');
const statOmset = document.querySelector('#stat-omset');

// Elemen Tombol Reset (Baru)
const btnResetSummary = document.querySelector('#btn-reset-summary');
const btnResetLaporan = document.querySelector('#btn-reset-laporan');

// Helper Function: Update Angka Ringkasan Laporan
function updateSummaryCards(totalKasLunas, totalPiutangAsuransi) {
  const totalOmset = totalKasLunas + totalPiutangAsuransi;
  
  if (statPendapatan) statPendapatan.innerText = `Rp ${totalKasLunas.toLocaleString('id-ID')}`;
  if (statPiutang) statPiutang.innerText = `Rp ${totalPiutangAsuransi.toLocaleString('id-ID')}`;
  if (statOmset) statOmset.innerText = `Rp ${totalOmset.toLocaleString('id-ID')}`;
}

// 1. Ambil & Tampilkan Data Persediaan
async function loadPersediaan() {
  const { data, error } = await supabase.from('persediaan').select('*');
  if (error) return console.error('Error fetching persediaan:', error);

  if (tablePersediaan) tablePersediaan.innerHTML = '';
  if (selectItem) selectItem.innerHTML = '<option value="">-- Pilih Obat/Alkes --</option>';

  data.forEach(item => {
    const hargaJual = item.harga_jual || item.harga_satuan || 0;

    if (tablePersediaan) {
      tablePersediaan.innerHTML += `
        <tr>
          <td>${item.id_item}</td>
          <td>${item.nama_item}</td>
          <td>${item.kategori || '-'}</td>
          <td>${item.stok || 0}</td>
          <td>Rp ${Number(hargaJual).toLocaleString('id-ID')}</td>
        </tr>
      `;
    }

    if (selectItem && item.kategori !== 'Jasa Medis') {
      selectItem.innerHTML += `<option value="${item.id_item}" data-harga="${hargaJual}" data-stok="${item.stok}">${item.nama_item} (Stok: ${item.stok})</option>`;
    }
  });
}

// 2. Ambil & Tampilkan Data Pasien
async function loadPasien() {
  const { data, error } = await supabase.from('pasien').select('*');
  if (error) return console.error('Error fetching pasien:', error);

  if (selectPasien) {
    selectPasien.innerHTML = '<option value="">-- Pilih Pasien --</option>';

    data.forEach(p => {
      const nama = p.nama_pasien || p.nama || 'Tanpa Nama';
      const penjamin = p.penjamin || p.jenis_asuransi || 'Umum';
      selectPasien.innerHTML += `<option value="${p.id_pasien}">${nama} (${penjamin})</option>`;
    });
  }
}

// 3. Ambil Data Transaksi & Tampilkan ke Tabel Laporan
async function loadTransaksi() {
  // Ambil data transaksi beserta relasi ke tabel pasien dan persediaan
  const { data, error } = await supabase
    .from('transaksi_medis')
    .select(`
      id_transaksi,
      tanggal,
      biaya_jasa,
      total_biaya,
      status_pembayaran,
      id_pasien,
      id_item,
      pasien ( nama_pasien, penjamin, jenis_asuransi ),
      persediaan ( nama_item )
    `)
    .order('id_transaksi', { ascending: false });

  if (error) {
    console.warn('Error fetching transaksi dengan relasi, menggunakan fallback:', error);
    return fetchTransaksiSimple();
  }

  renderTableAndSummary(data);
}

// Fungsi Fallback jika query relasi ke Supabase gagal
async function fetchTransaksiSimple() {
  const { data, error } = await supabase
    .from('transaksi_medis')
    .select('*')
    .order('id_transaksi', { ascending: false });

  if (error) {
    console.error('Gagal mengambil data transaksi:', error);
    updateSummaryCards(0, 0);
    return;
  }

  renderTableAndSummary(data || []);
}

// Fungsi Render Tabel Transaksi dan Hitung Total Pendapatan/Piutang/Omset
function renderTableAndSummary(data) {
  let totalKasLunas = 0;
  let totalPiutangAsuransi = 0;

  if (tableTransaksi) tableTransaksi.innerHTML = '';

  if (!data || data.length === 0) {
    if (tableTransaksi) {
      tableTransaksi.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: #888; padding: 15px;">
            Belum ada data transaksi. Silakan input transaksi baru di atas.
          </td>
        </tr>`;
    }
  } else {
    data.forEach(t => {
      const total = Number(t.total_biaya || 0);
      const status = t.status_pembayaran ? t.status_pembayaran.trim() : 'Lunas';
      const isPiutang = status === 'Piutang Asuransi';

      // Hitung ringkasan akuntansi
      if (isPiutang) {
        totalPiutangAsuransi += total;
      } else {
        totalKasLunas += total;
      }

      // Render ke tabel
      if (tableTransaksi) {
        const namaPasien = t.pasien?.nama_pasien || t.pasien?.nama || `Pasien ID #${t.id_pasien || '-'}`;
        const penjamin = t.pasien?.penjamin || t.pasien?.jenis_asuransi || 'Umum';
        const namaItem = t.persediaan?.nama_item || t.persediaan?.nama || `Item ID #${t.id_item || '-'}`;

        const aksiBtn = isPiutang 
          ? `<button class="btn-lunasi" data-id="${t.id_transaksi}">Cairkan / Lunasi</button>` 
          : `<span style="color: gray;">Lunas</span>`;

        const tgl = t.tanggal ? new Date(t.tanggal).toLocaleDateString('id-ID') : '-';

        tableTransaksi.innerHTML += `
          <tr>
            <td>#${t.id_transaksi}</td>
            <td>${tgl}</td>
            <td>${namaPasien}</td>
            <td>${penjamin}</td>
            <td>${namaItem}</td>
            <td>Rp ${Number(t.biaya_jasa || 0).toLocaleString('id-ID')}</td>
            <td>Rp ${total.toLocaleString('id-ID')}</td>
            <td style="color: ${isPiutang ? '#e74c3c' : '#27ae60'}; font-weight: bold;">
              ${status}
            </td>
            <td>${aksiBtn}</td>
          </tr>
        `;
      }
    });
  }

  // Update Tampilan Angka Card (Pendapatan, Piutang, Omset)
  updateSummaryCards(totalKasLunas, totalPiutangAsuransi);

  // Pasang Event Listener Tombol Pelunasan
  document.querySelectorAll('.btn-lunasi').forEach(button => {
    button.addEventListener('click', (e) => {
      const idTx = e.target.dataset.id;
      lunasiPiutang(idTx);
    });
  });
}

// 4. Fungsi Pelunasan Piutang Asuransi
async function lunasiPiutang(idTransaksi) {
  const konfirmasi = confirm(`Apakah klaim asuransi transaksi #${idTransaksi} sudah dicairkan/lunas?`);
  if (!konfirmasi) return;

  const { error } = await supabase
    .from('transaksi_medis')
    .update({ status_pembayaran: 'Lunas' })
    .eq('id_transaksi', idTransaksi);

  if (error) {
    alert('Gagal melunasi piutang: ' + error.message);
    return;
  }

  alert(`Transaksi #${idTransaksi} berhasil dilunasi! Kas bertambah.`);
  loadTransaksi();
}

// 5. Submit Transaksi Baru
if (formTransaksi) {
  formTransaksi.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idPasien = selectPasien.value;
    const selectedOption = selectItem.options[selectItem.selectedIndex];

    if (!idPasien || !selectedOption || !selectedOption.value) {
      alert('Harap pilih Pasien dan Item Obat/Alkes terlebih dahulu!');
      return;
    }

    const idItem = selectedOption.value;
    const hargaSatuan = Number(selectedOption.dataset.harga || 0);
    const stokSekarang = Number(selectedOption.dataset.stok || 0);

    const jumlah = Number(document.querySelector('#jumlah-item').value || 0);
    const biayaJasa = Number(document.querySelector('#biaya-jasa').value || 0);
    const statusPembayaran = document.querySelector('#status-pembayaran').value;

    if (jumlah > stokSekarang) {
      alert('Stok barang/obat tidak mencukupi!');
      return;
    }

    const totalBiaya = (jumlah * hargaSatuan) + biayaJasa;

    // Insert Transaksi Ke Supabase
    const { error: errTx } = await supabase.from('transaksi_medis').insert([
      {
        id_pasien: idPasien,
        id_item: idItem,
        jumlah: jumlah,
        biaya_jasa: biayaJasa,
        total_biaya: totalBiaya,
        status_pembayaran: statusPembayaran
      }
    ]);

    if (errTx) {
      alert('Gagal membuat transaksi: ' + errTx.message);
      return;
    }

    // Update Stok Persediaan
    await supabase
      .from('persediaan')
      .update({ stok: stokSekarang - jumlah })
      .eq('id_item', idItem);

    alert('Transaksi Berhasil Ditambahkan!');
    formTransaksi.reset();
    loadPersediaan();
    loadPasien();
    loadTransaksi();
  });
}

// -------------------------------------------------------------
// 6. FITUR BARRU: RESET PERHITUNGAN & LAPORAN
// -------------------------------------------------------------

// A. Reset Hanya Perhitungan Tampilan Summary (Pendapatan, Piutang, Omset)
if (btnResetSummary) {
  btnResetSummary.addEventListener('click', () => {
    const konfirmasi = confirm('Reset angka perhitungan summary (Pendapatan, Piutang, Omset) ke Rp 0?');
    if (konfirmasi) {
      updateSummaryCards(0, 0);
      alert('Perhitungan angka ringkasan telah direset ke 0.');
    }
  });
}

// B. Reset Seluruh Data Laporan Transaksi dari Database Supabase
if (btnResetLaporan) {
  btnResetLaporan.addEventListener('click', async () => {
    const konfirmasi = confirm('PERHATIAN: Apakah Anda yakin ingin menghapus SELURUH data transaksi medis di database? Tindakan ini tidak dapat dibatalkan.');
    if (!konfirmasi) return;

    // Menghapus seluruh baris data pada tabel transaksi_medis
    const { error } = await supabase
      .from('transaksi_medis')
      .delete()
      .neq('id_transaksi', 0); // Menghapus semua ID yang bukan 0

    if (error) {
      alert('Gagal mereset laporan transaksi: ' + error.message);
      return;
    }

    alert('Seluruh data laporan transaksi berhasil dihapus/direset!');
    loadTransaksi(); // Reload tabel & ringkasan otomatis
  });
}

// Load Data Awal Saat Aplikasi Dijalankan
loadPersediaan();
loadPasien();
loadTransaksi();