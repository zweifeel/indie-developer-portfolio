import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Workflow,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  Shield,
  Image as ImageIcon,
  FileText,
  Layers,
  X,
  Sparkles,
  GitBranch,
  ShieldAlert,
} from 'lucide-react';

import {
  CANONICAL_PROJECT_SLUGS,
  CanonicalProjectSlug,
  fetchAdminProjectProgress,
  saveAdminProjectProgress,
  transitionItemPublicationStatus,
  fetchAdminProgressPreview,
  getProjectSyncInfo,
  getProgressAuditLogs,
  ProgressItemType,
  ProgressAuditEntry,
  ProjectSyncInfo,
} from '../../services/cmsProgressService';

import {
  ProjectProgressDocument,
  RoadmapMilestone,
  FeatureItem,
  ProgressScreenshot,
  ProgressEvent,
  ImplementationStatus,
  PublicationStatus,
  ItemPriority,
  ProgressEventType,
  VALID_IMPLEMENTATION_STATUSES,
  VALID_ITEM_PRIORITIES,
  VALID_EVENT_TYPES,
  PublicProjectProgress,
} from '../../types/portfolioProgress';

import { validateProgressMetadata } from '../../services/portfolioMetadataValidator';

interface AdminProgressManagerProps {
  adminEmail: string;
}

export const AdminProgressManager: React.FC<AdminProgressManagerProps> = ({ adminEmail }) => {
  // Selected project state
  const [selectedSlug, setSelectedSlug] = useState<CanonicalProjectSlug>('dompetnalar');
  const [doc, setDoc] = useState<ProjectProgressDocument | null>(null);
  const [syncInfo, setSyncInfo] = useState<ProjectSyncInfo>(() => getProjectSyncInfo('dompetnalar'));
  const [auditLogs, setAuditLogs] = useState<readonly ProgressAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active sub-section
  const [subSection, setSubSection] = useState<'ROADMAP' | 'FEATURES' | 'SCREENSHOTS' | 'EVENTS' | 'AUDIT'>('ROADMAP');

  // Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<(PublicProjectProgress & { isPreview: true }) | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Edit / Add Modal states
  const [editingMilestone, setEditingMilestone] = useState<RoadmapMilestone | null>(null);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);

  const [editingFeature, setEditingFeature] = useState<FeatureItem | null>(null);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);

  const [editingScreenshot, setEditingScreenshot] = useState<ProgressScreenshot | null>(null);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);

  const [editingEvent, setEditingEvent] = useState<ProgressEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Confirmation Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    actionType: 'danger' | 'primary';
    onConfirm: () => void;
  } | null>(null);

  // Load project progress data
  const loadProjectData = useCallback(async (slug: CanonicalProjectSlug) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetchAdminProjectProgress(slug);
      if (res.success && res.data) {
        setDoc(res.data);
      } else {
        setErrorMessage(res.message || 'Gagal memuat dokumen progress.');
      }
      setSyncInfo(getProjectSyncInfo(slug));
      setAuditLogs(getProgressAuditLogs(slug));
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      try {
        const res = await fetchAdminProjectProgress(selectedSlug);
        if (isMounted && res.success && res.data) {
          setDoc(res.data);
        } else if (isMounted) {
          setErrorMessage(res.message || 'Gagal memuat dokumen progress.');
        }
        if (isMounted) {
          setSyncInfo(getProjectSyncInfo(selectedSlug));
          setAuditLogs(getProgressAuditLogs(selectedSlug));
        }
      } catch (err: any) {
        if (isMounted) setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => {
      isMounted = false;
    };
  }, [selectedSlug]);

  // Validation diagnostics
  const validationResult = useMemo(() => {
    if (!doc) return null;
    return validateProgressMetadata(doc);
  }, [doc]);

  // Handle Editorial Status Transition
  const handleTransitionStatus = async (
    itemType: ProgressItemType,
    itemId: string,
    targetStatus: PublicationStatus
  ) => {
    if (!doc) return;

    setConfirmDialog({
      isOpen: true,
      title: `Konfirmasi Perubahan Status Publikasi (${targetStatus.toUpperCase()})`,
      description: `Apakah Anda yakin ingin mengubah status publikasi item ini menjadi "${targetStatus.toUpperCase()}"? Tindakan ini akan dicatat ke dalam audit log dan memengaruhi ketersediaan item pada API publik.`,
      actionLabel: `Ubah ke ${targetStatus.toUpperCase()}`,
      actionType: targetStatus === 'public' ? 'primary' : 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        setSaving(true);
        try {
          const res = await transitionItemPublicationStatus({
            projectSlug: selectedSlug,
            itemType,
            itemId,
            targetStatus,
            adminEmail,
          });

          if (res.success) {
            setSuccessMessage(res.message || 'Status publikasi berhasil diperbarui.');
            await loadProjectData(selectedSlug);
          } else {
            setErrorMessage(res.message || 'Gagal mengubah status publikasi.');
          }
        } catch (err: any) {
          setErrorMessage(err.message || 'Gagal mengubah status.');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  // Milestone Save
  const handleSaveMilestone = async (m: RoadmapMilestone) => {
    if (!doc) return;
    setSaving(true);
    const existingIndex = doc.roadmap.findIndex((item) => item.id === m.id);
    const newRoadmap = [...doc.roadmap];
    if (existingIndex >= 0) {
      newRoadmap[existingIndex] = m;
    } else {
      newRoadmap.push(m);
    }

    const res = await saveAdminProjectProgress(selectedSlug, { roadmap: newRoadmap }, adminEmail);
    if (res.success && res.data) {
      setDoc(res.data);
      setSuccessMessage('Milestone berhasil disimpan.');
      setIsMilestoneModalOpen(false);
      setEditingMilestone(null);
      setAuditLogs(getProgressAuditLogs(selectedSlug));
    } else {
      setErrorMessage(res.message || 'Gagal menyimpan milestone.');
    }
    setSaving(false);
  };

  // Milestone Delete
  const handleDeleteMilestone = (milestoneId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Milestone Roadmap',
      description: 'Milestone akan dihapus dari roadmap internal dan tidak lagi dapat dilihat pada draft maupun publik. Fitur yang tertaut akan kehilangan referensi milestone.',
      actionLabel: 'Hapus Milestone',
      actionType: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        if (!doc) return;
        setSaving(true);
        const newRoadmap = doc.roadmap.filter((m) => m.id !== milestoneId);
        const res = await saveAdminProjectProgress(selectedSlug, { roadmap: newRoadmap }, adminEmail);
        if (res.success && res.data) {
          setDoc(res.data);
          setSuccessMessage('Milestone berhasil dihapus.');
          setAuditLogs(getProgressAuditLogs(selectedSlug));
        } else {
          setErrorMessage(res.message || 'Gagal menghapus milestone.');
        }
        setSaving(false);
      },
    });
  };

  // Feature Save
  const handleSaveFeature = async (f: FeatureItem) => {
    if (!doc) return;
    setSaving(true);
    const existingIndex = doc.features.findIndex((item) => item.id === f.id);
    const newFeatures = [...doc.features];
    if (existingIndex >= 0) {
      newFeatures[existingIndex] = f;
    } else {
      newFeatures.push(f);
    }

    const res = await saveAdminProjectProgress(selectedSlug, { features: newFeatures }, adminEmail);
    if (res.success && res.data) {
      setDoc(res.data);
      setSuccessMessage('Fitur berhasil disimpan.');
      setIsFeatureModalOpen(false);
      setEditingFeature(null);
      setAuditLogs(getProgressAuditLogs(selectedSlug));
    } else {
      setErrorMessage(res.message || 'Gagal menyimpan fitur.');
    }
    setSaving(false);
  };

  // Feature Delete
  const handleDeleteFeature = (featureId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Fitur Proyek',
      description: 'Fitur akan dihapus dari daftar spesifikasi proyek dan dicabut dari proyeksi publik.',
      actionLabel: 'Hapus Fitur',
      actionType: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        if (!doc) return;
        setSaving(true);
        const newFeatures = doc.features.filter((f) => f.id !== featureId);
        const res = await saveAdminProjectProgress(selectedSlug, { features: newFeatures }, adminEmail);
        if (res.success && res.data) {
          setDoc(res.data);
          setSuccessMessage('Fitur berhasil dihapus.');
          setAuditLogs(getProgressAuditLogs(selectedSlug));
        } else {
          setErrorMessage(res.message || 'Gagal menghapus fitur.');
        }
        setSaving(false);
      },
    });
  };

  // Screenshot Save
  const handleSaveScreenshot = async (s: ProgressScreenshot) => {
    if (!doc) return;
    setSaving(true);
    const existingIndex = doc.screenshots.findIndex((item) => item.id === s.id);
    const newScreenshots = [...doc.screenshots];
    if (existingIndex >= 0) {
      newScreenshots[existingIndex] = s;
    } else {
      newScreenshots.push(s);
    }

    const res = await saveAdminProjectProgress(selectedSlug, { screenshots: newScreenshots }, adminEmail);
    if (res.success && res.data) {
      setDoc(res.data);
      setSuccessMessage('Screenshot berhasil disimpan.');
      setIsScreenshotModalOpen(false);
      setEditingScreenshot(null);
      setAuditLogs(getProgressAuditLogs(selectedSlug));
    } else {
      setErrorMessage(res.message || 'Gagal menyimpan screenshot.');
    }
    setSaving(false);
  };

  // Screenshot Delete
  const handleDeleteScreenshot = (screenshotId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Screenshot Progres',
      description: 'Screenshot akan dihapus dari metadata proyek dan tidak akan ditampilkan pada galeri publik.',
      actionLabel: 'Hapus Screenshot',
      actionType: 'danger',
      onConfirm: async () => {
        setConfirmDialog(null);
        if (!doc) return;
        setSaving(true);
        const newScreenshots = doc.screenshots.filter((s) => s.id !== screenshotId);
        const res = await saveAdminProjectProgress(selectedSlug, { screenshots: newScreenshots }, adminEmail);
        if (res.success && res.data) {
          setDoc(res.data);
          setSuccessMessage('Screenshot berhasil dihapus.');
          setAuditLogs(getProgressAuditLogs(selectedSlug));
        } else {
          setErrorMessage(res.message || 'Gagal menghapus screenshot.');
        }
        setSaving(false);
      },
    });
  };

  // Event Save
  const handleSaveEvent = async (e: ProgressEvent) => {
    if (!doc) return;
    setSaving(true);
    const existingEvents = doc.events ? [...doc.events] : [];
    const existingIndex = existingEvents.findIndex((item) => item.id === e.id);
    const newEvents = [...existingEvents];
    if (existingIndex >= 0) {
      newEvents[existingIndex] = e;
    } else {
      newEvents.push(e);
    }

    const res = await saveAdminProjectProgress(selectedSlug, { events: newEvents }, adminEmail);
    if (res.success && res.data) {
      setDoc(res.data);
      setSuccessMessage('Aktivitas linimasa berhasil disimpan.');
      setIsEventModalOpen(false);
      setEditingEvent(null);
      setAuditLogs(getProgressAuditLogs(selectedSlug));
    } else {
      setErrorMessage(res.message || 'Gagal menyimpan aktivitas.');
    }
    setSaving(false);
  };

  // Open Protected Preview
  const handleOpenPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetchAdminProgressPreview(selectedSlug);
      if (res.success && res.data) {
        setPreviewData(res.data);
        setIsPreviewOpen(true);
      } else {
        setErrorMessage(res.message || 'Gagal memuat pratinjau.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Project Selector */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-cyan-400">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                Progress & Roadmap Management (Stage 5)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
                  Schema v2
                </span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Pusat kurasi editorial milestone, spesifikasi fitur, screenshot build asli, dan integrasi progres GitHub.
              </p>
            </div>
          </div>
        </div>

        {/* Project Dropdown & Preview Button */}
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="project-select" className="sr-only">Pilih Proyek</label>
          <select
            id="project-select"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value as CanonicalProjectSlug)}
            className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs font-semibold text-stone-200 focus:outline-none focus:border-cyan-500"
          >
            {CANONICAL_PROJECT_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {slug === 'dompetnalar'
                  ? 'DompetNalar (Application)'
                  : slug === 'idle-master'
                  ? 'IDLE MASTER (Game)'
                  : slug === 'mobile-kasir'
                  ? 'Mobile Kasir (Application)'
                  : slug === 'idle-mining'
                  ? 'Idle Mining (Game)'
                  : slug === 'the-broken-origin'
                  ? 'The Broken Origin (STRICT FREEZE)'
                  : 'Worklume (Tool)'}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleOpenPreview}
            disabled={previewLoading || !doc}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewLoading ? 'Memuat Preview...' : 'Preview Public View'}</span>
          </button>

          <button
            type="button"
            onClick={() => loadProjectData(selectedSlug)}
            disabled={loading}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Project Status Cards & GitHub Sync Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Project Metadata & Validation */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-stone-400 uppercase">Proyek & Schema</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                validationResult?.valid
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                  : 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
              }`}
            >
              {validationResult?.valid ? 'VALID CANONICAL' : 'VALIDATION ISSUES'}
            </span>
          </div>
          <p className="text-sm font-bold text-stone-100">{doc?.projectName || selectedSlug}</p>
          <div className="text-xs text-stone-400 space-y-1">
            <p>Slug: <code className="text-cyan-400">{selectedSlug}</code></p>
            <p>Tipe: <span className="font-semibold text-stone-300">{doc?.projectType || 'APPLICATION'}</span></p>
            <p>Diperbarui: <span className="text-stone-300">{doc?.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('id-ID') : '-'}</span></p>
          </div>
        </div>

        {/* Card 2: GitHub Sync Status (Stage 4 Integration) */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-stone-400 uppercase">GitHub Sync Status</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                syncInfo.isFrozen
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : syncInfo.syncStatus === 'READY' || syncInfo.syncStatus === 'SYNCED'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {syncInfo.syncStatus}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-400 shrink-0" />
            <p className="text-xs font-semibold text-stone-200">{syncInfo.stage3Condition}</p>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            {syncInfo.limitationsNotice || 'Status sinkronisasi normal.'}
          </p>
        </div>

        {/* Card 3: Metrics & Public Distribution */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-mono text-stone-400 uppercase">Distribusi Item Metadata</span>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="bg-stone-950 p-2 rounded-xl border border-stone-850">
              <span className="text-[10px] text-stone-500 block">Milestones</span>
              <span className="text-sm font-bold text-stone-200">
                {doc?.roadmap.filter((m) => m.publicationStatus === 'public').length || 0}
                <span className="text-[10px] text-stone-500 font-normal"> / {doc?.roadmap.length || 0}</span>
              </span>
            </div>
            <div className="bg-stone-950 p-2 rounded-xl border border-stone-850">
              <span className="text-[10px] text-stone-500 block">Fitur Public</span>
              <span className="text-sm font-bold text-stone-200">
                {doc?.features.filter((f) => f.publicationStatus === 'public').length || 0}
                <span className="text-[10px] text-stone-500 font-normal"> / {doc?.features.length || 0}</span>
              </span>
            </div>
            <div className="bg-stone-950 p-2 rounded-xl border border-stone-850">
              <span className="text-[10px] text-stone-500 block">Screenshots</span>
              <span className="text-sm font-bold text-stone-200">
                {doc?.screenshots.filter((s) => s.publicationStatus === 'public').length || 0}
                <span className="text-[10px] text-stone-500 font-normal"> / {doc?.screenshots.length || 0}</span>
              </span>
            </div>
            <div className="bg-stone-950 p-2 rounded-xl border border-stone-850">
              <span className="text-[10px] text-stone-500 block">Events Publik</span>
              <span className="text-sm font-bold text-stone-200">
                {(doc?.events || []).filter((e) => e.publicationStatus === 'public').length}
                <span className="text-[10px] text-stone-500 font-normal"> / {(doc?.events || []).length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Editorial Gate Status */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-2">
          <span className="text-[11px] font-mono text-stone-400 uppercase">Editorial Gate</span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-stone-300">
              <span>Item Draft:</span>
              <span className="font-bold text-amber-400">
                {(doc?.roadmap.filter((m) => m.publicationStatus === 'draft').length || 0) +
                  (doc?.features.filter((f) => f.publicationStatus === 'draft').length || 0) +
                  (doc?.screenshots.filter((s) => s.publicationStatus === 'draft').length || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-300">
              <span>Item Menunggu Review:</span>
              <span className="font-bold text-cyan-400">
                {(doc?.roadmap.filter((m) => m.publicationStatus === 'review').length || 0) +
                  (doc?.features.filter((f) => f.publicationStatus === 'review').length || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-300">
              <span>Item Hidden / Ditarik:</span>
              <span className="font-bold text-stone-500">
                {(doc?.roadmap.filter((m) => m.publicationStatus === 'hidden').length || 0) +
                  (doc?.features.filter((f) => f.publicationStatus === 'hidden').length || 0)}
              </span>
            </div>
          </div>
          {syncInfo.requiresEditorialReview && (
            <div className="p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[10px] text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Event GitHub memerlukan review sebelum terbit!</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-stone-800 space-x-2 sm:space-x-4 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSubSection('ROADMAP')}
          className={`pb-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            subSection === 'ROADMAP'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>Roadmap Milestones ({doc?.roadmap.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('FEATURES')}
          className={`pb-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            subSection === 'FEATURES'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Spesifikasi Fitur ({doc?.features.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('SCREENSHOTS')}
          className={`pb-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            subSection === 'SCREENSHOTS'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Screenshot Gallery ({doc?.screenshots.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('EVENTS')}
          className={`pb-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            subSection === 'EVENTS'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Linimasa Aktivitas ({(doc?.events || []).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubSection('AUDIT')}
          className={`pb-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            subSection === 'AUDIT'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Jejak Audit ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-SECTION: ROADMAP MILESTONES */}
      {/* ========================================================================= */}
      {subSection === 'ROADMAP' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">
              Daftar tahapan roadmap strategis proyek. Item baru default berstatus <code className="text-amber-400">draft</code>.
            </p>
            <button
              type="button"
              disabled={syncInfo.isFrozen}
              onClick={() => {
                setEditingMilestone({
                  id: `ms_${selectedSlug}_${Date.now().toString(36)}`,
                  title: '',
                  description: '',
                  priority: 'medium',
                  implementationStatus: 'planned',
                  publicationStatus: 'draft',
                  targetQuarter: 'Q1 2026',
                  order: (doc?.roadmap.length || 0) + 1,
                  updatedAt: new Date().toISOString(),
                });
                setIsMilestoneModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-stone-950 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Milestone</span>
            </button>
          </div>

          <div className="space-y-3">
            {doc?.roadmap && doc.roadmap.length > 0 ? (
              doc.roadmap
                .slice()
                .sort((a: RoadmapMilestone, b: RoadmapMilestone) => a.order - b.order)
                .map((m: RoadmapMilestone) => (
                  <div
                    key={m.id}
                    className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                          #{m.order}
                        </span>
                        <h4 className="text-sm font-bold text-stone-100">{m.title}</h4>
                        {/* Implementation Status Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            m.implementationStatus === 'completed'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                              : m.implementationStatus === 'in_progress'
                              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50'
                              : 'bg-stone-950 text-stone-400 border border-stone-800'
                          }`}
                        >
                          Dev: {m.implementationStatus}
                        </span>

                        {/* Publication Status Badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            m.publicationStatus === 'public'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : m.publicationStatus === 'review'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                              : m.publicationStatus === 'hidden'
                              ? 'bg-stone-950 text-stone-500 border border-stone-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          Publikasi: {m.publicationStatus.toUpperCase()}
                        </span>

                        {m.targetQuarter && (
                          <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
                            {m.targetQuarter}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">{m.description}</p>
                    </div>

                    {/* Action Buttons & Editorial Workflow Transition */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Transition Buttons */}
                      {m.publicationStatus === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionStatus('milestone', m.id, 'review')}
                          className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-medium transition-colors"
                        >
                          Ajukan Review
                        </button>
                      )}

                      {m.publicationStatus === 'review' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleTransitionStatus('milestone', m.id, 'public')}
                            className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700/70 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Setujui & Publikasikan
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransitionStatus('milestone', m.id, 'draft')}
                            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition-colors"
                          >
                            Kembalikan ke Draft
                          </button>
                        </>
                      )}

                      {m.publicationStatus === 'public' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionStatus('milestone', m.id, 'hidden')}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition-colors"
                        >
                          Tarik / Sembunyikan
                        </button>
                      )}

                      {m.publicationStatus === 'hidden' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionStatus('milestone', m.id, 'draft')}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition-colors"
                        >
                          Jadikan Draft Kembali
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMilestone(m);
                          setIsMilestoneModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                        title="Edit Milestone"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300 transition-colors"
                        title="Hapus Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-8 text-center bg-stone-900 border border-dashed border-stone-800 rounded-2xl text-xs text-stone-500">
                Belum ada milestone pada roadmap proyek ini. Klik tombol "Tambah Milestone" di atas untuk menambahkan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-SECTION: FEATURES */}
      {/* ========================================================================= */}
      {subSection === 'FEATURES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">
              Daftar spesifikasi fitur teknis yang dikurasi secara editorial.
            </p>
            <button
              type="button"
              disabled={syncInfo.isFrozen}
              onClick={() => {
                setEditingFeature({
                  id: `feat_${selectedSlug}_${Date.now().toString(36)}`,
                  title: '',
                  description: '',
                  category: 'Core Feature',
                  priority: 'medium',
                  implementationStatus: 'planned',
                  publicationStatus: 'draft',
                  order: (doc?.features.length || 0) + 1,
                  updatedAt: new Date().toISOString(),
                });
                setIsFeatureModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-stone-950 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Fitur</span>
            </button>
          </div>

          <div className="space-y-3">
            {doc?.features && doc.features.length > 0 ? (
              doc.features
                .slice()
                .sort((a: FeatureItem, b: FeatureItem) => a.order - b.order)
                .map((f: FeatureItem) => (
                  <div
                    key={f.id}
                    className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800">
                          #{f.order}
                        </span>
                        <h4 className="text-sm font-bold text-stone-100">{f.title}</h4>
                        {f.category && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-cyan-400 border border-stone-800">
                            {f.category}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            f.publicationStatus === 'public'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : f.publicationStatus === 'review'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          Publikasi: {f.publicationStatus.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">{f.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {f.publicationStatus === 'draft' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionStatus('feature', f.id, 'review')}
                          className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-medium transition-colors"
                        >
                          Ajukan Review
                        </button>
                      )}

                      {f.publicationStatus === 'review' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionStatus('feature', f.id, 'public')}
                          className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-700/70 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Publikasikan
                        </button>
                      )}

                      {f.publicationStatus === 'public' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionStatus('feature', f.id, 'hidden')}
                          className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition-colors"
                        >
                          Sembunyikan
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditingFeature(f);
                          setIsFeatureModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                        title="Edit Fitur"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFeature(f.id)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300 transition-colors"
                        title="Hapus Fitur"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-8 text-center bg-stone-900 border border-dashed border-stone-800 rounded-2xl text-xs text-stone-500">
                Belum ada spesifikasi fitur terdaftar untuk proyek ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-SECTION: SCREENSHOTS */}
      {/* ========================================================================= */}
      {subSection === 'SCREENSHOTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">
              Screenshot wajib berasal dari build aplikasi nyata (<code className="text-cyan-400">verifiedRealApp</code>) dan bersih dari PII sebelum dapat berstatus public.
            </p>
            <button
              type="button"
              disabled={syncInfo.isFrozen}
              onClick={() => {
                setEditingScreenshot({
                  id: `shot_${selectedSlug}_${Date.now().toString(36)}`,
                  caption: '',
                  path: '',
                  publicationStatus: 'draft',
                  verifiedRealApp: true,
                  sanitized: true,
                  updatedAt: new Date().toISOString(),
                });
                setIsScreenshotModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-stone-950 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Screenshot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doc?.screenshots && doc.screenshots.length > 0 ? (
              doc.screenshots.map((s) => (
                <div
                  key={s.id}
                  className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div className="aspect-video bg-stone-950 flex items-center justify-center border-b border-stone-800 overflow-hidden relative">
                    {s.path ? (
                      <img
                        src={s.path}
                        alt={s.caption || 'Cuplikan layar'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-stone-700" />
                    )}
                    <span
                      className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        s.publicationStatus === 'public'
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700'
                          : 'bg-amber-950/90 text-amber-300 border border-amber-700'
                      }`}
                    >
                      {s.publicationStatus.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-4 space-y-2 flex-1">
                    <p className="text-xs font-semibold text-stone-200 line-clamp-2">{s.caption || 'Tanpa Keterangan'}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      <span className={s.verifiedRealApp ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.verifiedRealApp ? '✓ Build Nyata' : '✗ Unverified'}
                      </span>
                      <span className={s.sanitized ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.sanitized ? '✓ Bebas PII' : '✗ Belum Sanitasi'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-950/60 border-t border-stone-800 flex items-center justify-between">
                    {s.publicationStatus === 'draft' ? (
                      <button
                        type="button"
                        onClick={() => handleTransitionStatus('screenshot', s.id, 'public')}
                        disabled={!s.verifiedRealApp || !s.sanitized}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-40"
                      >
                        Publikasikan
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTransitionStatus('screenshot', s.id, 'draft')}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                      >
                        Tarik ke Draft
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingScreenshot(s);
                          setIsScreenshotModalOpen(true);
                        }}
                        className="p-1 rounded text-stone-400 hover:text-stone-200"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteScreenshot(s.id)}
                        className="p-1 rounded text-stone-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center bg-stone-900 border border-dashed border-stone-800 rounded-2xl text-xs text-stone-500">
                Belum ada screenshot terdaftar pada proyek ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-SECTION: EVENTS (CHANGELOG / ACTIVITY STREAM) */}
      {/* ========================================================================= */}
      {subSection === 'EVENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400">
              Lini masa progres dan riwayat sinkronisasi GitHub. Event yang disinkronkan dari Git selalu berstatus <code className="text-amber-400">draft</code> hingga disetujui.
            </p>
            <button
              type="button"
              disabled={syncInfo.isFrozen}
              onClick={() => {
                setEditingEvent({
                  id: `evt_${selectedSlug}_${Date.now().toString(36)}`,
                  eventType: 'general_update',
                  title: '',
                  description: '',
                  timestamp: new Date().toISOString(),
                  publicationStatus: 'draft',
                });
                setIsEventModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-stone-950 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Event</span>
            </button>
          </div>

          <div className="space-y-3">
            {(doc?.events || []).length > 0 ? (
              (doc?.events || [])
                .slice()
                .sort((a: ProgressEvent, b: ProgressEvent) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((e: ProgressEvent) => (
                  <div
                    key={e.id}
                    className="p-4 bg-stone-900 border border-stone-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-cyan-400 border border-stone-800">
                          {e.eventType}
                        </span>
                        <h4 className="text-sm font-bold text-stone-100">{e.title}</h4>
                        <span className="text-xs font-mono text-stone-500">
                          {new Date(e.timestamp).toLocaleString('id-ID')}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            e.publicationStatus === 'public'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-700'
                          }`}
                        >
                          {e.publicationStatus.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed">{e.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {e.publicationStatus === 'draft' ? (
                        <button
                          type="button"
                          onClick={() => handleTransitionStatus('event', e.id, 'public')}
                          className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 rounded-lg text-xs font-medium transition-colors"
                        >
                          Setujui & Publikasikan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTransitionStatus('event', e.id, 'draft')}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs transition-colors"
                        >
                          Tarik ke Draft
                        </button>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-8 text-center bg-stone-900 border border-dashed border-stone-800 rounded-2xl text-xs text-stone-500">
                Belum ada aktivitas terdaftar pada proyek ini.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-SECTION: AUDIT LOGS */}
      {/* ========================================================================= */}
      {subSection === 'AUDIT' && (
        <div className="space-y-3">
          <p className="text-xs text-stone-400">
            Jejak audit editorial untuk proyek <code className="text-cyan-400">{selectedSlug}</code>. Seluruh secret, token, dan kredensial disanitasi otomatis.
          </p>

          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 border-b border-stone-800 font-mono text-stone-400 uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Waktu (WIB)</th>
                    <th className="p-3">Aksi</th>
                    <th className="p-3">Aktor</th>
                    <th className="p-3">Hasil</th>
                    <th className="p-3">Rincian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 font-mono text-stone-300">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-850/50">
                        <td className="p-3 whitespace-nowrap text-stone-400">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 font-semibold text-cyan-400">{log.action}</td>
                        <td className="p-3 text-stone-400">{log.actorEmail}</td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.result === 'SUCCESS'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {log.result}
                          </span>
                        </td>
                        <td className="p-3 text-stone-400 text-[11px] max-w-xs truncate">
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-stone-500">
                        Belum ada jejak audit untuk proyek ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW MODAL (PROTECTED & NOINDEX) */}
      {/* ========================================================================= */}
      {isPreviewOpen && previewData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-950 border border-cyan-800/80 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Warning Header Banner */}
            <div className="bg-amber-950/80 border-b border-amber-800/80 p-3 px-5 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold tracking-wide">
                  [PREVIEW MODE] Menampilkan proyeksi draft & review untuk tinjauan internal. Halaman ini terproteksi & noindex.
                </span>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-amber-400 hover:text-white"
                title="Tutup Pratinjau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6 overflow-y-auto space-y-8">
              <div>
                <h3 className="text-xl font-bold text-stone-100">{previewData.projectName}</h3>
                <p className="text-xs font-mono text-cyan-400 mt-1">Slug: {previewData.projectSlug} | Tipe: {previewData.projectType}</p>
              </div>

              {/* Roadmap Milestones Preview */}
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-cyan-400" />
                  <span>Strategic Roadmap</span>
                </h4>
                {previewData.roadmap && previewData.roadmap.length > 0 ? (
                  <div className="space-y-2">
                    {previewData.roadmap.map((m) => (
                      <div key={m.id} className="p-3 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-200">{m.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-cyan-400">
                            {m.implementationStatus}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400">{m.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">Tidak ada milestone roadmap yang terlihat.</p>
                )}
              </section>

              {/* Features Preview */}
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Spesifikasi Fitur</span>
                </h4>
                {previewData.features && previewData.features.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {previewData.features.map((f) => (
                      <div key={f.id} className="p-3 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
                        <span className="text-xs font-bold text-stone-200 block">{f.title}</span>
                        <p className="text-xs text-stone-400">{f.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">Tidak ada fitur yang terlihat.</p>
                )}
              </section>

              {/* Screenshots Preview */}
              <section className="space-y-3">
                <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Galeri Screenshot</span>
                </h4>
                {previewData.screenshots && previewData.screenshots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {previewData.screenshots.map((s) => (
                      <div key={s.id} className="rounded-xl border border-stone-800 overflow-hidden bg-stone-900">
                        <div className="aspect-video bg-stone-950 flex items-center justify-center">
                          {s.path ? (
                            <img src={s.path} alt={s.caption} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-stone-700" />
                          )}
                        </div>
                        <p className="p-2 text-[11px] text-stone-300 truncate">{s.caption}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">Tidak ada screenshot yang terlihat.</p>
                )}
              </section>
            </div>

            <div className="p-4 bg-stone-900 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-stone-100">{confirmDialog.title}</h3>
            <p className="text-xs text-stone-300 leading-relaxed">{confirmDialog.description}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  confirmDialog.actionType === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-stone-950'
                }`}
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MILESTONE MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isMilestoneModalOpen && editingMilestone && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-stone-100">
              {editingMilestone.id.includes('Date.now') ? 'Tambah Milestone' : 'Edit Milestone'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Judul Milestone *</label>
                <input
                  type="text"
                  value={editingMilestone.title}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-cyan-500"
                  placeholder="Contoh: Arsitektur Inti & Manajemen Anggaran"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Deskripsi *</label>
                <textarea
                  value={editingMilestone.description}
                  onChange={(e) => setEditingMilestone({ ...editingMilestone, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-cyan-500"
                  placeholder="Deskripsi pencapaian milestone..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Target Kuartal</label>
                  <input
                    type="text"
                    value={editingMilestone.targetQuarter || ''}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, targetQuarter: e.target.value })}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                    placeholder="Q1 2026"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Urutan (Order)</label>
                  <input
                    type="number"
                    value={editingMilestone.order}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Status Dev</label>
                  <select
                    value={editingMilestone.implementationStatus}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, implementationStatus: e.target.value as ImplementationStatus })}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                  >
                    {VALID_IMPLEMENTATION_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Prioritas</label>
                  <select
                    value={editingMilestone.priority || 'medium'}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, priority: e.target.value as ItemPriority })}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                  >
                    {VALID_ITEM_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>{pr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsMilestoneModalOpen(false);
                  setEditingMilestone(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!editingMilestone.title || !editingMilestone.description || saving}
                onClick={() => handleSaveMilestone(editingMilestone)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEATURE MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isFeatureModalOpen && editingFeature && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-stone-100">
              {editingFeature.id.includes('Date.now') ? 'Tambah Fitur' : 'Edit Fitur'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Judul Fitur *</label>
                <input
                  type="text"
                  value={editingFeature.title}
                  onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                  placeholder="Contoh: Pencatatan Pemasukan & Pengeluaran"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Deskripsi *</label>
                <textarea
                  value={editingFeature.description}
                  onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                  placeholder="Deskripsi fitur teknis..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={editingFeature.category || ''}
                    onChange={(e) => setEditingFeature({ ...editingFeature, category: e.target.value })}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                    placeholder="Core Finance, UI, dll."
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Urutan (Order)</label>
                  <input
                    type="number"
                    value={editingFeature.order}
                    onChange={(e) => setEditingFeature({ ...editingFeature, order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Status Dev</label>
                <select
                  value={editingFeature.implementationStatus}
                  onChange={(e) => setEditingFeature({ ...editingFeature, implementationStatus: e.target.value as ImplementationStatus })}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                >
                  {VALID_IMPLEMENTATION_STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsFeatureModalOpen(false);
                  setEditingFeature(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!editingFeature.title || !editingFeature.description || saving}
                onClick={() => handleSaveFeature(editingFeature)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Fitur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREENSHOT MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isScreenshotModalOpen && editingScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-stone-100">
              {editingScreenshot.id.includes('Date.now') ? 'Tambah Screenshot' : 'Edit Screenshot'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Keterangan / Caption *</label>
                <input
                  type="text"
                  value={editingScreenshot.caption}
                  onChange={(e) => setEditingScreenshot({ ...editingScreenshot, caption: e.target.value })}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                  placeholder="Contoh: Tampilan dashboard ringkasan anggaran"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Path Gambar (Aset Lokal / Media ID) *</label>
                <input
                  type="text"
                  value={editingScreenshot.path}
                  onChange={(e) => setEditingScreenshot({ ...editingScreenshot, path: e.target.value })}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 font-mono"
                  placeholder="/assets/projects/dompetnalar/screenshots/1.png"
                />
              </div>

              <div className="space-y-2 pt-1 bg-stone-950 p-3 rounded-xl border border-stone-850">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingScreenshot.verifiedRealApp}
                    onChange={(e) => setEditingScreenshot({ ...editingScreenshot, verifiedRealApp: e.target.checked })}
                    className="rounded border-stone-800 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-stone-300">Telah Diverifikasi Berasal dari Build Nyata (verifiedRealApp)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingScreenshot.sanitized}
                    onChange={(e) => setEditingScreenshot({ ...editingScreenshot, sanitized: e.target.checked })}
                    className="rounded border-stone-800 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-stone-300">Telah Disanitasi dari PII, Notifikasi, dan Credential (sanitized)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsScreenshotModalOpen(false);
                  setEditingScreenshot(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!editingScreenshot.caption || !editingScreenshot.path || saving}
                onClick={() => handleSaveScreenshot(editingScreenshot)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Screenshot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EVENT MODAL (ADD / EDIT) */}
      {/* ========================================================================= */}
      {isEventModalOpen && editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-stone-100">
              {editingEvent.id.includes('Date.now') ? 'Tambah Aktivitas Linimasa' : 'Edit Event'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">Judul Event *</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                  placeholder="Contoh: Rilis Modul Anggaran v1.2.0"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Deskripsi *</label>
                <textarea
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  rows={3}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                  placeholder="Keterangan pencapaian atau rilis..."
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Tipe Event</label>
                <select
                  value={editingEvent.eventType}
                  onChange={(e) => setEditingEvent({ ...editingEvent, eventType: e.target.value as ProgressEventType })}
                  className="w-full p-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200"
                >
                  {VALID_EVENT_TYPES.map((ev) => (
                    <option key={ev} value={ev}>{ev}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEventModalOpen(false);
                  setEditingEvent(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!editingEvent.title || !editingEvent.description || saving}
                onClick={() => handleSaveEvent(editingEvent)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 text-xs font-bold transition-colors disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
