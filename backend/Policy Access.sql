-- 1. Berikan izin INSERT (Tambah Data) untuk semua tabel
CREATE POLICY "Allow public insert on transaksi_medis" 
ON transaksi_medis FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public insert on pasien" 
ON pasien FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public insert on persediaan" 
ON persediaan FOR INSERT 
WITH CHECK (true);


-- 2. Berikan izin SELECT (Baca Data) untuk semua tabel
CREATE POLICY "Allow public select on transaksi_medis" 
ON transaksi_medis FOR SELECT 
USING (true);

CREATE POLICY "Allow public select on pasien" 
ON pasien FOR SELECT 
USING (true);

CREATE POLICY "Allow public select on persediaan" 
ON persediaan FOR SELECT 
USING (true);


-- 3. Berikan izin UPDATE (Potong Stok Obat) pada tabel persediaan
CREATE POLICY "Allow public update on persediaan" 
ON persediaan FOR UPDATE 
USING (true);