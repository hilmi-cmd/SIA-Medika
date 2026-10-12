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

// Elemen Tombol Reset
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
  if (error) {
    console.error('Error fetching persediaan:', error);
    return;
  }

  if (tablePersediaan) tablePersediaan.innerHTML = '';
  if (selectItem) selectItem.innerHTML = '<option value="">-- Pilih Obat/Alkes --</option>';

  if (data && data.length > 0) {
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
}

// 2. Ambil & Tampilkan Data Pasien
async function loadPasien() {
  const { data, error } = await supabase.from('pasien').select('*');
  if (error) {
    console.error('Error fetching pasien:', error);
    return;
  }

  if (selectPasien) {
    selectPasien.innerHTML = '<option value="">-- Pilih Pasien --</option>';

    if (data && data.length > 0) {
      data.forEach(p => {
        const nama = p.nama_pasien || p.nama || 'Tanpa Nama';
        const penjamin = p.penjamin || p.jenis_asuransi || 'Umum';
        selectPasien.innerHTML += `<option value="${p.id_pasien}">${nama} (${penjamin})</option>`;
      });
    }
  }
}

// 3. Ambil Data Transaksi & Tampilkan ke Tabel Laporan
async function loadTransaksi() {
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

// Fungsi Render Tabel Transaksi dan Hitung Total
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

      if (isPiutang) {
        totalPiutangAsuransi += total;
      } else {
        totalKasLunas += total;
      }

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

  updateSummaryCards(totalKasLunas, totalPiutangAsuransi);

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

// 6. Tombol Reset
if (btnResetSummary) {
  btnResetSummary.addEventListener('click', () => {
    if (confirm('Reset angka perhitungan summary ke Rp 0?')) {
      updateSummaryCards(0, 0);
    }
  });
}

if (btnResetLaporan) {
  btnResetLaporan.addEventListener('click', async () => {
    if (confirm('PERHATIAN: Hapus seluruh data transaksi dan kembalikan stok obat ke jumlah awal?')) {
      
      // 1. Hapus seluruh data transaksi di database
      const { error: errDel } = await supabase.from('transaksi_medis').delete().neq('id_transaksi', 0);
      if (errDel) {
        alert('Gagal menghapus transaksi: ' + errDel.message);
        return;
      }

      // 2. Kembalikan stok obat/alkes ke jumlah awal (sesuaikan ID item dan stok awal Anda)
      const stokAwalList = [
        { id_item: 1, stok: 5 },   // Paracetamol 500mg
        { id_item: 2, stok: 10 },  // Amoxicillin 500mg
        { id_item: 3, stok: 8 },   // Vitamin C 500mg
        { id_item: 4, stok: 5 },   // Ibuprofen 400mg
        { id_item: 5, stok: 100 }, // Spuit 3cc / Jarum
        { id_item: 6, stok: 2 }    // Kasa Steril Box
      ];

      for (let item of stokAwalList) {
        await supabase
          .from('persediaan')
          .update({ stok: item.stok })
          .eq('id_item', item.id_item);
      }

      alert('Laporan berhasil direset dan stok obat kembali ke jumlah awal!');
      
      // 3. Muat ulang data di halaman
      loadTransaksi();
      loadPersediaan();
    }
  });
}

// Load Data Awal Saat Aplikasi Dijalankan
loadPersediaan();
loadPasien();
loadTransaksi();
