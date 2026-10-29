# SPPD Human Capital

Aplikasi internal bagian Kompensasi & Manfaat untuk dua jenis perjalanan dan dua dokumen resmi. Sumber tarif: tiga workbook lama, sheet **Ketentuan Biaya**, bukan tabel bantu pembagian uang makan.

## Mulai menggunakan

1. Buka website privat dan masuk dengan akun pemilik. Pemilik pertama menjadi Admin HC.
2. Isi nama penandatangan, tanggal mulai berlaku tarif, dan nomor SPPD terakhir tahun berjalan. Jangan memasukkan tanggal berlaku berdasarkan perkiraan.
3. Tambahkan unit kerja asal beserta alamatnya di Pengaturan.
4. Tambahkan atau impor pegawai. Gunakan template Excel aplikasi. Nomor pegawai dan rekening harus berformat **Teks** sebelum diketik, agar nol awal terjaga.
5. Pilih jenis perjalanan, tanggal, hari dibayar, tujuan, dan peserta. Periksa rincian biaya dan kedua lembar cetak; simpan draf atau finalkan.
6. Unduh PDF dua halaman (SPPD portrait, Permintaan Uang landscape) dan cetak ukuran aktual/100%.

Admin mengelola pegawai, tarif, unit kerja, pengaturan, akses, pembatalan, dan cadangan. Petugas HC membuat draf, finalisasi, cetak, dan rekap. Izin akun dalam aplikasi tetap memerlukan izin membuka Site privat oleh pemilik melalui berbagi Site. Versi pertama diterbitkan khusus pemilik, tanpa memperluas audiens.

## Perhitungan v2 (29 Oktober 2026)

Hanya dua jenis tersedia pada pembuatan baru:

| Jenis | Nilai otomatis per peserta |
| --- | --- |
| Dalam provinsi | Uang saku harian × hari dibayar; taksi kota opsional (jika dicentang: tarif harian × hari); transport antar kota opsional satu kali |
| Luar provinsi | Uang saku harian × hari dibayar + taksi bandara satu kali + taksi kota satu kali |

Uang saku, taksi kota, dan taksi bandara merupakan input total per orang yang dapat diedit HC. `null` berarti otomatis; **0 adalah nilai manual sah**, bukan pengaktifan ulang otomatis. Tombol **Gunakan nilai otomatis** mengembalikan hasil sesuai ketentuan. Mengubah hari memperbarui nilai otomatis, sementara nominal manual tetap berlabel **Diubah HC**. Tidak menambahkan uang makan lagi.

Kode beban, nama penerima, dan rekening terisi otomatis. Penyesuaian penerima/rekening tersimpan khusus pada peserta di SPPD tersebut; master tetap utuh. Catatan penyesuaian tersedia. Kode khusus pengemudi/outsource/magang tetap memerlukan dasar penggunaan. Nomor rekening selalu teks.

Hari dibayar ditetapkan HC. Selisih dari hari kalender wajib diberi alasan. Saat jenis perjalanan diganti, override biaya direset agar biaya jenis sebelumnya tidak terbawa tersembunyi.

Final lama tidak dihitung ulang. Draf lama dibuka dengan pemberitahuan aturan baru dan harus diperiksa/simpan ulang sebelum finalisasi. Jenis mobil dinas lama dipetakan menjadi dalam provinsi saat membuat salinan atau melanjutkan draf, sementara arsip final mempertahankan template/nominalnya. Master mobil dinas lama tetap dapat tersimpan sebagai data historis; UI tarif dan pembuatan hanya menampilkan dua jenis.

## Peta open-source

Peta dalam provinsi memakai [mapcn](https://github.com/AnmolSaini16/mapcn) / MapLibre, peta dasar OpenStreetMap, routing [OSRM](https://project-osrm.org/docs/v5.24.0/api/#route-service), dan pencarian [Photon](https://github.com/komoot/photon). Tidak membutuhkan Google Maps API key. Komponen mapcn disalin dari commit `20c40868d5d39883a18073604d9587fb373af65e`, lisensi di `vendor/mapcn.LICENSE`. Worker MapLibre dibundel dari paket npm lokal.

1. Pilih unit kerja asal. Jika koordinatnya tersedia, titik A otomatis terpasang.
2. Jika koordinat belum ada, pilih tab **Titik unit asal**, cari alamat atau pasang pin tepat pada unit tersebut.
3. Cari tujuan lewat tombol **Cari lokasi**, atau klik/geser pin B. Tidak ada pencarian otomatis per ketikan.
4. Tekan **Hitung rute sekali jalan**. Hasil jarak, durasi, dan wilayah referensi dapat diterima sebagai penetapan HC.

Jarak adalah rute kendaraan **sekali jalan dari unit kerja asal**. Maksimum wilayah tidak otomatis menjadi nominal pembayaran. Tepat 100 km masih memerlukan keputusan HC. Peta tidak dicetak pada dokumen resmi. Untuk luar provinsi, kedua taksi tetap per perjalanan dan form tidak menampilkan peta.

Admin dapat mengganti URL tile, server OSRM, dan server Photon di Pengaturan tanpa mengubah kode. Default adalah layanan publik yang berbatas, tanpa jaminan ketersediaan. API pencarian/rute memerlukan login HC; permintaan keluar dibatasi per aplikasi dan hasil dicache di R2 selama 6 jam. Hanya koordinat/alamat tempat yang diminta, tanpa nama pegawai, rekening, atau nominal biaya. Endpoint wajib HTTPS publik. Peta mengikuti cache browser dan menampilkan atribusi OpenStreetMap secara terlihat. Tidak ada fitur unduhan/prefetch tile massal; kebijakan: https://operations.osmfoundation.org/policies/tiles/ .

Jika geocoder tidak menemukan tempat, pin manual tetap tersedia. Jika routing tidak tersedia, jarak manual bersumber tetap tersedia. Jika WebGL2 tidak tersedia, kegagalan peta ditampilkan pada panel tanpa merusak form SPPD.

## Laporan SPPD perorangan

Menu **Laporan perorangan** mendukung pilihan pegawai, rentang tanggal berangkat, jenis perjalanan, pembebanan, dan unit pada arsip. Ringkasan menampilkan jumlah SPPD, hari dibayar, subtotal tiap komponen, serta total per pegawai. Rincian menampilkan dokumen, tujuan/keperluan, penerima/rekening, beban, dan komponen biaya. Unduh **Ringkasan Excel** atau **Rincian Excel**.

Laporan mengambil nilai yang telah dikunci pada SPPD final, termasuk penyesuaian HC. Perubahan tarif/pegawai terbaru tidak mengubah laporan historis. Draf dan batal dikecualikan dari total. Filter pegawai memakai ID yang stabil, bukan mencocokkan nama bebas.

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
node scripts/verify-v2.mjs
node scripts/verify-api.mjs
```

`verify-api.mjs` hanya mengarah ke loopback lokal dan menambahkan data uji. Lengkapi pengaturan awal lokal terlebih dahulu. Halaman `/qa-print` hanya tersedia dalam development, menguji semua 8 template dengan kapasitas peserta penuh. Pada produksi halaman ini 404.

Jika shim `npm.cmd` Windows bermasalah, gunakan Node langsung untuk build/dev seperti di atas; jangan mengubah kebijakan lifecycle scripts sistem. Migrations dibuat dengan Drizzle dan diterapkan Sites sebelum Worker diterbitkan. Jangan membuat schema melalui endpoint aplikasi.

## Verifikasi revisi v2

- TypeScript dan build produksi lulus.
- 147 pemeriksaan aturan baru dan laporan perorangan.
- 31 pemeriksaan API, termasuk override, nol awal rekening, master tidak berubah, finalisasi bersamaan, penguncian, dan validasi peta.
- 294 pemeriksaan regresi aturan lama untuk arsip/fixture template.
- Pencarian Photon dan routing OSRM diuji live menggunakan lokasi umum Banjarmasin–Banjarbaru; hasil tersedia dalam meter dan garis rute.
- Form browser diuji dengan uang saku/penerima/rekening berbeda dari master; pratinjau tetap mengikuti template sumber.

Hal yang memerlukan data perusahaan: data pegawai/rekening terverifikasi, alamat/pin unit, penandatangan, tanggal berlaku, nomor terakhir, serta pemeriksaan cetak akhir pada printer operasional.

## Pegawai dummy

Pembaruan ini menambahkan 100 pegawai sintetis, DM001–DM100, dengan 23 jabatan dari 10 kriteria tarif. Nama, unit, penerima, dan rekening merupakan data uji. Rekening disimpan sebagai teks dengan nol awal. Pegawai berstatus aktif agar dapat dipilih saat mencoba membuat SPPD.

Dataset berada di `src/data/dummy-employees.ts`. Worker memasukkannya satu kali ke D1 dalam transaksi bersama penanda `__seed_dummy_employees_100_v1` dan catatan audit. Proses ini tidak menimpa nomor pegawai atau ID yang sudah ada. Setelah penanda tersimpan, kunjungan berikutnya tidak mengulang impor, termasuk bila pegawai dummy telah diedit atau dihapus. Data lokal dan produksi tetap terpisah. Tidak ada perubahan pengaturan, tarif, nomor SPPD, atau dokumen perjalanan.
