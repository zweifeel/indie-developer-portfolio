import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trash2, ArrowLeft, Clock, Mail, ShieldAlert, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { fetchPublicCompliance } from '../services/cmsComplianceService';
import { DeleteAccountData } from '../types/compliance';

export const DeleteAccountPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState<boolean>(Boolean(slug));
  const [error, setError] = useState<string | null>(slug ? null : 'Parameter proyek tidak ditemukan.');
  const [projectName, setProjectName] = useState<string>('');
  const [deleteAccount, setDeleteAccount] = useState<DeleteAccountData | null>(null);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchPublicCompliance(slug)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.deleteAccount) {
          setProjectName(res.project?.name || slug);
          setDeleteAccount(res.deleteAccount);
          document.title = `Hapus Akun & Data — ${res.project?.name || slug} | SleepyKoala Studio`;
        } else {
          setError(res.message || 'Panduan penghapusan akun untuk proyek ini belum dipublikasikan.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Gagal memuat informasi kepatuhan.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-mono text-sm">Memuat Panduan Penghapusan Akun...</p>
        </div>
      </div>
    );
  }

  if (error || !deleteAccount) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Halaman Belum Tersedia</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {error || 'Panduan penghapusan akun untuk proyek ini sedang disiapkan.'}
          </p>
          <div className="space-y-3">
            <Link
              to={`/projects/${slug}`}
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Detail Proyek
            </Link>
            <Link
              to="/projects"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition text-sm"
            >
              Lihat Semua Proyek
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mailtoSubject = encodeURIComponent(`[HAPUS AKUN] Permintaan Penghapusan Data - ${projectName}`);
  const mailtoBody = encodeURIComponent(
    `Halo Tim SleepyKoala Studio,\n\nSaya ingin mengajukan permohonan penghapusan seluruh data akun dan progres permainan saya untuk game ${projectName}.\n\nBerikut informasi akun saya:\n- ID Pengguna / Akun (jika ada):\n- Alamat Email Google Play:\n- Tanggal/Waktu Perkiraan Terakhir Bermain:\n\nMohon konfirmasi setelah proses penghapusan selesai dilakukan.\n\nTerima kasih.`
  );
  const mailtoLink = `mailto:${deleteAccount.requestEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link
            to={`/projects/${slug}`}
            className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-rose-400 transition mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Detail {projectName}
          </Link>

          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-800">
                Play Console Compliance
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Hapus Akun & Data Pengguna</h1>
            </div>
          </div>
          <p className="text-slate-400 text-base">
            Prosedur resmi pengajuan penghapusan akun dan data permainan untuk game/aplikasi <span className="text-rose-300 font-semibold">{projectName}</span>.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 border-t border-slate-800 pt-4">
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Estimasi Proses: {deleteAccount.turnaroundTime || '3-7 hari kerja'}
            </span>
            <span className="flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Email Permintaan: {deleteAccount.requestEmail}
            </span>
            <span className="inline-flex items-center text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
              <CheckCircle className="w-3 h-3 mr-1" />
              Mekanisme Terverifikasi
            </span>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="mb-8 p-5 bg-rose-950/30 rounded-2xl border border-rose-800/60 text-slate-300 text-sm flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-white block mb-1">Tindakan ini bersifat permanen!</strong>
            Menghapus data akun akan menghapus seluruh catatan kemajuan game, skor, leaderboard lokal, dan data tersimpan.
            Data yang telah dihapus tidak dapat dipulihkan kembali oleh pengembang.
          </div>
        </div>

        {/* Data Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700/80">
            <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center">
              <Trash2 className="w-4 h-4 mr-2" />
              Data yang Dihapus Permanen
            </h3>
            {Array.isArray(deleteAccount.dataDeletedList) && deleteAccount.dataDeletedList.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-300">
                {deleteAccount.dataDeletedList.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 mr-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Semua data akun dan cloud save yang dapat diidentifikasi.</p>
            )}
          </div>

          <div className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700/80">
            <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center">
              <HelpCircle className="w-4 h-4 mr-2" />
              Data yang Dipertahankan (Jika Ada)
            </h3>
            {Array.isArray(deleteAccount.dataRetainedList) && deleteAccount.dataRetainedList.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-300">
                {deleteAccount.dataRetainedList.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 mr-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Tidak ada data pribadi yang disimpan setelah proses selesai.</p>
            )}
            <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-700/60 leading-normal">
              {deleteAccount.retentionPolicy}
            </p>
          </div>
        </div>

        {/* Step by step Instructions */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 p-6 sm:p-8 backdrop-blur-sm prose prose-invert max-w-none mb-8">
          <div className="whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed text-slate-200">
            {deleteAccount.content}
          </div>
        </div>

        {/* Direct Action Card */}
        <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-semibold text-white">Ajukan Permintaan Melalui Email</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Kirimkan format email yang telah disiapkan langsung ke tim pengembang untuk memproses penghapusan akun Anda.
            </p>
          </div>
          <a
            href={mailtoLink}
            className="px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition flex items-center flex-shrink-0 shadow-lg shadow-rose-900/20"
          >
            <Mail className="w-4 h-4 mr-2" />
            Buka Email Permintaan
          </a>
        </div>

        {/* Cross link to Privacy Policy */}
        <div className="mt-8 text-center">
          <Link
            to={`/projects/${slug}/privacy`}
            className="text-xs text-slate-400 hover:text-indigo-400 transition"
          >
            Lihat Kebijakan Privasi Lengkap {projectName} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
export default DeleteAccountPage;
