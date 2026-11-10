import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  LogOut,
  FolderKanban,
  FileClock,
  Plus,
  Edit3,
  CheckCircle2,
  Clock,
  Archive,
  Eye,
  AlertCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Image,
  UploadCloud,
  Trash2,
  Copy,
  Search,
  RotateCcw,
  Globe,
  FileText,
  Shield,
  ExternalLink,
  Save,
  Send,
  Sliders,
  Code,
  Tag,
  Workflow,
} from 'lucide-react';
import {
  fetchAdminSiteSettings,
  saveAdminSiteSettings,
} from '../services/cmsSettingsService';
import {
  fetchAdminComplianceList,
  saveAdminCompliance,
} from '../services/cmsComplianceService';
import { SiteSettings, DEFAULT_SITE_SETTINGS } from '../types/settings';
import {
  ProjectCompliance,
  generateDefaultPrivacyPolicy,
  generateDefaultDeleteAccount,
} from '../types/compliance';
import {
  requestAdminOtp,
  verifyAdminOtp,
  logoutAdmin,
  getAdminSession,
} from '../services/adminAuthService';
import {
  fetchAdminProjects,
  saveAdminProject,
  reorderAdminProjects,
  fetchAdminAuditLogs,
  CmsProject,
  CmsAuditLog,
} from '../services/cmsProjectService';
import {
  uploadCmsMedia,
  fetchProjectMedia,
  updateMediaStatus,
  deleteCmsMedia,
  replaceCmsMedia,
  validateMediaFileBeforeUpload,
} from '../services/cmsMediaService';
import { CmsMediaMetadata, MediaRole, MediaVisibility } from '../services/media/types';
import { ProjectIcon, ScreenshotImage } from '../components/ProjectMedia';
import { AdminProgressManager } from '../components/admin/AdminProgressManager';
import { ClosedTestingMonitor } from '../components/admin/ClosedTestingMonitor';
import { usePageMeta } from '../hooks/usePageMeta';

export const AdminPage: React.FC = () => {
  usePageMeta({
    title: 'Admin CMS Dashboard',
    description: 'Pusat manajemen konten proyek, media library, dan audit logs SleepyKoala Studio.',
    canonicalPath: '/admin',
  });
  const [, startTransition] = useTransition();

  // State Autentikasi
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [environment, setEnvironment] = useState<'production' | 'test' | 'unknown'>('production');
  const [otpSent, setOtpSent] = useState(false);
  const [emailInput, setEmailInput] = useState('zweifeel@gmail.com');
  const [otpInput, setOtpInput] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // State CMS Projects & Logs & Media
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'PROGRESS' | 'MEDIA' | 'SETTINGS' | 'COMPLIANCE' | 'AUDIT_LOGS'>('PROJECTS');
  const [projects, setProjects] = useState<CmsProject[]>([]);
  const [auditLogs, setAuditLogs] = useState<CmsAuditLog[]>([]);
  const [mediaList, setMediaList] = useState<CmsMediaMetadata[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // State Website Content Settings (Milestone 6.6)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'BRANDING' | 'HOMEPAGE' | 'ABOUT' | 'NAVIGATION' | 'FOOTER' | 'SEO'>('BRANDING');
  const [settingsPreview, setSettingsPreview] = useState(false);

  // State Google Play Compliance Manager (Milestone 6.6)
  const [complianceList, setComplianceList] = useState<ProjectCompliance[]>([]);
  const [selectedCompliance, setSelectedCompliance] = useState<ProjectCompliance | null>(null);
  const [complianceSubTab, setComplianceSubTab] = useState<'PRIVACY' | 'DELETE_ACCOUNT'>('PRIVACY');
  const [complianceSaving, setComplianceSaving] = useState(false);
  const [compliancePreview, setCompliancePreview] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);

  // State Filter & Pencarian Media
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('*');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedVisibilityFilter, setSelectedVisibilityFilter] = useState<string>('ALL');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');

  // State Modal Editor Proyek & Preview
  const [editingProject, setEditingProject] = useState<Partial<CmsProject> | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // State Upload Media
  const [mediaUploadModalOpen, setMediaUploadModalOpen] = useState(false);
  const [mediaUploadFile, setMediaUploadFile] = useState<File | null>(null);
  const [mediaUploadProject, setMediaUploadProject] = useState<string>('');
  const [mediaUploadRole, setMediaUploadRole] = useState<MediaRole>('GALLERY');
  const [mediaUploadVisibility, setMediaUploadVisibility] = useState<MediaVisibility>('DRAFT');
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  // State Replace Media Modal
  const [replacingMedia, setReplacingMedia] = useState<CmsMediaMetadata | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceUploading, setReplaceUploading] = useState(false);

  // State Pratinjau Detail Media (Admin Preview Modal)
  const [previewMediaModal, setPreviewMediaModal] = useState<CmsMediaMetadata | null>(null);

  // State Pengelolaan Logo & Galeri Proyek di Modal Editor (Milestone 6.5.6)
  const [logoUploading, setLogoUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<
    { type: 'LOGO' } | { type: 'SCREENSHOT_ADD' } | { type: 'SCREENSHOT_REPLACE'; index: number } | null
  >(null);
  const [mediaPickerFilter, setMediaPickerFilter] = useState<string>('*');

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const replaceScreenshotInputRef = useRef<HTMLInputElement | null>(null);

  const loadCmsData = async () => {
    setLoadingData(true);
    setLoadError(null);

    try {
      const projRes = await fetchAdminProjects();
      if (projRes.success && projRes.data) {
        setProjects(projRes.data);
      } else {
        setLoadError(projRes.message || 'Gagal memuat data proyek dari backend CMS.');
      }

      const logRes = await fetchAdminAuditLogs();
      if (logRes.success && logRes.data) {
        setAuditLogs(logRes.data);
      }

      const mediaRes = await fetchProjectMedia('*');
      if (mediaRes.success && mediaRes.data) {
        setMediaList(mediaRes.data);
      } else if (!projRes.data) {
        setLoadError((prev) => prev || mediaRes.message || 'Gagal memuat pustaka media.');
      }

      // Load Settings & Compliance (Milestone 6.6)
      const settingsRes = await fetchAdminSiteSettings();
      if (settingsRes.success && settingsRes.settings) {
        setSiteSettings(settingsRes.settings);
      }

      const compRes = await fetchAdminComplianceList();
      if (compRes.success && compRes.complianceRecords) {
        setComplianceList(compRes.complianceRecords);
      }
    } catch (err: any) {
      setLoadError(err.message || 'Terjadi kesalahan saat memuat data CMS.');
    } finally {
      setLoadingData(false);
    }
  };

  const checkSession = async () => {
    setCheckingAuth(true);
    try {
      const session = await getAdminSession();
      if (session.authenticated && session.email) {
        setIsAuthenticated(true);
        setAdminEmail(session.email);
        if (session.environment) {
          setEnvironment(session.environment);
        }
        loadCmsData();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  // 1. Cek Sesi Saat Mount
  useEffect(() => {
    checkSession();
  }, []);

  // Timer Cooldown OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const res = await requestAdminOtp(emailInput);
    setAuthLoading(false);

    if (res.success) {
      setOtpSent(true);
      setCooldown(res.cooldownSeconds || 60);
      showMessage('Kode OTP telah dikirimkan ke email Anda.', 'success');
    } else {
      setAuthError(res.message || 'Gagal mengirimkan OTP.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const res = await verifyAdminOtp(emailInput, otpInput);
    setAuthLoading(false);

    if (res.success) {
      setIsAuthenticated(true);
      setAdminEmail(emailInput);
      if (res.data?.environment) {
        setEnvironment(res.data.environment);
      }
      setOtpInput('');
      showMessage('Autentikasi berhasil. Selamat datang di CMS!', 'success');
      loadCmsData();
    } else {
      setAuthError(res.message || 'Kode OTP tidak valid atau kedaluwarsa.');
    }
  };

  const handleLogout = async () => {
    await logoutAdmin(false);
    setIsAuthenticated(false);
    setOtpSent(false);
    setOtpInput('');
    showMessage('Anda telah keluar dari CMS.', 'success');
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.name || !editingProject.slug) {
      showMessage('Nama dan Slug proyek wajib diisi.', 'error');
      return;
    }

    const isNew = !projects.some((p) => p.id === editingProject.id || p.slug === editingProject.slug);
    const res = await saveAdminProject(editingProject);
    if (res.success) {
      // Auto-initial configuration for Compliance on project creation (Milestone 6.6 Requirement D)
      if (isNew && editingProject.slug && editingProject.name) {
        const defaultPrivacy = generateDefaultPrivacyPolicy(editingProject.name, editingProject.slug);
        const defaultDelete = generateDefaultDeleteAccount(editingProject.name, editingProject.slug);
        await saveAdminCompliance({
          projectId: editingProject.id || editingProject.slug,
          projectSlug: editingProject.slug,
          projectName: editingProject.name,
          privacyPolicy: defaultPrivacy,
          deleteAccount: defaultDelete,
        });
      }
      showMessage(`Proyek ${editingProject.name} berhasil disimpan!`, 'success');
      setEditingProject(null);
      setPreviewMode(false);
      loadCmsData();
    } else {
      showMessage(res.message || 'Gagal menyimpan proyek.', 'error');
    }
  };

  // =========================================================================
  // HANDLERS: WEBSITE SETTINGS & COMPLIANCE (Milestone 6.6)
  // =========================================================================

  const handleSaveSettings = async (publish: boolean = false) => {
    setSettingsSaving(true);
    try {
      const res = await saveAdminSiteSettings(siteSettings, publish);
      if (res.success && res.settings) {
        setSiteSettings(res.settings);
        showMessage(publish ? 'Pengaturan website berhasil dipublikasikan ke publik!' : 'Draft pengaturan website berhasil disimpan.', 'success');
      } else {
        showMessage(res.message || 'Gagal menyimpan pengaturan website.', 'error');
      }
    } catch (err: any) {
      showMessage(err.message || 'Terjadi kesalahan saat menyimpan pengaturan.', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleOpenComplianceModal = (comp: ProjectCompliance) => {
    setSelectedCompliance(JSON.parse(JSON.stringify(comp)));
    setComplianceModalOpen(true);
  };

  const handleSaveComplianceRecord = async (action?: 'save_draft' | 'publish_privacy' | 'publish_delete_account' | 'unpublish_privacy' | 'unpublish_delete_account') => {
    if (!selectedCompliance) return;
    setComplianceSaving(true);
    try {
      const res = await saveAdminCompliance(selectedCompliance, action);
      if (res.success && res.compliance) {
        setSelectedCompliance(res.compliance);
        setComplianceList((prev) => {
          const index = prev.findIndex((c) => c.projectId === res.compliance!.projectId || c.projectSlug === res.compliance!.projectSlug);
          if (index >= 0) {
            const next = [...prev];
            next[index] = res.compliance!;
            return next;
          }
          return [...prev, res.compliance!];
        });
        showMessage('Dokumen kepatuhan Google Play berhasil diperbarui!', 'success');
      } else {
        showMessage(res.message || 'Gagal menyimpan kepatuhan proyek.', 'error');
      }
    } catch (err: any) {
      showMessage(err.message || 'Terjadi kesalahan saat menyimpan kepatuhan.', 'error');
    } finally {
      setComplianceSaving(false);
    }
  };

  const handleLoadPrivacyTemplate = () => {
    if (!selectedCompliance) return;
    const template = generateDefaultPrivacyPolicy(selectedCompliance.projectName, selectedCompliance.projectSlug);
    setSelectedCompliance({
      ...selectedCompliance,
      privacyPolicy: {
        ...template,
        status: selectedCompliance.privacyPolicy?.status || 'draft',
      },
    });
    showMessage('Template standar Kebijakan Privasi Google Play dimuat ke editor!', 'success');
  };

  const handleLoadDeleteAccountTemplate = () => {
    if (!selectedCompliance) return;
    const template = generateDefaultDeleteAccount(selectedCompliance.projectName, selectedCompliance.projectSlug);
    setSelectedCompliance({
      ...selectedCompliance,
      deleteAccount: {
        ...template,
        status: selectedCompliance.deleteAccount?.status || 'draft',
      },
    });
    showMessage('Template standar Panduan Hapus Akun Google Play dimuat ke editor!', 'success');
  };

  // =========================================================================
  // HANDLERS: LOGO & SCREENSHOT GALLERY MANAGEMENT (Milestone 6.5.6)
  // =========================================================================

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingProject) return;
    const file = e.target.files[0];
    e.target.value = '';

    const validation = await validateMediaFileBeforeUpload(file);
    if (!validation.valid) {
      showMessage(validation.message || 'Berkas logo tidak valid.', 'error');
      return;
    }

    setLogoUploading(true);
    const targetProjectId = editingProject.id || 'global';
    const res = await uploadCmsMedia(targetProjectId, file, 'ICON', 'PUBLISHED');
    setLogoUploading(false);

    if (res.success && (res.publicUrl || res.media)) {
      const publicUrl = res.publicUrl || `/api/media/${res.media!.mediaId}`;
      setEditingProject((prev) => (prev ? { ...prev, icon: publicUrl, iconUrl: publicUrl } : null));
      if (res.media) {
        setMediaList((prev) => {
          if (prev.some((m) => m.mediaId === res.media!.mediaId)) return prev;
          return [res.media!, ...prev];
        });
      }
      showMessage(res.isDuplicate ? 'Logo menggunakan aset yang sudah ada di Media Library.' : 'Logo utama proyek berhasil diunggah!', 'success');
    } else {
      showMessage(res.message || 'Gagal mengunggah logo proyek.', 'error');
    }
  };

  const handleRemoveLogo = () => {
    if (!window.confirm('Hapus logo dari proyek ini? Proyek akan menggunakan inisial dan ikon kategori bawaan.')) return;
    setEditingProject((prev) => (prev ? { ...prev, icon: '', iconUrl: '' } : null));
    showMessage('Logo proyek dilepas dari rancangan proyek.', 'success');
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingProject) return;
    const files = Array.from(e.target.files);
    e.target.value = '';

    const currentScreenshots = Array.isArray(editingProject.screenshots) ? editingProject.screenshots : [];
    const MAX_SCREENSHOTS = 8;
    if (currentScreenshots.length + files.length > MAX_SCREENSHOTS) {
      showMessage(`Maksimal ${MAX_SCREENSHOTS} tangkapan layar per proyek. Tersedia sisa slot ${Math.max(0, MAX_SCREENSHOTS - currentScreenshots.length)} gambar.`, 'error');
      return;
    }

    setGalleryUploading(true);
    const targetProjectId = editingProject.id || 'global';
    const addedUrls: string[] = [];

    for (const file of files) {
      const validation = await validateMediaFileBeforeUpload(file);
      if (!validation.valid) {
        showMessage(`Berkas ${file.name} tidak valid: ${validation.message}`, 'error');
        continue;
      }
      const res = await uploadCmsMedia(targetProjectId, file, 'SCREENSHOT', 'PUBLISHED');
      if (res.success && (res.publicUrl || res.media)) {
        const publicUrl = res.publicUrl || `/api/media/${res.media!.mediaId}`;
        addedUrls.push(publicUrl);
        if (res.media) {
          setMediaList((prev) => {
            if (prev.some((m) => m.mediaId === res.media!.mediaId)) return prev;
            return [res.media!, ...prev];
          });
        }
      } else {
        showMessage(res.message || `Gagal mengunggah berkas ${file.name}.`, 'error');
      }
    }

    setGalleryUploading(false);

    if (addedUrls.length > 0) {
      setEditingProject((prev) => {
        if (!prev) return null;
        const current = Array.isArray(prev.screenshots) ? prev.screenshots : [];
        return { ...prev, screenshots: [...current, ...addedUrls] };
      });
      showMessage(`${addedUrls.length} gambar berhasil ditambahkan ke galeri pratinjau!`, 'success');
    }
  };

  const handleMoveScreenshot = (index: number, direction: 'left' | 'right') => {
    if (!editingProject) return;
    const current = Array.isArray(editingProject.screenshots) ? [...editingProject.screenshots] : [];
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= current.length) return;
    const temp = current[index];
    current[index] = current[target];
    current[target] = temp;
    setEditingProject({ ...editingProject, screenshots: current });
  };

  const handleReplaceScreenshotSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || replaceTargetIndex === null || !editingProject) return;
    const file = e.target.files[0];
    e.target.value = '';
    const targetIdx = replaceTargetIndex;
    setReplaceTargetIndex(null);

    const validation = await validateMediaFileBeforeUpload(file);
    if (!validation.valid) {
      showMessage(validation.message || 'Berkas pengganti tidak valid.', 'error');
      return;
    }

    setGalleryUploading(true);
    const targetProjectId = editingProject.id || 'global';
    const res = await uploadCmsMedia(targetProjectId, file, 'SCREENSHOT', 'PUBLISHED');
    setGalleryUploading(false);

    if (res.success && (res.publicUrl || res.media)) {
      const publicUrl = res.publicUrl || `/api/media/${res.media!.mediaId}`;
      setEditingProject((prev) => {
        if (!prev) return null;
        const current = Array.isArray(prev.screenshots) ? [...prev.screenshots] : [];
        current[targetIdx] = publicUrl;
        return { ...prev, screenshots: current };
      });
      if (res.media) {
        setMediaList((prev) => {
          if (prev.some((m) => m.mediaId === res.media!.mediaId)) return prev;
          return [res.media!, ...prev];
        });
      }
      showMessage(`Gambar pratinjau #${targetIdx + 1} berhasil diganti!`, 'success');
    } else {
      showMessage(res.message || 'Gagal mengganti gambar pratinjau.', 'error');
    }
  };

  const handleDeleteScreenshot = (index: number) => {
    if (!window.confirm(`Hapus gambar pratinjau #${index + 1} dari galeri proyek ini?`)) return;
    setEditingProject((prev) => {
      if (!prev) return null;
      const current = Array.isArray(prev.screenshots) ? [...prev.screenshots] : [];
      current.splice(index, 1);
      return { ...prev, screenshots: current };
    });
    showMessage(`Gambar pratinjau #${index + 1} dilepas dari galeri proyek.`, 'success');
  };

  const handleSelectMediaFromPicker = (media: CmsMediaMetadata) => {
    if (!editingProject || !mediaPickerTarget) return;
    const publicUrl = `/api/media/${media.mediaId}`;

    if (mediaPickerTarget.type === 'LOGO') {
      setEditingProject({ ...editingProject, icon: publicUrl, iconUrl: publicUrl });
      showMessage('Logo proyek berhasil dipilih dari Pustaka Media!', 'success');
    } else if (mediaPickerTarget.type === 'SCREENSHOT_ADD') {
      const current = Array.isArray(editingProject.screenshots) ? [...editingProject.screenshots] : [];
      if (current.length >= 8) {
        showMessage('Galeri sudah mencapai batas maksimum 8 gambar.', 'error');
        setMediaPickerOpen(false);
        return;
      }
      setEditingProject({ ...editingProject, screenshots: [...current, publicUrl] });
      showMessage('Gambar berhasil ditambahkan ke galeri dari Pustaka Media!', 'success');
    } else if (mediaPickerTarget.type === 'SCREENSHOT_REPLACE') {
      const current = Array.isArray(editingProject.screenshots) ? [...editingProject.screenshots] : [];
      current[mediaPickerTarget.index] = publicUrl;
      setEditingProject({ ...editingProject, screenshots: current });
      showMessage(`Gambar #${mediaPickerTarget.index + 1} berhasil diganti dari Pustaka Media!`, 'success');
    }

    setMediaPickerOpen(false);
    setMediaPickerTarget(null);
  };

  const handleToggleProjectPublish = async (proj: CmsProject, nextState: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
    const updated = { ...proj, publishState: nextState };
    const res = await saveAdminProject(updated);
    if (res.success) {
      const label = nextState === 'PUBLISHED' ? 'dipublikasikan' : nextState === 'ARCHIVED' ? 'diarsipkan' : 'dikembalikan ke Draft';
      showMessage(`Proyek ${proj.name} berhasil ${label}!`, 'success');
      loadCmsData();
    } else {
      showMessage(res.message || 'Gagal mengubah status publikasi proyek.', 'error');
    }
  };

  const handleReorder = async (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === projects.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const newProjects = [...projects];
    const temp = newProjects[index];
    newProjects[index] = newProjects[targetIndex];
    newProjects[targetIndex] = temp;

    setProjects(newProjects);
    const orderedIds = newProjects.map((p) => p.id);
    const res = await reorderAdminProjects(orderedIds);
    if (!res.success) {
      showMessage('Gagal menyimpan urutan baru.', 'error');
      loadCmsData();
    } else {
      showMessage('Urutan proyek berhasil diperbarui.', 'success');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaUploadFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreviewUrl(url);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUploadFile) {
      showMessage('Silakan pilih file gambar untuk diunggah.', 'error');
      return;
    }
    const targetProject = mediaUploadProject || (projects[0]?.id || 'proj_global');
    setMediaUploading(true);
    const res = await uploadCmsMedia(targetProject, mediaUploadFile, mediaUploadRole, mediaUploadVisibility);
    setMediaUploading(false);

    if (res.success && res.media) {
      showMessage(res.isDuplicate ? 'File duplikat terdeteksi (aset yang sudah ada digunakan kembali).' : 'Media berhasil diunggah!', 'success');
      setMediaUploadModalOpen(false);
      setMediaUploadFile(null);
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
        setMediaPreviewUrl(null);
      }
      loadCmsData();
    } else {
      showMessage(res.message || 'Gagal mengunggah media.', 'error');
    }
  };

  const handleReplaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingMedia || !replaceFile) {
      showMessage('Silakan pilih file pengganti.', 'error');
      return;
    }

    setReplaceUploading(true);
    const res = await replaceCmsMedia(
      replacingMedia.mediaId,
      replacingMedia.projectId,
      replaceFile,
      replacingMedia.role,
      replacingMedia.visibility
    );
    setReplaceUploading(false);

    if (res.success) {
      showMessage('Media berhasil diganti!', 'success');
      setReplacingMedia(null);
      setReplaceFile(null);
      loadCmsData();
    } else {
      showMessage(res.message || 'Gagal mengganti media.', 'error');
    }
  };

  const handleToggleMediaVisibility = async (media: CmsMediaMetadata, nextVisibility: MediaVisibility) => {
    const res = await updateMediaStatus(media.mediaId, nextVisibility);
    if (res.success) {
      showMessage(`Status media diubah menjadi ${nextVisibility}.`, 'success');
      loadCmsData();
    } else {
      showMessage(res.message || 'Gagal mengubah status media.', 'error');
    }
  };

  const handleDeleteMedia = async (mediaId: string, permanent: boolean = false) => {
    const confirmMessage = permanent
      ? 'PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN berkas ini dari Google Drive dan database? Tindakan ini tidak dapat dibatalkan.'
      : 'Apakah Anda yakin ingin mengarsipkan berkas media ini (soft-delete)?';

    if (!window.confirm(confirmMessage)) return;

    setDeletingMediaId(mediaId);
    const res = await deleteCmsMedia(mediaId, permanent);
    setDeletingMediaId(null);

    if (res.success) {
      showMessage(res.message || (permanent ? 'Media berhasil dihapus permanen.' : 'Media berhasil diarsipkan.'), 'success');
      loadCmsData();
    } else {
      showMessage(res.message || 'Gagal memproses penghapusan media.', 'error');
    }
  };

  // Filter Media List berdasarkan Project, Role, Visibility, dan Search Query
  const filteredMediaList = mediaList.filter((m) => {
    const matchProject = selectedProjectFilter === '*' || m.projectId === selectedProjectFilter;
    const matchRole = selectedRoleFilter === 'ALL' || m.role === selectedRoleFilter;
    const matchVisibility = selectedVisibilityFilter === 'ALL' || m.visibility === selectedVisibilityFilter;
    const matchSearch =
      !mediaSearchQuery.trim() ||
      m.originalName.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
      m.safeName.toLowerCase().includes(mediaSearchQuery.toLowerCase()) ||
      m.mediaId.toLowerCase().includes(mediaSearchQuery.toLowerCase());
    return matchProject && matchRole && matchVisibility && matchSearch;
  });

  // Metrik Ringkasan Lengkap Dashboard Overview (Section 4.B)
  const projectMetrics = {
    total: projects.length,
    published: projects.filter((p) => p.publishState === 'PUBLISHED').length,
    draft: projects.filter((p) => p.publishState === 'DRAFT').length,
    archived: projects.filter((p) => p.publishState === 'ARCHIVED').length,
  };

  const mediaMetrics = {
    total: mediaList.length,
    published: mediaList.filter((m) => m.visibility === 'PUBLISHED').length,
    draft: mediaList.filter((m) => m.visibility === 'DRAFT').length,
    archived: mediaList.filter((m) => m.visibility === 'ARCHIVED').length,
  };

  const renderProjectMetric = (val: number) => {
    if (loadingData && projects.length === 0) return '...';
    if (loadError && projects.length === 0) return '—';
    return val;
  };

  const renderMediaMetric = (val: number) => {
    if (loadingData && mediaList.length === 0) return '...';
    if (loadError && mediaList.length === 0) return '—';
    return val;
  };

  // =========================================================================
  // VIEW: CHECKING AUTH SPINNER
  // =========================================================================
  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-stone-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-4" />
        <p className="text-sm font-medium">Memeriksa status sesi administrator...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: LOGIN SCREEN (OTP AUTH)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-center w-12 h-12 bg-cyan-950/60 border border-cyan-800/40 rounded-xl mx-auto mb-4 text-cyan-400">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-center text-stone-100 mb-1">
            SleepyKoala CMS Admin
          </h1>
          <p className="text-xs text-center text-stone-400 mb-6">
            Pusat administrasi portofolio & closed testing Google Play.
          </p>

          {authError && (
            <div className="mb-4 p-3 bg-rose-950/50 border border-rose-800/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Email Administrator Terotorisasi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    placeholder="nama@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>Minta Kode Masuk (OTP)</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Kode OTP 6-Digit (Berlaku 5 Menit)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    maxLength={6}
                    pattern="\d{6}"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-center text-lg tracking-widest font-mono text-cyan-300 placeholder-stone-600 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                  />
                </div>
                <p className="mt-1.5 text-xs text-stone-500 text-center">
                  Cek kotak masuk email <strong className="text-stone-300">{emailInput}</strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={authLoading || otpInput.length !== 6}
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verifikasi & Masuk CMS</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={handleRequestOtp}
                  className="text-xs text-stone-400 hover:text-cyan-400 transition-colors disabled:opacity-50"
                >
                  {cooldown > 0 ? `Kirim ulang OTP dalam ${cooldown}s` : 'Kirim Ulang Kode OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Session Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded-md">
              CMS Admin v2.0
            </span>
            {environment === 'test' ? (
              <span className="px-2 py-0.5 text-xs font-mono bg-amber-950 text-amber-400 border border-amber-800/40 rounded-md">
                Test Database
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/40 rounded-md">
                Production Database
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight mt-1">
            Dasbor Pengelolaan Portofolio
          </h1>
          <p className="text-xs text-stone-400">
            Login sebagai: <strong className="text-stone-200">{adminEmail}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCmsData}
            disabled={loadingData}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Segarkan</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Action Notification Bar */}
      {actionMessage && (
        <div
          className={`my-4 p-3 rounded-xl border flex items-center gap-2 text-xs transition-all ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-300'
              : 'bg-rose-950/50 border-rose-800/50 text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Error Banner jika data gagal dimuat */}
      {loadError && (
        <div className="my-4 p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            onClick={loadCmsData}
            className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800/60 text-white rounded-lg font-medium transition-colors shrink-0"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Dashboard Overview Metrics Row (Section 4.B - Proyek & Media Metrics) */}
      <div className="my-6 space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-stone-400">
          Ringkasan Metrik Database {environment === 'test' ? 'TEST' : 'Production'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Projects Metrics */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3">
            <p className="text-[11px] text-stone-400">Total Proyek</p>
            <p className="text-lg font-bold text-stone-100 mt-0.5">{renderProjectMetric(projectMetrics.total)}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3">
            <p className="text-[11px] text-emerald-400">Proyek Rilis</p>
            <p className="text-lg font-bold text-emerald-300 mt-0.5">{renderProjectMetric(projectMetrics.published)}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3">
            <p className="text-[11px] text-amber-400">Proyek Draft</p>
            <p className="text-lg font-bold text-amber-300 mt-0.5">{renderProjectMetric(projectMetrics.draft)}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3">
            <p className="text-[11px] text-stone-500">Proyek Arsip</p>
            <p className="text-lg font-bold text-stone-400 mt-0.5">{renderProjectMetric(projectMetrics.archived)}</p>
          </div>

          {/* Media Metrics */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3">
            <p className="text-[11px] text-stone-400">Total Media</p>
            <p className="text-lg font-bold text-stone-100 mt-0.5">{renderMediaMetric(mediaMetrics.total)}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3">
            <p className="text-[11px] text-emerald-400">Media Rilis</p>
            <p className="text-lg font-bold text-emerald-300 mt-0.5">{renderMediaMetric(mediaMetrics.published)}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3">
            <p className="text-[11px] text-amber-400">Media Draft</p>
            <p className="text-lg font-bold text-amber-300 mt-0.5">{renderMediaMetric(mediaMetrics.draft)}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-3">
            <p className="text-[11px] text-stone-500">Media Arsip</p>
            <p className="text-lg font-bold text-stone-400 mt-0.5">{renderMediaMetric(mediaMetrics.archived)}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Milestone 6.6.1: 5-Tab System with Mobile Horizontal Scroll) */}
      <div className="flex items-center border-b border-stone-800 mb-6 gap-2 sm:gap-6 overflow-x-auto pb-1 scroll-smooth">
        {/* Tab 1: Katalog Proyek */}
        <button
          onClick={() => startTransition(() => setActiveTab('PROJECTS'))}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
            activeTab === 'PROJECTS'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>Katalog Proyek ({projects.length})</span>
        </button>

        {/* Tab 1.5: Progress & Roadmap (Stage 5) */}
        <button
          onClick={() => startTransition(() => setActiveTab('PROGRESS'))}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
            activeTab === 'PROGRESS'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>Progress & Roadmap</span>
        </button>

        {/* Tab 2: Pustaka Media */}
        <button
          onClick={() => startTransition(() => setActiveTab('MEDIA'))}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
            activeTab === 'MEDIA'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>Pustaka Media ({mediaList.length})</span>
        </button>

        {/* Tab 3: Audit Log Aktivitas */}
        <button
          onClick={() => startTransition(() => setActiveTab('AUDIT_LOGS'))}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
            activeTab === 'AUDIT_LOGS'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FileClock className="w-4 h-4" />
          <span>Audit Log Aktivitas ({auditLogs.length})</span>
        </button>

        {/* Tab 4: Pengaturan Website */}
        <button
          onClick={() => startTransition(() => setActiveTab('SETTINGS'))}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
            activeTab === 'SETTINGS'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Pengaturan Website</span>
        </button>

        {/* Tab 5: Privacy Policy & Delete Account */}
        <button
          onClick={() => startTransition(() => setActiveTab('COMPLIANCE'))}
          className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors shrink-0 whitespace-nowrap ${
            activeTab === 'COMPLIANCE'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy Policy & Delete Account ({complianceList.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROJECTS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'PROJECTS' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-stone-400">
              Kelola status penerbitan portofolio dan recruitment tester Google Play.
            </p>
            <button
              onClick={() => {
                setEditingProject({
                  id: `proj_${Date.now().toString(36)}`,
                  slug: '',
                  name: '',
                  category: 'APPLICATION',
                  status: 'WORK_IN_PROGRESS',
                  publishState: 'DRAFT',
                  shortDescription: '',
                  fullDescription: '',
                  tagline: '',
                  version: '0.1.0',
                  screenshots: [],
                  tags: [],
                  registrationOpen: false,
                  testerRequirementDays: 14,
                  featured: false,
                  capabilities: [],
                  technicalHighlights: [],
                });
                setPreviewMode(false);
              }}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Proyek Baru</span>
            </button>
          </div>

          {loadingData ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
              <p className="text-xs">Memuat katalog proyek dari database CMS...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-400">
              <FolderKanban className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-300">Belum Ada Proyek di Database</p>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                Katalog masih kosong. Klik tombol &ldquo;Tambah Proyek Baru&rdquo; untuk membuat entri proyek pertama.
              </p>
            </div>
          ) : (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider font-mono border-b border-stone-800">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">Urutan</th>
                      <th className="py-3.5 px-4">Proyek & Kategori</th>
                      <th className="py-3.5 px-4">Status Siklus Dev</th>
                      <th className="py-3.5 px-4">Status Publikasi</th>
                      <th className="py-3.5 px-4">Perekrutan Tester</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {projects.map((proj, idx) => (
                      <tr key={proj.id} className="hover:bg-stone-850/50 transition-colors">
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleReorder(idx, 'UP')}
                              className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-20"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-stone-400">{idx + 1}</span>
                            <button
                              disabled={idx === projects.length - 1}
                              onClick={() => handleReorder(idx, 'DOWN')}
                              className="p-1 text-stone-500 hover:text-stone-300 disabled:opacity-20"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-100 text-sm">{proj.name}</div>
                          <div className="text-[11px] font-mono text-stone-400">
                            /{proj.slug} • <span className="text-cyan-400">{proj.category}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono border bg-stone-950 text-stone-300 border-stone-700">
                            {proj.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                              proj.publishState === 'PUBLISHED'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
                                : proj.publishState === 'ARCHIVED'
                                ? 'bg-stone-950 text-stone-500 border-stone-800'
                                : 'bg-amber-950 text-amber-400 border-amber-800/50'
                            }`}
                          >
                            {proj.publishState || 'DRAFT'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {proj.registrationOpen ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Terbuka ({proj.testerRequirementDays || 14} Hari)
                            </span>
                          ) : (
                            <span className="text-stone-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Ditutup
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProject(proj);
                                setPreviewMode(false);
                              }}
                              className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-cyan-400" />
                              <span>Edit</span>
                            </button>

                            {proj.publishState === 'PUBLISHED' ? (
                              <button
                                onClick={() => handleToggleProjectPublish(proj, 'DRAFT')}
                                className="px-2 py-1 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/40 text-amber-300 rounded-lg text-xs font-medium transition-colors"
                              >
                                Unpublish
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleProjectPublish(proj, 'PUBLISHED')}
                                className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 rounded-lg text-xs font-medium transition-colors"
                              >
                                Publish
                              </button>
                            )}

                            {proj.publishState === 'ARCHIVED' ? (
                              <button
                                onClick={() => handleToggleProjectPublish(proj, 'DRAFT')}
                                title="Pulihkan dari Arsip"
                                className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleProjectPublish(proj, 'ARCHIVED')}
                                title="Arsipkan Proyek"
                                className="p-1 bg-stone-900 hover:bg-stone-800 text-stone-500 hover:text-stone-300 rounded-lg transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1.5: PROGRESS & ROADMAP MANAGEMENT (STAGE 5) */}
      {/* ========================================================================= */}
      {activeTab === 'PROGRESS' && (
        <AdminProgressManager adminEmail={adminEmail || 'zweifeel@gmail.com'} />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEDIA MANAGEMENT (Pustaka Media & Drive Storage) */}
      {/* ========================================================================= */}
      {activeTab === 'MEDIA' && (
        <div>
          {/* Controls Bar: Filters, Search & Upload */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 bg-stone-900 p-4 border border-stone-800 rounded-2xl">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama / ID media..."
                  value={mediaSearchQuery}
                  onChange={(e) => setMediaSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              {/* Filter Proyek */}
              <select
                value={selectedProjectFilter}
                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="*">Semua Proyek</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
                <option value="proj_global">Aset Global (proj_global)</option>
              </select>

              {/* Filter Visibilitas */}
              <select
                value={selectedVisibilityFilter}
                onChange={(e) => setSelectedVisibilityFilter(e.target.value)}
                className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>

              {/* Filter Role */}
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-hidden focus:border-cyan-500"
              >
                <option value="ALL">Semua Role</option>
                <option value="GALLERY">GALLERY</option>
                <option value="FEATURE_GRAPHIC">FEATURE_GRAPHIC</option>
                <option value="ICON">ICON</option>
                <option value="SCREENSHOT">SCREENSHOT</option>
              </select>
            </div>

            <button
              onClick={() => {
                setMediaUploadProject(projects[0]?.id || 'proj_global');
                setMediaUploadRole('GALLERY');
                setMediaUploadVisibility('DRAFT');
                setMediaUploadFile(null);
                setMediaPreviewUrl(null);
                setMediaUploadModalOpen(true);
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition-colors shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah Media Baru</span>
            </button>
          </div>

          {/* Media Grid or Empty State */}
          {loadingData ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
              <p className="text-xs">Memuat daftar media dari storage Google Drive...</p>
            </div>
          ) : filteredMediaList.length === 0 ? (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center text-stone-400">
              <Image className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-300">Tidak Ada Aset Media Ditemukan</p>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                Tidak ada media yang cocok dengan filter yang dipilih. Silakan ubah filter atau unggah media baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMediaList.map((media) => (
                <div
                  key={media.mediaId}
                  className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg flex flex-col hover:border-stone-700 transition-colors"
                >
                  {/* Thumbnail Preview Area (Authenticated Admin Endpoint) */}
                  <div className="relative aspect-video bg-stone-950 border-b border-stone-800/80 flex items-center justify-center overflow-hidden group">
                    <img
                      src={`/api/admin/media/${media.mediaId}`}
                      alt={media.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23555" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      }}
                    />

                    {/* Quick Preview Overlay Button */}
                    <button
                      onClick={() => setPreviewMediaModal(media)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-medium transition-opacity"
                    >
                      <Eye className="w-4 h-4 text-cyan-300" />
                      <span>Lihat Rincian</span>
                    </button>

                    <div className="absolute top-2 left-2 flex gap-1.5 pointer-events-none">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-950/80 border border-stone-800 text-cyan-300 backdrop-blur-xs">
                        {media.role}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 pointer-events-none">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold backdrop-blur-xs ${
                          media.visibility === 'PUBLISHED'
                            ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300'
                            : media.visibility === 'ARCHIVED'
                            ? 'bg-stone-950/80 border border-stone-800 text-stone-500'
                            : 'bg-amber-950/80 border border-amber-800/80 text-amber-300'
                        }`}
                      >
                        {media.visibility}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between text-xs space-y-2">
                    <div>
                      <p className="font-semibold text-stone-200 truncate" title={media.originalName}>
                        {media.originalName}
                      </p>
                      <p className="text-[11px] font-mono text-stone-400 mt-0.5 truncate">
                        Proyek: <span className="text-cyan-400">{media.projectId}</span>
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono mt-2">
                        <span>{(media.sizeBytes / 1024).toFixed(1)} KB</span>
                        <span>{media.mimeType.split('/')[1]?.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-stone-800 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-1.5">
                        {/* Status Toggle Button */}
                        {media.visibility === 'PUBLISHED' ? (
                          <button
                            onClick={() => handleToggleMediaVisibility(media, 'DRAFT')}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 transition-colors"
                          >
                            Tarik (Draft)
                          </button>
                        ) : media.visibility === 'DRAFT' ? (
                          <button
                            onClick={() => handleToggleMediaVisibility(media, 'PUBLISHED')}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 transition-colors"
                          >
                            Publikasikan
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleMediaVisibility(media, 'DRAFT')}
                            className="px-2 py-1 rounded-lg text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
                          >
                            Pulihkan ke Draft
                          </button>
                        )}

                        {/* Replace Button */}
                        <button
                          onClick={() => {
                            setReplacingMedia(media);
                            setReplaceFile(null);
                          }}
                          title="Ganti Berkas (Replace)"
                          className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Ganti
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-stone-850">
                        {/* Copy Public URL */}
                        <button
                          onClick={() => {
                            const publicUrl = `/api/media/${media.mediaId}`;
                            navigator.clipboard.writeText(publicUrl);
                            showMessage('URL media disalin ke clipboard!', 'success');
                          }}
                          title="Salin Public URL"
                          className="p-1.5 bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 rounded-lg transition-colors flex items-center gap-1 text-[10px]"
                        >
                          <Copy className="w-3 h-3" />
                          <span>URL</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {/* Soft Archive */}
                          {media.visibility !== 'ARCHIVED' && (
                            <button
                              onClick={() => handleDeleteMedia(media.mediaId, false)}
                              title="Arsipkan Media (Soft-delete)"
                              className="p-1.5 bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 rounded-lg transition-colors"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Permanent Delete */}
                          <button
                            onClick={() => handleDeleteMedia(media.mediaId, true)}
                            disabled={deletingMediaId === media.mediaId}
                            title="Hapus Permanen dari Google Drive"
                            className="p-1.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-800/50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between">
            <h3 className="text-xs font-mono text-stone-300 uppercase">Jejak Aktivitas Terakhir (Maksimal 50)</h3>
            <span className="text-[11px] text-stone-500">Tersimpan di sheet CMS_AuditLogs</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider font-mono border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4">Client IP</th>
                  <th className="py-3 px-4">Rincian JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-500">
                      Belum ada riwayat aktivitas tercatat di CMS_AuditLogs.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-stone-850/50 transition-colors">
                      <td className="py-2.5 px-4 text-stone-400">{log.timestamp}</td>
                      <td className="py-2.5 px-4 font-semibold text-cyan-400">{log.action}</td>
                      <td className="py-2.5 px-4 text-stone-300">{log.targetId}</td>
                      <td className="py-2.5 px-4 text-stone-400">{log.adminEmail}</td>
                      <td className="py-2.5 px-4 text-stone-500">{log.clientIp}</td>
                      <td className="py-2.5 px-4 text-stone-400 max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WEBSITE SETTINGS & BRANDING MANAGER (Milestone 6.6) */}
      {/* ========================================================================= */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-cyan-400" />
                  <span>Pengaturan Website</span>
                </h2>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    siteSettings.status === 'published'
                      ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                      : 'bg-amber-950/80 border-amber-800 text-amber-300'
                  }`}
                >
                  {siteSettings.status === 'published' ? 'PUBLISHED' : 'DRAFT'} (v{siteSettings.version || 1})
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Kelola informasi beranda, profil developer, menu navigasi, footer, dan metadata SEO.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSettingsPreview(!settingsPreview)}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>{settingsPreview ? 'Keluar Pratinjau' : 'Pratinjau Langsung'}</span>
              </button>
              <button
                type="button"
                disabled={settingsSaving}
                onClick={() => handleSaveSettings(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4 text-cyan-400" />
                <span>{settingsSaving ? 'Menyimpan...' : 'Simpan Draft'}</span>
              </button>
              <button
                type="button"
                disabled={settingsSaving}
                onClick={() => handleSaveSettings(true)}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{settingsSaving ? 'Mempublikasikan...' : 'Publikasikan ke Website'}</span>
              </button>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap border-b border-stone-800 gap-2 pb-2">
            {[
              { id: 'BRANDING', label: 'Branding & Kontak', icon: Sparkles },
              { id: 'HOMEPAGE', label: 'Beranda / Hero', icon: Globe },
              { id: 'ABOUT', label: 'Tentang Developer', icon: Sliders },
              { id: 'NAVIGATION', label: 'Menu Navigasi', icon: Code },
              { id: 'FOOTER', label: 'Footer & Disclaimer', icon: FileText },
              { id: 'SEO', label: 'SEO & Metadata', icon: Tag },
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSettingsSubTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                    settingsSubTab === tab.id
                      ? 'bg-stone-800 text-cyan-400 border border-stone-700'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Content or Preview */}
          {settingsPreview ? (
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-8 space-y-6">
              <div className="border-b border-stone-800 pb-4 flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Pratinjau Beranda Publik</span>
                <span className="text-xs text-stone-500">Mencerminkan nilai draft saat ini</span>
              </div>
              <div className="max-w-2xl space-y-4">
                <span className="inline-block px-3 py-1 bg-stone-900 border border-stone-800 text-xs text-stone-300 rounded-full font-mono">
                  {siteSettings.homepage.badgeText}
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                  {siteSettings.homepage.headline}
                </h1>
                <p className="text-stone-300 text-sm leading-relaxed">
                  {siteSettings.homepage.subheadline}
                </p>
                <div className="flex gap-3 pt-2">
                  <span className="px-5 py-2.5 bg-stone-100 text-stone-950 rounded-xl font-bold text-xs">
                    {siteSettings.homepage.primaryCtaText} &rarr;
                  </span>
                  <span className="px-5 py-2.5 bg-stone-900 border border-stone-800 text-stone-200 rounded-xl font-medium text-xs">
                    {siteSettings.homepage.secondaryCtaText}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
              {/* SUBTAB: BRANDING */}
              {settingsSubTab === 'BRANDING' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Nama Studio / Pengembang</label>
                    <input
                      type="text"
                      value={siteSettings.branding.studioName}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          branding: { ...siteSettings.branding, studioName: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Tagline Studio</label>
                    <input
                      type="text"
                      value={siteSettings.branding.tagline}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          branding: { ...siteSettings.branding, tagline: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Email Kontak / Dukungan Resmi</label>
                    <input
                      type="email"
                      value={siteSettings.branding.supportEmail}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          branding: { ...siteSettings.branding, supportEmail: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">URL Logo Studio (Opsional)</label>
                    <input
                      type="text"
                      value={siteSettings.branding.logoUrl || ''}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          branding: { ...siteSettings.branding, logoUrl: e.target.value },
                        })
                      }
                      placeholder="/assets/branding/sleepykoala-logo.png"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500 font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* SUBTAB: HOMEPAGE */}
              {settingsSubTab === 'HOMEPAGE' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Badge Hero Pill</label>
                    <input
                      type="text"
                      value={siteSettings.homepage.badgeText}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          homepage: { ...siteSettings.homepage, badgeText: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Headline Utama (Judul Besar)</label>
                    <input
                      type="text"
                      value={siteSettings.homepage.headline}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          homepage: { ...siteSettings.homepage, headline: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Subheadline (Deskripsi Beranda)</label>
                    <textarea
                      rows={3}
                      value={siteSettings.homepage.subheadline}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          homepage: { ...siteSettings.homepage, subheadline: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500 leading-relaxed"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-stone-300 mb-1">Teks Tombol CTA Utama</label>
                      <input
                        type="text"
                        value={siteSettings.homepage.primaryCtaText}
                        onChange={(e) =>
                          setSiteSettings({
                            ...siteSettings,
                            homepage: { ...siteSettings.homepage, primaryCtaText: e.target.value },
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-stone-300 mb-1">Tautan Tombol CTA Utama</label>
                      <input
                        type="text"
                        value={siteSettings.homepage.primaryCtaLink}
                        onChange={(e) =>
                          setSiteSettings({
                            ...siteSettings,
                            homepage: { ...siteSettings.homepage, primaryCtaLink: e.target.value },
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500 font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-stone-300 mb-1">Teks Tombol CTA Kedua</label>
                      <input
                        type="text"
                        value={siteSettings.homepage.secondaryCtaText}
                        onChange={(e) =>
                          setSiteSettings({
                            ...siteSettings,
                            homepage: { ...siteSettings.homepage, secondaryCtaText: e.target.value },
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-stone-300 mb-1">Tautan Tombol CTA Kedua</label>
                      <input
                        type="text"
                        value={siteSettings.homepage.secondaryCtaLink}
                        onChange={(e) =>
                          setSiteSettings({
                            ...siteSettings,
                            homepage: { ...siteSettings.homepage, secondaryCtaLink: e.target.value },
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB: ABOUT */}
              {settingsSubTab === 'ABOUT' && (
                <div className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-stone-300 mb-1">Nama Developer</label>
                      <input
                        type="text"
                        value={siteSettings.about.developerName}
                        onChange={(e) =>
                          setSiteSettings({
                            ...siteSettings,
                            about: { ...siteSettings.about, developerName: e.target.value },
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-stone-300 mb-1">Peran / Role</label>
                      <input
                        type="text"
                        value={siteSettings.about.developerRole}
                        onChange={(e) =>
                          setSiteSettings({
                            ...siteSettings,
                            about: { ...siteSettings.about, developerRole: e.target.value },
                          })
                        }
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Biografi (Satu paragraf per baris)</label>
                    <textarea
                      rows={4}
                      value={siteSettings.about.bioParagraphs.join('\n\n')}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          about: {
                            ...siteSettings.about,
                            bioParagraphs: e.target.value.split('\n\n').filter((p) => p.trim().length > 0),
                          },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500 leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Deskripsi Filosofi Pengembangan</label>
                    <textarea
                      rows={2}
                      value={siteSettings.about.philosophyDescription}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          about: { ...siteSettings.about, philosophyDescription: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Catatan Kontak & Kolaborasi</label>
                    <textarea
                      rows={2}
                      value={siteSettings.about.contactNote}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          about: { ...siteSettings.about, contactNote: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* SUBTAB: NAVIGATION */}
              {settingsSubTab === 'NAVIGATION' && (
                <div className="space-y-4 max-w-2xl">
                  <p className="text-xs text-stone-400">
                    Atur menu navigasi yang tampil pada header utama website:
                  </p>
                  <div className="space-y-2">
                    {siteSettings.navigation.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center gap-2 p-3 bg-stone-950 border border-stone-800 rounded-xl"
                      >
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const newNav = [...siteSettings.navigation];
                            newNav[idx].label = e.target.value;
                            setSiteSettings({ ...siteSettings, navigation: newNav });
                          }}
                          placeholder="Label Menu"
                          className="w-1/3 bg-stone-900 border border-stone-750 rounded-lg px-2.5 py-1.5 text-xs text-stone-100"
                        />
                        <input
                          type="text"
                          value={item.path}
                          onChange={(e) => {
                            const newNav = [...siteSettings.navigation];
                            newNav[idx].path = e.target.value;
                            setSiteSettings({ ...siteSettings, navigation: newNav });
                          }}
                          placeholder="/path atau https://"
                          className="flex-1 bg-stone-900 border border-stone-750 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newNav = siteSettings.navigation.filter((_, i) => i !== idx);
                            setSiteSettings({ ...siteSettings, navigation: newNav });
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newNav = [
                        ...siteSettings.navigation,
                        { id: `nav-${Date.now()}`, label: 'Menu Baru', path: '/' },
                      ];
                      setSiteSettings({ ...siteSettings, navigation: newNav });
                    }}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Tautan Menu
                  </button>
                </div>
              )}

              {/* SUBTAB: FOOTER */}
              {settingsSubTab === 'FOOTER' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Ringkasan Bio Footer</label>
                    <textarea
                      rows={3}
                      value={siteSettings.footer.bioSummary}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          footer: { ...siteSettings.footer, bioSummary: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500 leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Teks Hak Cipta (Copyright)</label>
                    <input
                      type="text"
                      value={siteSettings.footer.copyrightText}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          footer: { ...siteSettings.footer, copyrightText: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="showFeedback"
                      checked={siteSettings.footer.showFeedbackLink !== false}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          footer: { ...siteSettings.footer, showFeedbackLink: e.target.checked },
                        })
                      }
                      className="rounded border-stone-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <label htmlFor="showFeedback" className="text-xs text-stone-300">
                      Tampilkan tautan Formulir Feedback & Pelaporan Bug di Footer
                    </label>
                  </div>
                </div>
              )}

              {/* SUBTAB: SEO */}
              {settingsSubTab === 'SEO' && (
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Meta Title Default</label>
                    <input
                      type="text"
                      value={siteSettings.seo.metaTitle}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          seo: { ...siteSettings.seo, metaTitle: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Meta Description</label>
                    <textarea
                      rows={3}
                      value={siteSettings.seo.metaDescription}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          seo: { ...siteSettings.seo, metaDescription: e.target.value },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500 leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-stone-300 mb-1">Keywords (Pisahkan dengan koma)</label>
                    <input
                      type="text"
                      value={siteSettings.seo.metaKeywords.join(', ')}
                      onChange={(e) =>
                        setSiteSettings({
                          ...siteSettings,
                          seo: {
                            ...siteSettings.seo,
                            metaKeywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          },
                        })
                      }
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-stone-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GOOGLE PLAY CONSOLE COMPLIANCE MANAGER (Milestone 6.6 & Tahap 9) */}
      {/* ========================================================================= */}
      {activeTab === 'COMPLIANCE' && (
        <div className="space-y-6">
          {/* 14-Day Google Play Closed Testing Tracker for Mobile Kasir */}
          <ClosedTestingMonitor />

          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>Privacy Policy & Delete Account (Google Play Compliance)</span>
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Kelola dokumen Kebijakan Privasi (Privacy Policy) dan Panduan Penghapusan Akun mandatori untuk seluruh judul aplikasi/game.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-400 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800">
                Total Proyek: {projects.length}
              </span>
            </div>
          </div>

          {/* Compliance List Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider font-mono border-b border-stone-800">
                  <tr>
                    <th className="py-3.5 px-4">Proyek</th>
                    <th className="py-3.5 px-4">Kebijakan Privasi</th>
                    <th className="py-3.5 px-4">Hapus Akun & Data</th>
                    <th className="py-3.5 px-4">URL Publik</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {projects.map((proj) => {
                    const comp = complianceList.find(
                      (c) => c.projectId === proj.id || c.projectSlug === proj.slug
                    ) || {
                      projectId: proj.id,
                      projectSlug: proj.slug,
                      projectName: proj.name,
                      privacyPolicy: generateDefaultPrivacyPolicy(proj.name, proj.slug),
                      deleteAccount: generateDefaultDeleteAccount(proj.name, proj.slug),
                      updatedAt: proj.updatedAt || '2026-11-02T00:00:00.000Z',
                    };

                    const privStatus = comp.privacyPolicy?.status || 'draft';
                    const delStatus = comp.deleteAccount?.status || 'draft';

                    return (
                      <tr key={proj.id} className="hover:bg-stone-850/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <ProjectIcon
                              src={proj.icon || proj.iconUrl || ''}
                              alt={proj.name}
                              name={proj.name}
                              category={proj.category}
                              className="w-9 h-9 rounded-lg border border-stone-800 shrink-0"
                            />
                            <div>
                              <p className="font-semibold text-stone-100 text-sm">{proj.name}</p>
                              <span className="font-mono text-[10px] text-stone-500">/projects/{proj.slug}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              privStatus === 'published'
                                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                                : 'bg-amber-950/80 border-amber-800 text-amber-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                privStatus === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            {privStatus === 'published' ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                              delStatus === 'published'
                                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                                : 'bg-amber-950/80 border-amber-800 text-amber-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                delStatus === 'published' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            {delStatus === 'published' ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 text-[11px] font-mono">
                            <a
                              href={`/projects/${proj.slug}/privacy`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <span>/privacy</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <a
                              href={`/projects/${proj.slug}/delete-account`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-rose-400 hover:text-rose-300 flex items-center gap-1"
                            >
                              <span>/delete-account</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenComplianceModal(comp)}
                            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-stone-700"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Kelola Dokumen</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROJECT EDITOR & PREVIEW (Section 4.C & 4.D) */}
      {/* ========================================================================= */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between sticky top-0 bg-stone-900 z-10">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>{previewMode ? 'Pratinjau Halaman Proyek' : 'Kelola Metadata Proyek'}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{previewMode ? 'Buka Editor Form' : 'Pratinjau Tampilan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-2.5 py-1.5 text-stone-400 hover:text-stone-200 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {previewMode ? (
              /* PREVIEW TAB (Mencerminkan Halaman Publik) */
              <div className="p-6 space-y-6">
                <div className="p-6 bg-stone-950 border border-stone-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 rounded-lg">
                      {editingProject.category || 'APPLICATION'}
                    </span>
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">
                      {editingProject.status || 'WORK_IN_PROGRESS'}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <ProjectIcon
                      src={editingProject.icon || editingProject.iconUrl || ''}
                      alt={`Logo ${editingProject.name || 'Proyek'}`}
                      name={editingProject.name || 'Proyek'}
                      category={editingProject.category || 'APPLICATION'}
                      className="w-16 h-16 rounded-xl border border-stone-800 shadow-md shrink-0"
                    />
                    <div>
                      <h2 className="text-2xl font-extrabold text-stone-100">{editingProject.name || 'Nama Proyek'}</h2>
                      {editingProject.tagline && (
                        <p className="text-sm text-cyan-400/90 font-medium mt-1">{editingProject.tagline}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-stone-300 leading-relaxed">{editingProject.shortDescription}</p>

                  {/* Screenshots Preview in Preview Tab */}
                  <div className="pt-4 border-t border-stone-850 space-y-2">
                    <h3 className="text-xs font-mono uppercase text-stone-400">
                      Galeri Tangkapan Layar ({Array.isArray(editingProject.screenshots) ? editingProject.screenshots.length : 0})
                    </h3>
                    {Array.isArray(editingProject.screenshots) && editingProject.screenshots.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {editingProject.screenshots.map((shot, idx) => (
                          <ScreenshotImage
                            key={idx}
                            src={shot}
                            alt={`Pratinjau Layar #${idx + 1}`}
                            index={idx}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <ScreenshotImage src="" alt="Pratinjau Layar Segera Hadir" index={0} />
                        <ScreenshotImage src="" alt="Pratinjau Layar Segera Hadir" index={1} />
                        <ScreenshotImage src="" alt="Pratinjau Layar Segera Hadir" index={2} />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-850">
                    <h3 className="text-xs font-mono uppercase text-stone-400 mb-2">Deskripsi Lengkap</h3>
                    <p className="text-xs text-stone-400 whitespace-pre-line leading-relaxed">
                      {editingProject.fullDescription || 'Belum ada deskripsi lengkap.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-850 flex flex-wrap items-center justify-between text-xs text-stone-400 gap-2">
                    <span>Versi: <strong className="text-stone-200">{editingProject.version || '0.1.0'}</strong></span>
                    <span>Status Publikasi: <strong className="text-amber-400">{editingProject.publishState || 'DRAFT'}</strong></span>
                    <span>Perekrutan: <strong className={editingProject.registrationOpen ? 'text-emerald-400' : 'text-stone-500'}>
                      {editingProject.registrationOpen ? 'Terbuka' : 'Ditutup'}
                    </strong></span>
                  </div>
                </div>
              </div>
            ) : (
              /* EDITOR FORM */
              <form onSubmit={handleSaveProject} className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-stone-300 mb-1">ID Proyek (Kunci Unik)</label>
                    <input
                      type="text"
                      value={editingProject.id || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, id: e.target.value })}
                      required
                      placeholder="proj_custom_id"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-300 mb-1">Slug URL</label>
                    <input
                      type="text"
                      value={editingProject.slug || ''}
                      onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                      required
                      placeholder="nama-proyek-slug"
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Nama Proyek</label>
                  <input
                    type="text"
                    value={editingProject.name || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                    required
                    placeholder="Contoh: Mobile Kasir Pos"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-medium text-stone-300 mb-1">Kategori</label>
                    <select
                      value={editingProject.category || 'APPLICATION'}
                      onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value as any })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                    >
                      <option value="APPLICATION">APPLICATION</option>
                      <option value="GAME">GAME</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-stone-300 mb-1">Status Siklus Dev</label>
                    <select
                      value={editingProject.status || 'WORK_IN_PROGRESS'}
                      onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                    >
                      <option value="READY_FOR_RELEASE">READY_FOR_RELEASE</option>
                      <option value="RELEASED">RELEASED</option>
                      <option value="PRE_REGISTRATION">PRE_REGISTRATION</option>
                      <option value="CLOSED_TESTING">CLOSED_TESTING</option>
                      <option value="INTERNAL_TESTING">INTERNAL_TESTING</option>
                      <option value="WORK_IN_PROGRESS">WORK_IN_PROGRESS</option>
                      <option value="COMING_SOON">COMING_SOON</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-stone-300 mb-1">Status Publikasi CMS</label>
                    <select
                      value={editingProject.publishState || 'DRAFT'}
                      onChange={(e) => setEditingProject({ ...editingProject, publishState: e.target.value as any })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* SECTION: LOGO PROYEK (Milestone 6.5.6) */}
                {/* ================================================================= */}
                <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-stone-200 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Logo Utama Proyek</span>
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Ikon visual utama untuk kartu katalog dan header detail (Format: WebP, PNG, JPEG. Maks 2.0 MB).
                      </p>
                    </div>
                    {logoUploading && (
                      <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Mengunggah...</span>
                      </span>
                    )}
                  </div>

                  {/* Hidden File Input for Logo */}
                  <input
                    type="file"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/webp,image/png,image/jpeg"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                    {/* Logo Preview Area */}
                    <div className="flex items-center gap-3">
                      <ProjectIcon
                        src={editingProject.icon || editingProject.iconUrl || ''}
                        alt={`Logo ${editingProject.name || 'Proyek'}`}
                        name={editingProject.name || 'Proyek'}
                        category={editingProject.category || 'APPLICATION'}
                        className="w-16 h-16 rounded-xl border border-stone-800 shadow-md shrink-0"
                      />
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs font-medium text-stone-200">
                          {editingProject.icon || editingProject.iconUrl ? 'Logo Kustom Aktif' : 'Ikon Bawaan (Default)'}
                        </p>
                        <p className="text-[11px] font-mono text-stone-500 truncate max-w-[260px]">
                          {editingProject.icon || editingProject.iconUrl || 'Belum ada berkas logo khusus'}
                        </p>
                      </div>
                    </div>

                    {/* Logo Action Controls */}
                    <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                      <button
                        type="button"
                        disabled={logoUploading}
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/60 text-cyan-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{editingProject.icon || editingProject.iconUrl ? 'Ganti Logo' : 'Unggah Logo'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={logoUploading}
                        onClick={() => {
                          setMediaPickerFilter(editingProject.id || '*');
                          setMediaPickerTarget({ type: 'LOGO' });
                          setMediaPickerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Image className="w-3.5 h-3.5 text-stone-400" />
                        <span>Pilih dari Media Library</span>
                      </button>

                      {(editingProject.icon || editingProject.iconUrl) && (
                        <button
                          type="button"
                          disabled={logoUploading}
                          onClick={handleRemoveLogo}
                          className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Hapus Logo Kustom"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* SECTION: GALERI PREVIEW / SCREENSHOTS (Milestone 6.5.6) */}
                {/* ================================================================= */}
                <div className="p-4 bg-stone-950/80 border border-stone-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-stone-200 flex items-center gap-2">
                        <Image className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          Galeri Preview / Tangkapan Layar ({Array.isArray(editingProject.screenshots) ? editingProject.screenshots.length : 0} / 8)
                        </span>
                      </h4>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Tangkapan layar untuk showcase antarmuka dan gameplay di halaman detail publik. Maks 8 gambar, maks 2.0 MB per berkas.
                      </p>
                    </div>
                    {galleryUploading && (
                      <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Mengunggah...</span>
                      </span>
                    )}
                  </div>

                  {/* Hidden Inputs for Gallery */}
                  <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={handleGalleryUpload}
                    multiple
                    accept="image/webp,image/png,image/jpeg"
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={replaceScreenshotInputRef}
                    onChange={handleReplaceScreenshotSelect}
                    accept="image/webp,image/png,image/jpeg"
                    className="hidden"
                  />

                  {/* Thumbnails Grid */}
                  {Array.isArray(editingProject.screenshots) && editingProject.screenshots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {editingProject.screenshots.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className="group relative bg-stone-900 border border-stone-800 rounded-xl overflow-hidden flex flex-col justify-between shadow-xs"
                        >
                          {/* Image Aspect Box */}
                          <div className="aspect-16/9 w-full bg-black/40 overflow-hidden relative">
                            <img
                              src={url}
                              alt={`Tangkapan layar #${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/75 border border-stone-700 text-stone-300 font-mono text-[10px] rounded font-bold backdrop-blur-xs">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Control Action Bar */}
                          <div className="p-1.5 bg-stone-950 border-t border-stone-850 flex items-center justify-between gap-1">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={idx === 0 || galleryUploading}
                                onClick={() => handleMoveScreenshot(idx, 'left')}
                                className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                                title="Pindahkan ke Kiri"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === editingProject.screenshots!.length - 1 || galleryUploading}
                                onClick={() => handleMoveScreenshot(idx, 'right')}
                                className="p-1 text-stone-400 hover:text-stone-100 disabled:opacity-20 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                                title="Pindahkan ke Kanan"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                disabled={galleryUploading}
                                onClick={() => {
                                  setReplaceTargetIndex(idx);
                                  replaceScreenshotInputRef.current?.click();
                                }}
                                className="p-1 text-cyan-400 hover:text-cyan-300 disabled:opacity-30 transition-colors cursor-pointer"
                                title="Ganti Gambar Ini"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={galleryUploading}
                                onClick={() => handleDeleteScreenshot(idx)}
                                className="p-1 text-rose-400 hover:text-rose-300 disabled:opacity-30 transition-colors cursor-pointer"
                                title="Hapus Gambar Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty Gallery State */
                    <div className="p-5 border border-dashed border-stone-800 rounded-xl bg-stone-900/40 text-center space-y-1.5">
                      <Image className="w-6 h-6 text-stone-600 mx-auto" />
                      <p className="text-xs font-medium text-stone-400">Belum ada gambar tangkapan layar di proyek ini.</p>
                      <p className="text-[11px] text-stone-500">
                        Halaman detail publik akan menampilkan 3 kartu placeholder default sampai Anda mengunggah gambar.
                      </p>
                    </div>
                  )}

                  {/* Gallery Action Controls */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-850">
                    <button
                      type="button"
                      disabled={galleryUploading || (editingProject.screenshots?.length || 0) >= 8}
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-800/60 text-cyan-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Tambah Gambar (Multi-upload)</span>
                    </button>

                    <button
                      type="button"
                      disabled={galleryUploading || (editingProject.screenshots?.length || 0) >= 8}
                      onClick={() => {
                        setMediaPickerFilter(editingProject.id || '*');
                        setMediaPickerTarget({ type: 'SCREENSHOT_ADD' });
                        setMediaPickerOpen(true);
                      }}
                      className="px-3 py-1.5 bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Image className="w-3.5 h-3.5 text-stone-400" />
                      <span>Pilih dari Media Library</span>
                    </button>

                    <span className="text-[11px] text-stone-500 ml-auto font-mono">
                      Maks: 8 berkas (Tersisa: {Math.max(0, 8 - (editingProject.screenshots?.length || 0))})
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={editingProject.tagline || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, tagline: e.target.value })}
                    placeholder="Satu kalimat ringkas pemikat"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Deskripsi Singkat</label>
                  <textarea
                    rows={2}
                    value={editingProject.shortDescription || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-300 mb-1">Deskripsi Lengkap</label>
                  <textarea
                    rows={4}
                    value={editingProject.fullDescription || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, fullDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-stone-300 mb-1">Versi</label>
                    <input
                      type="text"
                      value={editingProject.version || '0.1.0'}
                      onChange={(e) => setEditingProject({ ...editingProject, version: e.target.value })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-300 mb-1">Durasi Closed Testing (Hari)</label>
                    <input
                      type="number"
                      value={editingProject.testerRequirementDays || 14}
                      onChange={(e) => setEditingProject({ ...editingProject, testerRequirementDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2 border-t border-stone-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProject.registrationOpen === true}
                      onChange={(e) => setEditingProject({ ...editingProject, registrationOpen: e.target.checked })}
                      className="rounded-sm bg-stone-950 border-stone-800 text-cyan-600 focus:ring-0"
                    />
                    <span className="text-stone-300 font-medium">Buka Pendaftaran Closed Testing</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProject.featured === true}
                      onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                      className="rounded-sm bg-stone-950 border-stone-800 text-cyan-600 focus:ring-0"
                    />
                    <span className="text-stone-300 font-medium">Tampilkan di Beranda (Featured)</span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject({ ...editingProject, publishState: 'ARCHIVED' });
                    }}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-750 text-stone-400 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Tandai Arsip</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MEDIA LIBRARY PICKER (Milestone 6.5.6) */}
      {/* ========================================================================= */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <Image className="w-4 h-4 text-cyan-400" />
                <span>
                  {mediaPickerTarget?.type === 'LOGO'
                    ? 'Pilih Logo dari Pustaka Media'
                    : 'Pilih Gambar Pratinjau dari Pustaka Media'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMediaPickerOpen(false);
                  setMediaPickerTarget(null);
                }}
                className="px-2 py-1 text-stone-400 hover:text-stone-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter Proyek in Picker */}
            <div className="p-3 bg-stone-950 border-b border-stone-850 flex items-center justify-between gap-3 text-xs">
              <span className="text-stone-400">Filter Tampilan:</span>
              <select
                value={mediaPickerFilter}
                onChange={(e) => setMediaPickerFilter(e.target.value)}
                className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-lg text-stone-200 text-xs focus:outline-hidden focus:border-cyan-500"
              >
                <option value="*">Semua Media Terdaftar</option>
                {editingProject?.id && <option value={editingProject.id}>Proyek Saat Ini ({editingProject.id})</option>}
                <option value="proj_global">Aset Global (proj_global)</option>
              </select>
            </div>

            {/* Media Grid */}
            <div className="p-4 overflow-y-auto flex-1">
              {(() => {
                const available = mediaList.filter((m) => {
                  if (mediaPickerFilter === '*') return true;
                  return m.projectId === mediaPickerFilter;
                });

                if (available.length === 0) {
                  return (
                    <div className="py-12 text-center text-stone-500 space-y-2">
                      <Image className="w-8 h-8 mx-auto text-stone-600" />
                      <p className="text-xs">Tidak ada media yang cocok dalam pustaka.</p>
                      <p className="text-[11px] text-stone-600">Unggah berkas baru langsung melalui tombol unggah form.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {available.map((item) => (
                      <button
                        key={item.mediaId}
                        type="button"
                        onClick={() => handleSelectMediaFromPicker(item)}
                        className="group text-left bg-stone-950 border border-stone-800 hover:border-cyan-500/80 rounded-xl overflow-hidden p-2 transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="aspect-16/9 w-full bg-stone-900 rounded-lg overflow-hidden relative mb-2 flex items-center justify-center">
                          <img
                            src={`/api/media/${item.mediaId}`}
                            alt={item.originalName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 py-0.5 bg-black/75 rounded text-stone-300 font-bold backdrop-blur-xs">
                            {item.role}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-stone-200 truncate">{item.originalName}</p>
                        <p className="text-[10px] font-mono text-stone-500 mt-0.5">{item.mediaId}</p>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GOOGLE PLAY COMPLIANCE EDITOR (Milestone 6.6) */}
      {/* ========================================================================= */}
      {complianceModalOpen && selectedCompliance && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between sticky top-0 bg-stone-900 z-10">
              <div>
                <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Kepatuhan Play Console: {selectedCompliance.projectName}</span>
                </h3>
                <span className="text-xs font-mono text-stone-400">Slug: {selectedCompliance.projectSlug}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCompliancePreview(!compliancePreview)}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{compliancePreview ? 'Buka Editor Form' : 'Pratinjau'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setComplianceModalOpen(false)}
                  className="px-2.5 py-1.5 text-stone-400 hover:text-stone-200 text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-tab selection: Privacy vs Delete Account */}
            <div className="flex border-b border-stone-800 px-6 pt-4 gap-4 bg-stone-950/40">
              <button
                type="button"
                onClick={() => setComplianceSubTab('PRIVACY')}
                className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  complianceSubTab === 'PRIVACY'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Kebijakan Privasi (Privacy Policy)</span>
              </button>
              <button
                type="button"
                onClick={() => setComplianceSubTab('DELETE_ACCOUNT')}
                className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                  complianceSubTab === 'DELETE_ACCOUNT'
                    ? 'border-rose-400 text-rose-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Panduan Hapus Akun (Delete Account)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {complianceSubTab === 'PRIVACY' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-stone-950 p-4 rounded-xl border border-stone-850">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-stone-300">Status Publikasi:</span>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          selectedCompliance.privacyPolicy?.status === 'published'
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                            : 'bg-amber-950/80 border-amber-800 text-amber-300'
                        }`}
                      >
                        {selectedCompliance.privacyPolicy?.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadPrivacyTemplate}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-cyan-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-cyan-800/60"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Muat Template Standar Google Play</span>
                    </button>
                  </div>

                  {compliancePreview ? (
                    <div className="bg-stone-950 border border-stone-800 rounded-xl p-6 prose prose-invert max-w-none text-xs sm:text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">
                      {selectedCompliance.privacyPolicy?.content || 'Belum ada konten privasi.'}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-mono text-stone-300 mb-1">Ringkasan Kebijakan</label>
                        <textarea
                          rows={2}
                          value={selectedCompliance.privacyPolicy?.summary || ''}
                          onChange={(e) =>
                            setSelectedCompliance({
                              ...selectedCompliance,
                              privacyPolicy: {
                                ...selectedCompliance.privacyPolicy,
                                summary: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-hidden focus:border-cyan-500 leading-relaxed"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono text-stone-300 mb-1">Tanggal Efektif (YYYY-MM-DD)</label>
                          <input
                            type="text"
                            value={selectedCompliance.privacyPolicy?.effectiveDate || ''}
                            onChange={(e) =>
                              setSelectedCompliance({
                                ...selectedCompliance,
                                privacyPolicy: {
                                  ...selectedCompliance.privacyPolicy,
                                  effectiveDate: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-stone-300 mb-1">Email Kontak Privasi</label>
                          <input
                            type="email"
                            value={selectedCompliance.privacyPolicy?.contactEmail || ''}
                            onChange={(e) =>
                              setSelectedCompliance({
                                ...selectedCompliance,
                                privacyPolicy: {
                                  ...selectedCompliance.privacyPolicy,
                                  contactEmail: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-stone-300 mb-1">
                          Data yang Dikumpulkan (Satu item per baris)
                        </label>
                        <textarea
                          rows={3}
                          value={
                            Array.isArray(selectedCompliance.privacyPolicy?.dataCollected)
                              ? selectedCompliance.privacyPolicy.dataCollected.join('\n')
                              : ''
                          }
                          onChange={(e) =>
                            setSelectedCompliance({
                              ...selectedCompliance,
                              privacyPolicy: {
                                ...selectedCompliance.privacyPolicy,
                                dataCollected: e.target.value.split('\n').filter((s) => s.trim().length > 0),
                              },
                            })
                          }
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-stone-300 mb-1">
                          Layanan Pihak Ketiga (Satu item per baris)
                        </label>
                        <textarea
                          rows={3}
                          value={
                            Array.isArray(selectedCompliance.privacyPolicy?.thirdPartyServices)
                              ? selectedCompliance.privacyPolicy.thirdPartyServices.join('\n')
                              : ''
                          }
                          onChange={(e) =>
                            setSelectedCompliance({
                              ...selectedCompliance,
                              privacyPolicy: {
                                ...selectedCompliance.privacyPolicy,
                                thirdPartyServices: e.target.value.split('\n').filter((s) => s.trim().length > 0),
                              },
                            })
                          }
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-stone-300 mb-1">
                          Konten Lengkap Kebijakan Privasi (Markdown Didukung)
                        </label>
                        <textarea
                          rows={8}
                          value={selectedCompliance.privacyPolicy?.content || ''}
                          onChange={(e) =>
                            setSelectedCompliance({
                              ...selectedCompliance,
                              privacyPolicy: {
                                ...selectedCompliance.privacyPolicy,
                                content: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono text-stone-100 focus:outline-hidden focus:border-cyan-500 leading-relaxed"
                        />
                      </div>
                    </>
                  )}

                  {/* Privacy Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-800">
                    <div>
                      {selectedCompliance.privacyPolicy?.status === 'published' && (
                        <button
                          type="button"
                          disabled={complianceSaving}
                          onClick={() => handleSaveComplianceRecord('unpublish_privacy')}
                          className="px-3.5 py-2 bg-stone-800 hover:bg-rose-950 hover:text-rose-300 text-stone-300 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Tarik dari Publik (Jadikan Draft)
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={complianceSaving}
                        onClick={() => handleSaveComplianceRecord('save_draft')}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Simpan Draft
                      </button>
                      <button
                        type="button"
                        disabled={complianceSaving}
                        onClick={() => handleSaveComplianceRecord('publish_privacy')}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-stone-950 rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        Publikasikan Kebijakan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {complianceSubTab === 'DELETE_ACCOUNT' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-stone-950 p-4 rounded-xl border border-stone-850">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-stone-300">Status Publikasi:</span>
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                          selectedCompliance.deleteAccount?.status === 'published'
                            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                            : 'bg-amber-950/80 border-amber-800 text-amber-300'
                        }`}
                      >
                        {selectedCompliance.deleteAccount?.status === 'published' ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadDeleteAccountTemplate}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-rose-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-rose-800/60"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                      <span>Muat Template Standar Google Play</span>
                    </button>
                  </div>

                  {compliancePreview ? (
                    <div className="bg-stone-950 border border-stone-800 rounded-xl p-6 prose prose-invert max-w-none text-xs sm:text-sm text-stone-200 whitespace-pre-wrap leading-relaxed">
                      {selectedCompliance.deleteAccount?.content || 'Belum ada panduan penghapusan akun.'}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono text-stone-300 mb-1">Email Permintaan Penghapusan</label>
                          <input
                            type="email"
                            value={selectedCompliance.deleteAccount?.requestEmail || ''}
                            onChange={(e) =>
                              setSelectedCompliance({
                                ...selectedCompliance,
                                deleteAccount: {
                                  ...selectedCompliance.deleteAccount,
                                  requestEmail: e.target.value,
                                },
                              })
                            }
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono text-stone-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-stone-300 mb-1">Estimasi Waktu Penyelesaian</label>
                          <input
                            type="text"
                            value={selectedCompliance.deleteAccount?.turnaroundTime || ''}
                            onChange={(e) =>
                              setSelectedCompliance({
                                ...selectedCompliance,
                                deleteAccount: {
                                  ...selectedCompliance.deleteAccount,
                                  turnaroundTime: e.target.value,
                                },
                              })
                            }
                            placeholder="3-7 hari kerja"
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-stone-300 mb-1">Kebijakan Retensi Data</label>
                        <textarea
                          rows={2}
                          value={selectedCompliance.deleteAccount?.retentionPolicy || ''}
                          onChange={(e) =>
                            setSelectedCompliance({
                              ...selectedCompliance,
                              deleteAccount: {
                                ...selectedCompliance.deleteAccount,
                                retentionPolicy: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 leading-relaxed"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono text-stone-300 mb-1">
                            Data yang Dihapus Permanen (Satu per baris)
                          </label>
                          <textarea
                            rows={3}
                            value={
                              Array.isArray(selectedCompliance.deleteAccount?.dataDeletedList)
                                ? selectedCompliance.deleteAccount.dataDeletedList.join('\n')
                                : ''
                            }
                            onChange={(e) =>
                              setSelectedCompliance({
                                ...selectedCompliance,
                                deleteAccount: {
                                  ...selectedCompliance.deleteAccount,
                                  dataDeletedList: e.target.value.split('\n').filter((s) => s.trim().length > 0),
                                },
                              })
                            }
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono text-stone-300 mb-1">
                            Data yang Dipertahankan (Satu per baris)
                          </label>
                          <textarea
                            rows={3}
                            value={
                              Array.isArray(selectedCompliance.deleteAccount?.dataRetainedList)
                                ? selectedCompliance.deleteAccount.dataRetainedList.join('\n')
                                : ''
                            }
                            onChange={(e) =>
                              setSelectedCompliance({
                                ...selectedCompliance,
                                deleteAccount: {
                                  ...selectedCompliance.deleteAccount,
                                  dataRetainedList: e.target.value.split('\n').filter((s) => s.trim().length > 0),
                                },
                              })
                            }
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-stone-300 mb-1">
                          Isi Panduan Langkah Demi Langkah (Markdown Didukung)
                        </label>
                        <textarea
                          rows={8}
                          value={selectedCompliance.deleteAccount?.content || ''}
                          onChange={(e) =>
                            setSelectedCompliance({
                              ...selectedCompliance,
                              deleteAccount: {
                                ...selectedCompliance.deleteAccount,
                                content: e.target.value,
                              },
                            })
                          }
                          className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs font-mono text-stone-100 focus:outline-hidden focus:border-cyan-500 leading-relaxed"
                        />
                      </div>
                    </>
                  )}

                  {/* Delete Account Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-stone-800">
                    <div>
                      {selectedCompliance.deleteAccount?.status === 'published' && (
                        <button
                          type="button"
                          disabled={complianceSaving}
                          onClick={() => handleSaveComplianceRecord('unpublish_delete_account')}
                          className="px-3.5 py-2 bg-stone-800 hover:bg-rose-950 hover:text-rose-300 text-stone-300 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Tarik dari Publik (Jadikan Draft)
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={complianceSaving}
                        onClick={() => handleSaveComplianceRecord('save_draft')}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Simpan Draft
                      </button>
                      <button
                        type="button"
                        disabled={complianceSaving}
                        onClick={() => handleSaveComplianceRecord('publish_delete_account')}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                      >
                        Publikasikan Panduan
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MEDIA UPLOAD (Section 5) */}
      {/* ========================================================================= */}
      {mediaUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                <span>Unggah Media ke Storage CMS</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
                  setMediaPreviewUrl(null);
                  setMediaUploadFile(null);
                  setMediaUploadModalOpen(false);
                }}
                className="px-2.5 py-1.5 text-stone-400 hover:text-stone-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-300 mb-1">Target Proyek</label>
                <select
                  value={mediaUploadProject}
                  onChange={(e) => setMediaUploadProject(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                  <option value="proj_global">Aset Global (proj_global)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-stone-300 mb-1">Peran Aset (Role)</label>
                  <select
                    value={mediaUploadRole}
                    onChange={(e) => setMediaUploadRole(e.target.value as MediaRole)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                  >
                    <option value="GALLERY">GALLERY (Galeri Umum)</option>
                    <option value="FEATURE_GRAPHIC">FEATURE_GRAPHIC (Header)</option>
                    <option value="ICON">ICON (Ikon Aplikasi)</option>
                    <option value="SCREENSHOT">SCREENSHOT (Tangkapan Layar)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-300 mb-1">Status Visibilitas</label>
                  <select
                    value={mediaUploadVisibility}
                    onChange={(e) => setMediaUploadVisibility(e.target.value as MediaVisibility)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-200"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Pilih Berkas Gambar (Maks 2.0 MB)</label>
                <input
                  type="file"
                  accept="image/webp,image/png,image/jpeg"
                  onChange={handleFileSelect}
                  required
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
                />
                <p className="text-[11px] text-stone-500 mt-1">Format: WebP, PNG, JPEG. Validasi Magic Bytes & SHA-256 diterapkan.</p>
              </div>

              {/* Local File Preview Box */}
              {mediaPreviewUrl && (
                <div className="mt-3 p-2 bg-stone-950 border border-stone-800 rounded-xl">
                  <p className="text-[11px] text-stone-400 mb-1 font-mono">Pratinjau Berkas Lokal:</p>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <img src={mediaPreviewUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
                    setMediaPreviewUrl(null);
                    setMediaUploadFile(null);
                    setMediaUploadModalOpen(false);
                  }}
                  disabled={mediaUploading}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={mediaUploading || !mediaUploadFile}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {mediaUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Unggah Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REPLACE MEDIA */}
      {/* ========================================================================= */}
      {replacingMedia && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-stone-800 flex items-center justify-between bg-stone-900">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>Ganti Berkas Media</span>
              </h3>
              <button
                type="button"
                onClick={() => setReplacingMedia(null)}
                className="px-2.5 py-1.5 text-stone-400 hover:text-stone-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReplaceSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl space-y-1">
                <p className="text-stone-300 font-medium">{replacingMedia.originalName}</p>
                <p className="text-[11px] font-mono text-stone-500">ID: {replacingMedia.mediaId}</p>
                <p className="text-[11px] font-mono text-stone-500">Proyek: {replacingMedia.projectId} • Role: {replacingMedia.role}</p>
              </div>

              <div>
                <label className="block font-medium text-stone-300 mb-1">Pilih File Pengganti (Maks 2.0 MB)</label>
                <input
                  type="file"
                  accept="image/webp,image/png,image/jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setReplaceFile(e.target.files[0]);
                    }
                  }}
                  required
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-stone-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-cyan-950 file:text-cyan-300 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setReplacingMedia(null)}
                  disabled={replaceUploading}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={replaceUploading || !replaceFile}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {replaceUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunggah Pengganti...</span>
                    </>
                  ) : (
                    <span>Ganti Sekarang</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADMIN MEDIA PREVIEW & DETAILS (Section 5) */}
      {/* ========================================================================= */}
      {previewMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-900">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Rincian & Pratinjau Media</span>
              </h3>
              <button
                type="button"
                onClick={() => setPreviewMediaModal(null)}
                className="px-2.5 py-1 text-stone-400 hover:text-stone-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Full Image Preview via Admin Private Endpoint */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-stone-800">
                <img
                  src={`/api/admin/media/${previewMediaModal.mediaId}`}
                  alt={previewMediaModal.originalName}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-stone-950 p-4 border border-stone-800 rounded-xl font-mono">
                <div>
                  <span className="text-stone-500">ID Media:</span>
                  <p className="text-stone-200 font-bold">{previewMediaModal.mediaId}</p>
                </div>
                <div>
                  <span className="text-stone-500">Proyek Terhubung:</span>
                  <p className="text-cyan-400 font-bold">{previewMediaModal.projectId}</p>
                </div>
                <div>
                  <span className="text-stone-500">Tipe MIME:</span>
                  <p className="text-stone-300">{previewMediaModal.mimeType}</p>
                </div>
                <div>
                  <span className="text-stone-500">Ukuran Biner:</span>
                  <p className="text-stone-300">{(previewMediaModal.sizeBytes / 1024).toFixed(2)} KB ({previewMediaModal.sizeBytes} bytes)</p>
                </div>
                <div>
                  <span className="text-stone-500">Role Aset:</span>
                  <p className="text-stone-300">{previewMediaModal.role}</p>
                </div>
                <div>
                  <span className="text-stone-500">Status Visibilitas:</span>
                  <p className={previewMediaModal.visibility === 'PUBLISHED' ? 'text-emerald-400' : 'text-amber-400'}>
                    {previewMediaModal.visibility}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-stone-500">SHA-256 Checksum:</span>
                  <p className="text-stone-400 text-[10px] break-all">{previewMediaModal.sha256}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-stone-500">Waktu Unggah:</span>
                  <p className="text-stone-400 text-[11px]">{previewMediaModal.uploadedAt}</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-800 flex items-center justify-between bg-stone-950/60 text-xs">
              <span className="text-stone-500 font-mono">Proxy Endpoint: /api/media/{previewMediaModal.mediaId}</span>
              <button
                type="button"
                onClick={() => setPreviewMediaModal(null)}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
