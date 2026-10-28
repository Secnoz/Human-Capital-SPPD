# SPPD Human Capital

Aplikasi internal bagian Kompensasi & Manfaat untuk tiga jenis perjalanan dan dua dokumen resmi. Sumber tarif: tiga workbook lama, sheet **Ketentuan Biaya**, bukan tabel bantu pembagian uang makan.

## Mulai menggunakan

1. Buka website privat dan masuk dengan akun pemilik. Pemilik pertama menjadi Admin HC.
2. Isi nama penandatangan, tanggal mulai berlaku tarif, dan nomor SPPD terakhir tahun berjalan. Jangan memasukkan tanggal berlaku berdasarkan perkiraan.
3. Tambahkan unit kerja asal beserta alamatnya di Pengaturan.
4. Tambahkan atau impor pegawai. Gunakan template Excel aplikasi. Nomor pegawai dan rekening harus berformat **Teks** sebelum diketik, agar nol awal terjaga.
5. Pilih jenis perjalanan, tanggal, hari dibayar, tujuan, dan peserta. Periksa rincian biaya dan kedua lembar cetak; simpan draf atau finalkan.
6. Unduh PDF dua halaman (SPPD portrait, Permintaan Uang landscape) dan cetak ukuran aktual/100%.

Admin mengelola pegawai, tarif, unit kerja, pengaturan, akses, pembatalan, dan cadangan. Petugas HC membuat draf, finalisasi, cetak, dan rekap. Izin akun dalam aplikasi tetap memerlukan izin membuka Site privat oleh pemilik melalui berbagi Site. Versi pertama diterbitkan khusus pemilik, tanpa memperluas audiens.

## Perhitungan

| Jenis | Rumus per peserta |
| --- | --- |
| Dalam provinsi, mobil dinas | Uang saku harian × hari dibayar |
| Dalam provinsi | Uang saku harian × hari + taksi kota Rp100.000 × hari + transport antar kota manual satu kali |
| Luar provinsi | Uang saku harian × hari + taksi kota harian × hari + taksi bandara satu kali |

Kriteria 1–10 dipilih eksplisit pada pegawai, kemudian tarif tepat sesuai tanggal berangkat. Kode reguler Umum 60266 dan Pendidikan 60252. Pengemudi/outsource/magang memakai kode khusus hanya setelah ditetapkan HC dan diberi alasan. Tidak menambahkan uang makan lagi; penginapan/laundry/tiket tidak diaktifkan otomatis karena tidak masuk rumus utama MASTER. Pendidikan dengan mobil dinas belum tersedia karena tidak ada template sumber.

Hari dibayar tetap dipilih HC. Selisih dari durasi kalender inklusif harus diberi alasan. Total menjumlahkan semua peserta yang dipilih. Menghapus peserta menghapus seluruh komponennya. Taksi bandara bukan per hari dan tidak digandakan menjadi pulang-pergi.

## Peta

Isi **Google Maps API key browser** di Pengaturan. Aktifkan billing, Maps JavaScript API, Routes API, dan Places API (New). Batasi key ke HTTP referrer domain Site serta API yang diperlukan, dengan kuota sesuai perusahaan. Kolom ini memang disiapkan kosong karena key belum tersedia.

Jarak adalah rute kendaraan **sekali jalan dari unit kerja asal**, bukan garis lurus. Nilai peta tidak otomatis mengisi maksimum transport atau mengubah rumus biaya. Batas tepat 100 km tetap memerlukan keputusan HC karena sumber tumpang tindih. Rute dan estimasi ditampilkan sementara; tanpa layanan aktif HC dapat mengisi jarak beserta sumber/alasan dan menetapkan wilayah. Untuk penerbangan, peta hanya referensi ruas darat. Peta tidak ikut dicetak.

Implementasi memakai [Routes library](https://developers.google.com/maps/documentation/javascript/routes/get-a-route). Uji live API menunggu key perusahaan; kegagalan layanan tidak menghasilkan jarak atau wilayah palsu.

## Ketepatan cetak

Delapan aset template tersanitasi menyimpan geometri native PDF hasil cetak Excel, margin, garis, ukuran font, baseline, nomor urut, serta susunan masing-masing master. Tidak ada workbook asli atau data contoh pribadi yang ikut diterbitkan.

SPPD berbeda untuk MD/DP/LP; Permintaan Uang memiliki lima varian MD Umum, DP Umum/Pendidikan, LP Umum/Pendidikan. Kapasitas MD 8 peserta; DP/LP 9 peserta. Slot kosong benar-benar kosong. Salah lookup, jumlah tiga baris, data biaya tersembunyi, kode rekening pecahan, dan tanggal rusak pada workbook lama tidak direplikasi.

Perbaikan yang disengaja: uraian perjalanan DP/LP di sel gabung C25:E25 pada sumber terpotong. Renderer meneruskan teks ke sel kosong pada **baris yang sama**, tanpa memindahkan garis, judul, atau tanda tangan. Teks lain yang melebihi ruang akan memblokir finalisasi/unduhan sampai diringkas.

PDF dihasilkan dari canvas resolusi tinggi (raster), bukan formulir PDF yang dapat diedit atau teks yang bisa dipilih. Gunakan Windows dengan **Calibri dan Arial** dari Microsoft Office untuk hasil visual sesuai master. Font berlisensi tidak disalin ke server. Pada komputer tanpa font itu, fallback browser dapat berbeda. Geometri telah diuji; belum ada klaim perbandingan pixel identik pada semua printer/perangkat.

## Penyimpanan & kontrol

- Cloudflare D1: pegawai, tarif, unit, draf, SPPD, snapshot final, anggota, nomor urut, dan audit.
- Final menyimpan identitas/rekening, tarif, perhitungan, penandatangan, nama perusahaan, dan versi template. Perubahan master tidak menghitung ulang arsip.
- Nomor diberikan secara atomik saat finalisasi; permintaan berulang tidak mengonsumsi nomor kedua. Konflik revisi draf ditolak.
- Admin membatalkan dengan alasan. Nomor dan data tetap tersimpan; salin dokumen batal untuk membuat pengganti.
- Rekap hanya menjumlahkan Final, berdasarkan tanggal berangkat. Draf/batal dikecualikan. Ekspor XLSX memakai snapshot final dan string aman, bukan rumus.
- Cadangan R2 otomatis pada kunjungan pertama setiap hari serta tombol manual. Ini **bukan cron saat website tidak dikunjungi**. Unduh cadangan dari Pengaturan untuk penyimpanan internal; pemulihan memerlukan validasi pengelola teknis.
- Aplikasi tidak memasang tanda tangan digital atau mengirim pembayaran. Dokumen mengikuti persetujuan/tanda tangan perusahaan di luar aplikasi.

## Pengembangan lokal

Node.js >=22.13, disarankan Node 24. Instal dependensi sesuai lockfile. Starter Vinext/React menggunakan Workers dengan D1/R2.

```powershell
npm run install:ci
node scripts/run-framework.mjs build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_graceful_roughhouse.sql
node scripts/run-framework.mjs dev
```

Pratinjau lokal `http://127.0.0.1:5173/` menggunakan identitas mock Seedy dari starter. Mock hanya aktif pada server pengembangan lokal; produksi memakai identitas ChatGPT dari Sites. Data D1 lokal dan data produksi terpisah; data uji lokal tidak diunggah.

```powershell
node node_modules/typescript/bin/tsc --noEmit
node scripts/verify-domain.mjs
node scripts/verify-api.mjs
```

`verify-api.mjs` hanya mengarah ke loopback lokal dan menambahkan data uji. Lengkapi pengaturan awal lokal terlebih dahulu. Halaman `/qa-print` hanya tersedia dalam development, menguji semua 8 template dengan kapasitas peserta penuh. Pada produksi halaman ini 404.

Jika shim `npm.cmd` Windows bermasalah, gunakan Node langsung untuk build/dev seperti di atas; jangan mengubah kebijakan lifecycle scripts sistem. Migrations dibuat dengan Drizzle dan diterapkan Sites sebelum Worker diterbitkan. Jangan membuat schema melalui endpoint aplikasi.

## Verifikasi yang dilakukan

- TypeScript dan build produksi lulus.
- 294 pemeriksaan domain: 30 tarif × tiga durasi, batas wilayah, validasi peserta/tanggal, kode, snapshot identitas, dan terbilang.
- 23 pemeriksaan API: autentikasi, simpan tiga jenis, finalisasi bersamaan idempoten, nomor urut, penguncian data, pembatalan, dan konflik revisi.
- 8 varian dengan 8/9 peserta lulus ruang cetak; PDF gabungan memiliki 8 halaman A4 sesuai orientasi.
- Pemeriksaan sumber terpisah di workspace induk memuat 57 pemeriksaan struktur dan aritmetika workbook. Itu tidak menggantikan rekalkulasi native seluruh rumus Excel.

Hal yang memerlukan data perusahaan: daftar pegawai/rekening yang sudah diverifikasi, alamat unit, nama penandatangan, tanggal berlaku, nomor terakhir, akses akun HC, API key peta, serta pemeriksaan cetak akhir oleh HC pada printer yang digunakan.
