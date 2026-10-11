-- Memastikan Foreign Key terhubung dengan benar di Supabase
ALTER TABLE transaksi_medis 
  DROP CONSTRAINT IF EXISTS fk_pasien,
  ADD CONSTRAINT fk_pasien 
  FOREIGN KEY (id_pasien) REFERENCES pasien(id_pasien) ON DELETE CASCADE;

ALTER TABLE transaksi_medis 
  DROP CONSTRAINT IF EXISTS fk_persediaan,
  ADD CONSTRAINT fk_persediaan 
  FOREIGN KEY (id_item) REFERENCES persediaan(id_item) ON DELETE SET NULL;