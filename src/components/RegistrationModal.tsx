import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldAlert, Sparkles, Send, AlertCircle, Info } from 'lucide-react';
import type { Project, RegistrationFormValues } from '../types/project';
import { id } from '../locales/id';
import { registerTester, type RegistrationResponse } from '../services/registrationService';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [formData, setFormData] = useState<RegistrationFormValues>({
    testerName: '',
    testerEmail: '',
    honeypot: '',
  });

  const [errors, setErrors] = useState<{ testerName?: string; testerEmail?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<RegistrationResponse | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setFormData({ testerName: '', testerEmail: '', honeypot: '' });
      setErrors({});
      setServerError(null);
      setIsSubmitted(false);
      setIsSubmitting(false);
      setSubmissionResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { testerName?: string; testerEmail?: string } = {};

    if (!formData.testerName.trim()) {
      newErrors.testerName = id.errors.requiredField;
    }

    if (!formData.testerEmail.trim()) {
      newErrors.testerEmail = id.errors.requiredField;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.testerEmail.trim())) {
        newErrors.testerEmail = id.errors.invalidEmail;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Perlindungan honeypot sisi klien
    if (formData.honeypot && formData.honeypot.trim().length > 0) {
      setIsSubmitted(true);
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const result = await registerTester({
        testerName: formData.testerName,
        testerEmail: formData.testerEmail,
        projectId: project.id,
        projectName: project.name,
        appVersion: project.version,
        honeypot: formData.honeypot,
      });

      if (result.success) {
        setSubmissionResult(result);
        setIsSubmitted(true);
      } else {
        setServerError(result.message || 'Gagal memproses pendaftaran. Silakan coba kembali.');
      }
    } catch {
      setServerError('Terjadi kendala jaringan saat menghubungi server pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDuplicate = submissionResult?.isDuplicate ?? false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-stone-750 bg-[#0e1017] p-6 sm:p-8 shadow-2xl text-[#E7E5E4]">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-lg text-[#A8A29E] hover:text-[#FAFAF9] hover:bg-stone-850 transition-colors focus:outline-hidden focus:ring-2 focus:ring-stone-400"
          aria-label="Tutup jendela pendaftaran"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-cyan-950/50 border border-cyan-800/60 text-cyan-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                  {project.name}
                </span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/70 text-[11px] font-semibold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Pendaftaran Terbuka Tanpa Batas Kuota</span>
              </div>
            </div>

            <h2 id="modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAF9] mb-2">
              {id.registrationModal.title}
            </h2>
            <p className="text-sm text-[#A8A29E] mb-6 leading-relaxed">
              {id.registrationModal.subtitle} Seluruh pendaftar dengan akun Google Play yang valid akan diikutsertakan dalam Closed Testing.
            </p>

            {/* Error Banner jika request gagal */}
            {serverError && (
              <div className="mb-4 rounded-xl border border-rose-800/60 bg-rose-950/40 p-3.5 flex items-start gap-2.5 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-rose-300">Pemberitahuan Sistem</div>
                  <div className="leading-relaxed">{serverError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Honeypot field */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="hp_field">Website Confirm</label>
                <input
                  id="hp_field"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                />
              </div>

              {/* Tester Name */}
              <div>
                <label htmlFor="testerName" className="block text-xs font-medium text-[#E7E5E4] mb-1.5">
                  {id.registrationModal.nameLabel} <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="testerName"
                  type="text"
                  value={formData.testerName}
                  onChange={(e) => {
                    setFormData({ ...formData, testerName: e.target.value });
                    if (errors.testerName) setErrors({ ...errors, testerName: undefined });
                    if (serverError) setServerError(null);
                  }}
                  placeholder={id.registrationModal.namePlaceholder}
                  className={`w-full rounded-xl bg-stone-900 border px-3.5 py-2.5 text-sm text-[#FAFAF9] placeholder-[#78716C] transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500 ${
                    errors.testerName ? 'border-rose-500/80' : 'border-stone-800 focus:border-stone-600'
                  }`}
                  required
                />
                {errors.testerName && (
                  <p className="mt-1 text-xs text-rose-400">{errors.testerName}</p>
                )}
              </div>

              {/* Tester Email */}
              <div>
                <label htmlFor="testerEmail" className="block text-xs font-medium text-[#E7E5E4] mb-1.5">
                  {id.registrationModal.emailLabel} <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="testerEmail"
                  type="email"
                  value={formData.testerEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, testerEmail: e.target.value });
                    if (errors.testerEmail) setErrors({ ...errors, testerEmail: undefined });
                    if (serverError) setServerError(null);
                  }}
                  placeholder={id.registrationModal.emailPlaceholder}
                  className={`w-full rounded-xl bg-stone-900 border px-3.5 py-2.5 text-sm text-[#FAFAF9] placeholder-[#78716C] transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500 ${
                    errors.testerEmail ? 'border-rose-500/80' : 'border-stone-800 focus:border-stone-600'
                  }`}
                  required
                />
                {errors.testerEmail && (
                  <p className="mt-1 text-xs text-rose-400">{errors.testerEmail}</p>
                )}
                <p className="mt-1.5 text-[11px] text-[#78716C]">
                  Gunakan email aktif akun Google Play Anda untuk otorisasi instalasi resmi.
                </p>
              </div>

              {/* Requirement reminder */}
              <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/30 p-3 flex gap-2.5 items-start text-xs text-[#E7E5E4] leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
                <span>
                  Sesuai kebijakan Google Play, penguji wajib memasang dan mempertahankan aplikasi selama minimal 14 hari berturut-turut.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-800 text-sm font-medium text-[#A8A29E] hover:bg-stone-850 hover:text-[#FAFAF9] transition-colors"
                >
                  {id.registrationModal.cancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-stone-950 text-sm font-bold shadow-xs transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Mengirim Data...' : id.registrationModal.submitBtn}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="py-4">
            {isDuplicate ? (
              <div className="w-12 h-12 rounded-full bg-cyan-950/70 border border-cyan-700/60 text-cyan-400 flex items-center justify-center mb-4">
                <Info className="w-6 h-6 text-cyan-400" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            )}

            <h2 className="text-xl font-bold text-[#FAFAF9] mb-2">
              {isDuplicate ? 'Email Sudah Terdaftar' : id.registrationModal.successTitle}
            </h2>
            <p className="text-sm text-[#E7E5E4] mb-6 leading-relaxed">
              {submissionResult?.message ||
                'Data pendaftaran Anda telah berhasil dicatat ke antrean closed testing studio.'}
            </p>

            <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-4 mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E7E5E4] mb-3">
                {id.registrationModal.nextStepsTitle}
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-[#A8A29E] leading-relaxed">
                {id.registrationModal.nextSteps.map((step, idx) => (
                  <li key={idx} className="pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 text-sm font-semibold transition-colors"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
