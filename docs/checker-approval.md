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
- API pengajuan/pengajuan ulang/pemeriksaan/persetujuan belum dapat dijalankan; permintaan tindakan tersebut mengembalikan 409. Aktivasi dari payload rancangan ditolak.
- Finalisasi langsung, perhitungan, data pegawai, nomor, dan dua hasil cetak tetap mengikuti alur yang sedang digunakan.

## Sebelum aktivasi operasional

Perlu penetapan akun untuk kedua jabatan yang telah ditentukan, cakupan wewenang per unit/jenis perjalanan/nominal, pengganti saat pejabat tidak tersedia, siapa yang memfinalkan setelah persetujuan, dan kapan pemeriksaan ulang diperlukan jika data induk/tarif berubah.

Setelah keputusan diterima, implementasikan penyimpanan pengajuan dan riwayat keputusan per SPPD, penguncian revisi beserta snapshot data/tarif, pemeriksaan kewenangan server, antrean tugas, tombol pengajuan/pengembalian/persetujuan, serta penghalang finalisasi untuk revisi yang belum disetujui. Aktivasi harus menjadi perubahan terpisah yang diminta pengguna; tidak ada tombol aktivasi pada tahap ini.

## Persiapan revisi dan pengajuan ulang

Alur: **Menunggu checker → Perlu revisi → Sedang diperbaiki → Diajukan ulang → Menunggu checker**.

1. Checker (Kepala Bagian Kompensasi dan Manfaat) mengembalikan pengajuan dengan alasan wajib. Model menyimpan alasan, pelaku, waktu, dan revisi yang dikembalikan.
2. Pembuat memperbaiki draf SPPD yang sama. Setiap penyimpanan perbaikan menaikkan revisi, menyimpan perubahan isian sebelum/sesudah, dan menghitung ulang biaya. Snapshot pengajuan sebelumnya tidak ditimpa.
3. Pengajuan ulang hanya dari pembuat, setelah ada perubahan nyata dan revisi baru. Catatan perbaikan wajib diisi, kemudian data perjalanan dan perhitungan divalidasi ulang.
4. Pengajuan ulang menyimpan snapshot baru beserta nomor versi, waktu, catatan, identitas/rekening peserta, tarif, dan total. Pemeriksaan serta persetujuan versi sebelumnya tidak berlaku bagi revisi baru.
5. Pengajuan ulang selalu kembali ke checker. Setelah lolos, revisi tersebut diteruskan ke approver (Kepala Divisi Human Capital). Pengembalian dari approver juga memerlukan pemeriksaan checker kembali.
6. Nomor manual pada draf tetap dipertahankan selama tidak diubah pembuat. Model ini tidak mengonsumsi atau menerbitkan nomor otomatis.

Implementasi persiapan: `src/lib/approval-revisions.ts` menyediakan model murni untuk snapshot pengajuan, perubahan isian, perhitungan ulang, riwayat keputusan, serta pemeriksaan keterkaitan revisi. Belum ada penyimpanan riwayat persetujuan SPPD operasional atau kewenangan akun baru.

Di Pengaturan terdapat **Simulasi alur revisi (data contoh)**. Simulasi memakai data sintetis dan identitas `.invalid` yang bukan akun login. State hanya di memori halaman; tidak memanggil API mutasi, menulis data operasional, atau membuat akun. Muat ulang halaman mengembalikan simulasi ke awal.

Validasi: `scripts/verify-approval-revisions.mjs` memeriksa kewenangan pembuat/checker/approver, catatan wajib, perubahan nyata, pengajuan ulang, snapshot lama, versi, perubahan biaya, nomor tetap, dan penolakan data yang berbeda dari pengajuan. `scripts/verify-api-approval-disabled.mjs` memastikan endpoint tetap 409 untuk semua metode dan akun/dokumen/nomor/penugasan tidak berubah; pengujian ini hanya menggunakan loopback lokal dan tidak membuat akun.

Aktivasi tetap menjadi perubahan terpisah setelah akun checker dan approver dibuat serta pengguna meminta aktivasi. Pembuatan akun saja tidak mengaktifkan alur secara otomatis.
