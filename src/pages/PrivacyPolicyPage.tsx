import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ArrowLeft, Calendar, Mail, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { fetchPublicCompliance } from '../services/cmsComplianceService';
import { PrivacyPolicyData } from '../types/compliance';

export const PrivacyPolicyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState<boolean>(Boolean(slug));
  const [error, setError] = useState<string | null>(slug ? null : 'Parameter proyek tidak ditemukan.');
  const [projectName, setProjectName] = useState<string>('');
  const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicyData | null>(null);

  useEffect(() => {
    if (!slug) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchPublicCompliance(slug)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.privacyPolicy) {
          setProjectName(res.project?.name || slug);
          setPrivacyPolicy(res.privacyPolicy);
          document.title = `Kebijakan Privasi — ${res.project?.name || slug} | SleepyKoala Studio`;
        } else {
          setError(res.message || 'Kebijakan privasi proyek ini belum dipublikasikan.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Gagal memuat dokumen privasi.');
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
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-mono text-sm">Memuat Kebijakan Privasi...</p>
        </div>
      </div>
    );
  }

  if (error || !privacyPolicy) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Kebijakan Privasi Belum Tersedia</h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {error || 'Dokumen privasi untuk proyek ini sedang dalam peninjauan internal atau belum dipublikasikan.'}
          </p>
          <div className="space-y-3">
            <Link
              to={`/projects/${slug}`}
              className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition text-sm"
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation & Header */}
        <div className="mb-8">
          <Link
            to={`/projects/${slug}`}
            className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-indigo-400 transition mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Detail {projectName}
          </Link>

          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-800">
                Google Play Compliance
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Kebijakan Privasi</h1>
            </div>
          </div>
          <p className="text-slate-400 text-base">
            Dokumen resmi pengelolaan dan perlindungan data pemain untuk game/aplikasi <span className="text-indigo-300 font-semibold">{projectName}</span>.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 border-t border-slate-800 pt-4">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Efektif: {privacyPolicy.effectiveDate || '2026-11-02'}
            </span>
            <span className="flex items-center">
              <Info className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Versi: {privacyPolicy.version || 1}.0
            </span>
            <span className="flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Kontak: {privacyPolicy.contactEmail}
            </span>
            <span className="inline-flex items-center text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
              <CheckCircle className="w-3 h-3 mr-1" />
              Terverifikasi & Aktif
            </span>
          </div>
        </div>

        {/* Summary Card */}
        {privacyPolicy.summary && (
          <div className="mb-8 p-5 bg-slate-800/60 rounded-2xl border border-slate-700/80 backdrop-blur-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-indigo-400" />
              Ringkasan Utama
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">{privacyPolicy.summary}</p>
          </div>
        )}

        {/* Data Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-3">Data yang Diproses</h3>
            {Array.isArray(privacyPolicy.dataCollected) && privacyPolicy.dataCollected.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-300">
                {privacyPolicy.dataCollected.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 mr-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Tidak ada data pribadi yang dikumpulkan.</p>
            )}
          </div>

          <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-3">Layanan Pihak Ketiga</h3>
            {Array.isArray(privacyPolicy.thirdPartyServices) && privacyPolicy.thirdPartyServices.length > 0 ? (
              <ul className="space-y-2 text-xs text-slate-300">
                {privacyPolicy.thirdPartyServices.map((service, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 mr-2 flex-shrink-0" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Tidak menggunakan SDK pelacakan pihak ketiga non-Google.</p>
            )}
          </div>
        </div>

        {/* Main Document Content */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 p-6 sm:p-8 backdrop-blur-sm prose prose-invert max-w-none mb-8">
          <div className="whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed text-slate-200">
            {privacyPolicy.content}
          </div>
        </div>

        {/* Footer info & Delete Account cross-link */}
        <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-white">Ingin Menghapus Akun atau Data Game?</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Pelajari panduan langkah demi langkah penghapusan data dan hak privasi Anda.
            </p>
          </div>
          <Link
            to={`/projects/${slug}/delete-account`}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition flex-shrink-0"
          >
            Halaman Hapus Akun &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};
export default PrivacyPolicyPage;
