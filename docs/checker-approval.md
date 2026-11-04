# Persiapan checker dan approval SPPD

Status implementasi: **persiapan, belum aktif**. Modul yang tersedia saat ini menyimpan rancangan calon petugas, catatan alur, versi konfigurasi, serta audit perubahannya. Penyimpanan rancangan tidak memberikan hak pemeriksaan atau persetujuan. Belum ada pengajuan atau keputusan persetujuan terhadap SPPD sebenarnya.

## Rancangan alur awal

Draf → menunggu checker → menunggu approver → disetujui → finalisasi.

| Peran | Tanggung jawab yang direncanakan |
| --- | --- |
| Pembuat | Membuat draf, memilih peserta/kriteria, memeriksa biaya dan cetakan, mengajukan, serta memperbaiki dokumen yang dikembalikan. |
| Checker — Kepala Bagian Kompensasi dan Manfaat | Memeriksa perjalanan, hari dibayar, dasar jarak, identitas/rekening, kriteria/tarif, override biaya, dan pembebanan; meneruskan atau mengembalikan dengan alasan. |
| Approver — Kepala Divisi Human Capital | Menyetujui revisi yang sudah diperiksa atau mengembalikannya dengan alasan; dapat menolak sesuai aturan perusahaan yang nanti ditetapkan. |
| Admin | Mengatur rancangan dan akun; status admin sendiri tidak memberikan hak menyetujui dokumen atas nama pejabat lain. |

Jabatan checker dan approver telah ditetapkan pengguna. Akun kedua pejabat akan dibuat dan dipilih nanti; tidak ada pembuatan atau penetapan akun otomatis.

Asumsi rancangan: satu checker dan satu approver berurutan, dengan akun berbeda dari pembuat. Ini rancangan awal untuk dikonfirmasi, bukan penetapan kewenangan perusahaan.

## Aturan model yang disiapkan

- Pembuat tidak memeriksa atau menyetujui dokumennya sendiri.
- Checker dan approver merupakan dua akun berbeda dan bertindak sesuai urutan.
- Pengembalian dan penolakan wajib mencatat alasan.
- Persetujuan merujuk ke revisi dokumen tertentu. Perubahan isi membatalkan hasil pemeriksaan/persetujuan sebelumnya dan memerlukan pengajuan ulang.
- Keputusan mencatat pelaku, waktu, status awal/akhir, tindakan, catatan, dan revisi.
- Nomor manual tetap dapat diisi di draf; penerbitan nomor otomatis tetap pada finalisasi. Perubahan nomor setelah persetujuan direncanakan sebagai perubahan isi yang perlu diajukan ulang.
- Penolakan adalah akhir siklus; perbaikan biasa menggunakan pengembalian agar dapat diajukan ulang.

Model transisi murni berada di `src/lib/approval.ts` dan diuji melalui `scripts/verify-approval.mjs`. Model ini belum dihubungkan ke mutasi SPPD atau pemberian hak akses operasional.

## Yang sudah tersedia pada website

- Pengaturan → **Checker & persetujuan**, berlabel **Belum aktif**.
- Calon checker dan calon approver dapat dikosongkan atau dipilih dari akun HC aktif.
- Tombol **Simpan rancangan** menyimpan konfigurasi berstatus `preparation`, dengan pemeriksaan konflik versi.
- Pengaturan disimpan pada key `approval_preparation_v1` di tabel settings yang sudah ada. Cadangan rutin sudah mencakup tabel ini.
- Riwayat aktivitas mencatat `approval.preparation.saved` beserta versi dan calon akun. Riwayat keputusan per SPPD belum dibuat karena proses operasional belum diaktifkan.
- API pengajuan/pemeriksaan/persetujuan belum dapat dijalankan; permintaan tindakan tersebut mengembalikan 409. Aktivasi dari payload rancangan ditolak.
- Finalisasi langsung, perhitungan, data pegawai, nomor, dan dua hasil cetak tetap mengikuti alur yang sedang digunakan.

## Sebelum aktivasi operasional

Perlu penetapan akun untuk kedua jabatan yang telah ditentukan, cakupan wewenang per unit/jenis perjalanan/nominal, pengganti saat pejabat tidak tersedia, siapa yang memfinalkan setelah persetujuan, dan kapan pemeriksaan ulang diperlukan jika data induk/tarif berubah.

Setelah keputusan diterima, implementasikan penyimpanan pengajuan dan riwayat keputusan per SPPD, penguncian revisi beserta snapshot data/tarif, pemeriksaan kewenangan server, antrean tugas, tombol pengajuan/pengembalian/persetujuan, serta penghalang finalisasi untuk revisi yang belum disetujui. Aktivasi harus menjadi perubahan terpisah yang diminta pengguna; tidak ada tombol aktivasi pada tahap ini.
