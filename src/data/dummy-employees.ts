import type { Employee } from '../lib/domain';

const groups = [
  { criterion: 1, count: 2, positions: ['Direktur Utama', 'Komisaris Utama'] },
  { criterion: 2, count: 4, positions: ['Anggota Direksi', 'Anggota Komisaris'] },
  { criterion: 3, count: 10, positions: ['Dewan Pengawas Syariah', 'Head Group', 'Staf Khusus', 'Kepala Divisi'] },
  { criterion: 4, count: 4, positions: ['Kepala Cabang Utama', 'Komite Dewan Komisaris'] },
  { criterion: 5, count: 10, positions: ['Kepala Cabang', 'Wakil Kepala Divisi'] },
  { criterion: 6, count: 12, positions: ['Kepala Bagian', 'Dir UPZ'] },
  { criterion: 7, count: 18, positions: ['Kepala Cabang Pembantu', 'Kepala Seksi', 'Pejabat Fungsional', 'Koordinator'] },
  { criterion: 8, count: 24, positions: ['Pegawai Clerical (Pegawai/Capeg)'] },
  { criterion: 9, count: 10, positions: ['Pegawai Non Clerical', 'Tenaga Honor/Kontrak'] },
  { criterion: 10, count: 6, positions: ['Pegawai Outsourching', 'Tenaga Magang'] },
];

const names = ['Adi', 'Ayu', 'Bayu', 'Bela', 'Citra', 'Dedi', 'Dewi', 'Dian', 'Eka', 'Fajar', 'Fitri', 'Hadi', 'Intan', 'Joko', 'Lina', 'Nina', 'Rani', 'Rian', 'Sari', 'Yoga'];
const units = ['Kantor Pusat', 'Divisi Human Capital', 'Divisi Keuangan', 'Divisi Operasional', 'Divisi Teknologi Informasi', 'Divisi Manajemen Risiko', 'Cabang A', 'Cabang B', 'Cabang Pembantu A', 'Cabang Pembantu B'];

let sequence = 0;
export const dummyEmployees: Employee[] = groups.flatMap(group =>
  Array.from({ length: group.count }, (_, index) => {
    const number = ++sequence;
    const suffix = String(number).padStart(3, '0');
    const name = `Dummy ${names[(number - 1) % names.length]} ${suffix}`;
    const position = group.positions[index % group.positions.length];
    const unit = group.criterion <= 3 ? 'Kantor Pusat' : group.criterion === 4 ? 'Cabang Utama' : units[(number - 1) % units.length];
    return {
      id: `dummy-employee-${suffix}`,
      employeeNo: `DM${suffix}`,
      name,
      position,
      unit: `${unit} (Dummy)`,
      criterion: group.criterion,
      creditName: name,
      bankAccount: String(number).padStart(12, '0'),
      active: 1,
    };
  }),
);
