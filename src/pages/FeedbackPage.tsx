import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Bug,
  Lightbulb,
  MessageSquare,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { getProjectBySlug } from '../services/projectService';
import { id } from '../locales/id';
import type { ReportType, FeedbackFormValues } from '../types/project';

export const FeedbackPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const project = getProjectBySlug(slug || '');

  const [formData, setFormData] = useState<FeedbackFormValues>({
    testerName: '',
    testerEmail: '',
    reportType: 'BUG_REPORT',
    appVersion: project ? project.version : '',
    deviceModel: '',
    androidVersion: '',
    description: '',
    honeypot: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FeedbackFormValues, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-900 border border-stone-800 text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#FAFAF9] mb-2">{id.errors.projectNotFound}</h1>
        <p className="text-sm text-[#A8A29E] mb-8 max-w-md mx-auto">
          {id.errors.projectNotFoundDesc}
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{id.projectDetail.backToProjects}</span>
        </Link>
      </div>
    );
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FeedbackFormValues, string>> = {};

    if (!formData.testerName.trim()) {
      errs.testerName = id.errors.requiredField;
    }

    if (!formData.testerEmail.trim()) {
      errs.testerEmail = id.errors.requiredField;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.testerEmail.trim())) {
        errs.testerEmail = id.errors.invalidEmail;
      }
    }

    if (!formData.deviceModel.trim()) {
      errs.deviceModel = id.errors.requiredField;
    }

    if (!formData.androidVersion.trim()) {
      errs.androidVersion = id.errors.requiredField;
    }

    if (!formData.description.trim()) {
      errs.description = id.errors.requiredField;
    } else if (formData.description.trim().length < 15) {
      errs.description = id.errors.minCharDesc;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.honeypot && formData.honeypot.trim().length > 0) {
      setIsSubmitted(true);
      return;
    }

    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 700);
  };

  const reportTypes: { type: ReportType; label: string; icon: React.ReactNode }[] = [
    {
      type: 'BUG_REPORT',
      label: id.feedback.types.BUG_REPORT,
      icon: <Bug className="w-4 h-4 text-rose-400" />,
    },
    {
      type: 'FEEDBACK',
      label: id.feedback.types.FEEDBACK,
      icon: <MessageSquare className="w-4 h-4 text-cyan-400" />,
    },
    {
      type: 'FEATURE_SUGGESTION',
      label: id.feedback.types.FEATURE_SUGGESTION,
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Back Link */}
      <div>
        <Link
          to={`/projects/${project.slug}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A8A29E] hover:text-[#67E8F9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Detail {project.name}</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#FAFAF9] tracking-tight">
          {id.feedback.title}
        </h1>
        <p className="mt-2 text-sm text-[#A8A29E]">
          {id.feedback.subtitle} Laporan ini ditujukan langsung untuk proyek{' '}
          <strong className="text-[#FAFAF9]">{project.name}</strong>.
        </p>
      </div>

      {!isSubmitted ? (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border border-stone-800 bg-[#0f121d] p-6 sm:p-10 shadow-xl space-y-6"
        >
          {/* Honeypot field (hidden) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="hp_feedback">Honeypot</label>
            <input
              id="hp_feedback"
              type="text"
              tabIndex={-1}
              value={formData.honeypot}
              onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
            />
          </div>

          {/* Project Info Banner (Read-only automatically derived) */}
          <div className="rounded-2xl border border-stone-800 bg-[#141826] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[#A8A29E]">{id.feedback.projectLabel}:</span>{' '}
              <strong className="text-[#FAFAF9] text-sm font-bold ml-1">{project.name}</strong>
              <span className="ml-2 font-mono text-[#78716C]">(ID: {project.id})</span>
            </div>
            <div className="flex items-center gap-2 text-[#A8A29E]">
              <span>Status:</span>
              <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-[#E7E5E4] font-mono">
                {id.statusLabels[project.status]}
              </span>
            </div>
          </div>

          {/* Report Type Selector */}
          <div>
            <label className="block text-xs font-medium text-[#E7E5E4] mb-2">
              {id.feedback.reportTypeLabel} <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {reportTypes.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setFormData({ ...formData, reportType: item.type })}
                  className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    formData.reportType === item.type
                      ? 'bg-stone-800 border-cyan-500/80 text-[#FAFAF9] shadow-xs'
                      : 'bg-stone-900 border-stone-800 text-[#A8A29E] hover:text-[#FAFAF9] hover:bg-stone-850'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tester Identity Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="testerName" className="block text-xs font-medium text-[#E7E5E4] mb-1.5">
                {id.feedback.testerNameLabel} <span className="text-rose-400">*</span>
              </label>
              <input
                id="testerName"
                type="text"
                value={formData.testerName}
                onChange={(e) => {
                  setFormData({ ...formData, testerName: e.target.value });
                  if (errors.testerName) setErrors({ ...errors, testerName: undefined });
                }}
                placeholder={id.feedback.testerNamePlaceholder}
                className={`w-full rounded-xl bg-stone-900 border px-3.5 py-2.5 text-sm text-[#FAFAF9] placeholder-[#78716C] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  errors.testerName ? 'border-rose-500' : 'border-stone-800'
                }`}
                required
              />
              {errors.testerName && (
                <p className="mt-1 text-xs text-rose-400">{errors.testerName}</p>
              )}
            </div>

            <div>
              <label htmlFor="testerEmail" className="block text-xs font-medium text-[#E7E5E4] mb-1.5">
                {id.feedback.testerEmailLabel} <span className="text-rose-400">*</span>
              </label>
              <input
                id="testerEmail"
                type="email"
                value={formData.testerEmail}
                onChange={(e) => {
                  setFormData({ ...formData, testerEmail: e.target.value });
                  if (errors.testerEmail) setErrors({ ...errors, testerEmail: undefined });
                }}
                placeholder={id.feedback.testerEmailPlaceholder}
                className={`w-full rounded-xl bg-stone-900 border px-3.5 py-2.5 text-sm text-[#FAFAF9] placeholder-[#78716C] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  errors.testerEmail ? 'border-rose-500' : 'border-stone-800'
                }`}
                required
              />
              {errors.testerEmail && (
                <p className="mt-1 text-xs text-rose-400">{errors.testerEmail}</p>
              )}
            </div>
          </div>

          {/* Technical Diagnostics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="appVersion" className="block text-xs font-medium text-[#E7E5E4] mb-1.5">
                {id.feedback.appVersionLabel}
              </label>
              <input
                id="appVersion"
                type="text"
                value={formData.appVersion}
                onChange={(e) => setFormData({ ...formData, appVersion: e.target.value })}
                placeholder="mis: 1.0.0"
                className="w-full rounded-xl bg-stone-900 border border-stone-800 px-3.5 py-2.5 text-sm text-[#FAFAF9] font-mono placeholder-[#78716C] focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label htmlFor="deviceModel" className="block text-xs font-medium text-[#E7E5E4] mb-1.5">
                {id.feedback.deviceModelLabel} <span className="text-rose-400">*</span>
              </label>
              <input
                id="deviceModel"
                type="text"
                value={formData.deviceModel}
                onChange={(e) => {
                  setFormData({ ...formData, deviceModel: e.target.value });
                  if (errors.deviceModel) setErrors({ ...errors, deviceModel: undefined });
                }}
                placeholder={id.feedback.deviceModelPlaceholder}
                className={`w-full rounded-xl bg-stone-900 border px-3.5 py-2.5 text-sm text-[#FAFAF9] placeholder-[#78716C] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  errors.deviceModel ? 'border-rose-500' : 'border-stone-800'
                }`}
                required
              />
              {errors.deviceModel && (
                <p className="mt-1 text-xs text-rose-400">{errors.deviceModel}</p>
              )}
            </div>

            <div>
              <label htmlFor="androidVersion" className="block text-xs font-medium text-[#E7E5E4] mb-1.5">
                {id.feedback.androidVersionLabel} <span className="text-rose-400">*</span>
              </label>
              <input
                id="androidVersion"
                type="text"
                value={formData.androidVersion}
                onChange={(e) => {
                  setFormData({ ...formData, androidVersion: e.target.value });
                  if (errors.androidVersion) setErrors({ ...errors, androidVersion: undefined });
                }}
                placeholder={id.feedback.androidVersionPlaceholder}
                className={`w-full rounded-xl bg-stone-900 border px-3.5 py-2.5 text-sm text-[#FAFAF9] placeholder-[#78716C] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-colors ${
                  errors.androidVersion ? 'border-rose-500' : 'border-stone-800'
                }`}
                required
              />
              {errors.androidVersion && (
                <p className="mt-1 text-xs text-rose-400">{errors.androidVersion}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-xs font-medium text-[#E7E5E4] mb-1.5">
              {id.feedback.descriptionLabel} <span className="text-rose-400">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              placeholder={id.feedback.descriptionPlaceholder}
              className={`w-full rounded-xl bg-stone-900 border px-3.5 py-2.5 text-sm text-[#FAFAF9] placeholder-[#78716C] focus:outline-hidden focus:ring-2 focus:ring-cyan-500 transition-colors ${
                errors.description ? 'border-rose-500' : 'border-stone-800'
              }`}
              required
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-400">{errors.description}</p>
            )}
          </div>

          {/* Info notice */}
          <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-3 flex gap-2.5 items-center text-xs text-[#A8A29E]">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Pada Milestone 1, formulir ini menjalankan validasi UI komprehensif. Pada Milestone 3, data akan diteruskan ke Google Sheets & Gmail developer.
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-100 hover:bg-white text-stone-950 text-sm font-semibold shadow-xs transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? id.feedback.submitting : id.feedback.submitBtn}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl border border-stone-800 bg-[#0f121d] p-8 sm:p-12 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#FAFAF9] tracking-tight">
            {id.feedback.successTitle}
          </h2>
          <p className="text-sm text-[#E7E5E4] max-w-lg mx-auto leading-relaxed">
            {id.feedback.successDesc}
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  ...formData,
                  description: '',
                });
              }}
              className="px-5 py-2.5 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-850 text-[#E7E5E4] text-xs font-semibold transition-colors"
            >
              Tulis Laporan Lain
            </button>
            <Link
              to={`/projects/${project.slug}`}
              className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold transition-colors"
            >
              Kembali ke Proyek
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
