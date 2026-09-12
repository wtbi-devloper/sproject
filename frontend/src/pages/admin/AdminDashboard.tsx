/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { setAdminToken } from '../../api/client';
import { 
  BookOpen, CalendarDays, /*Lightbulb,*/ Link2, 
  MessageSquare, Newspaper, Trophy, LogOut, 
  ExternalLink, Plus, Trash2, Edit2, CheckCircle2, XCircle,
  X, ImagePlus, Loader2, Search, Scissors, Settings,
  ArrowLeft, ArrowRight
} from 'lucide-react';
import OptimizedImage from '../../components/OptimizedImage';
import LocalImageCropModal from '../../components/crop/LocalImageCropModal';

// Configuration
export const GALLERY_MAX_IMAGES = 10;

function padBlurUrls(images: string[] | undefined, blurs: string[] | undefined): string[] {
  const len = images?.length ?? 0;
  const b = [...(blurs || [])];
  while (b.length < len) b.push('');
  if (b.length > len) return b.slice(0, len);
  return b;
}

function galleryLooksFullyOptimized(images: string[]): boolean {
  if (images.length === 0) return false;
  return images.every((u) => u.includes('/optimized/') && u.endsWith('/main.webp'));
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

/* ─── Types ─── */
interface TimelineEntry { _id: string; year: string; title: string; description: string; images?: string[]; imageBlurUrls?: string[]; }
interface LogItem { _id: string; date: string; title: string; body: string; tags: string[]; published: boolean; images: string[]; imageBlurUrls?: string[]; isOptimized?: boolean; }
interface Thought { _id: string; topic: string; title: string; summary: string; published: boolean; images: string[]; imageBlurUrls?: string[]; isOptimized?: boolean; }
interface PressItem { _id: string; outlet: string; outletLogo?: string; outletLogoBlurUrl?: string; mediaType?: string; title: string; year: string; url: string; images: string[]; imageBlurUrls?: string[]; isOptimized?: boolean; }
interface Achievement { _id: string; icon: string; title: string; description: string; year: string; images: string[]; imageBlurUrls?: string[]; isOptimized?: boolean; }
interface SocialLinks { whatsapp: string; instagram: string; linkedin: string; twitter: string; facebook: string; email: string; }
interface ContactEntry { _id: string; name: string; email: string; message: string; read: boolean; submittedAt: string; }

/* ─── Config ─── */
const SECTIONS = [
  { name: 'Story / Timeline', icon: BookOpen },
  { name: 'Daily Log', icon: CalendarDays },
  // { name: 'Thoughts', icon: Lightbulb },
  { name: 'Press', icon: Newspaper },
  // { name: 'Achievements', icon: Trophy },
  { name: 'Connect', icon: Link2 },
  { name: 'Contact Submissions', icon: MessageSquare },
  { name: 'Site Settings', icon: Settings },
] as const;

/* ─── Reusable Components ─── */

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--brown)]/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--warm-white)] p-8 shadow-2xl shadow-black/20 animate-in zoom-in-95 fade-in duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 rounded-full bg-white p-2 text-[var(--muted)] shadow-sm transition hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]">
          <X className="h-5 w-5" />
        </button>
        <h3 className="font-['Playfair_Display'] text-3xl font-bold tracking-tight text-[var(--brown)] mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function Panel({ title, description, children, action }: { title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-[var(--brown)]/10 bg-white shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
      <div className="border-b border-[var(--brown)]/5 bg-[var(--card-bg)] px-8 py-6 flex items-center justify-between">
        <div>
          <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--brown)]">{title}</h3>
          {description && <p className="text-sm font-medium text-[var(--muted)] mt-1.5">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; }) {
  return (
    <label className="block group">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--muted)] group-focus-within:text-[var(--gold)] transition-colors">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-2xl border-2 border-[var(--brown)]/10 bg-[var(--warm-white)] px-4 py-3.5 text-sm font-medium text-[var(--brown)] placeholder-[var(--muted)]/50 outline-none transition-all hover:border-[var(--brown)]/20 focus:border-[var(--gold)] focus:bg-white focus:ring-4 focus:ring-[var(--gold)]/10"
      />
    </label>
  );
}

function FormTextarea({ label, value, onChange, rows = 3, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; }) {
  return (
    <label className="block group">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[var(--muted)] group-focus-within:text-[var(--gold)] transition-colors">{label}</span>
      <textarea
        value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full resize-y rounded-2xl border-2 border-[var(--brown)]/10 bg-[var(--warm-white)] px-4 py-3.5 text-sm font-medium leading-relaxed text-[var(--brown)] placeholder-[var(--muted)]/50 outline-none transition-all hover:border-[var(--brown)]/20 focus:border-[var(--gold)] focus:bg-white focus:ring-4 focus:ring-[var(--gold)]/10"
      />
    </label>
  );
}

function ImageUploader({
  images,
  imageBlurUrls,
  onChange,
  folder: _folder,
  aspectRatio,
  maxImages,
  label = 'Attached Imagery',
}: {
  images: string[];
  imageBlurUrls?: string[];
  onChange: (imgs: string[], blurs: string[]) => void;
  folder: string;
  aspectRatio?: number;
  maxImages?: number;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blurs = imageBlurUrls ?? [];

  const uploadBlob = async (blob: Blob | File, filename: string): Promise<{ publicUrl: string; blurUrl: string }> => {
    const fd = new FormData();
    fd.append('file', blob, filename);
    const res = await apiClient.post('/upload/optimized', fd);
    const json = res.data as { success?: boolean; error?: string; data?: { publicUrl: string; blurUrl: string } };
    if (!json.success || !json.data) throw new Error(json.error || 'Upload failed');
    return json.data;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    if (maxImages === 1) {
      files = [files[0]];
    } else if (maxImages !== undefined) {
      const remaining = maxImages - images.length;
      files = files.slice(0, remaining);
    }

    if (!files.length) {
      e.target.value = '';
      return;
    }

    setSelectedFiles(files);
    setCropModalOpen(true);
    e.target.value = '';
  };

  const handleCropModalComplete = async (processed: { file: File | Blob; originalName: string }[]) => {
    setCropModalOpen(false);
    setSelectedFiles([]);
    setUploading(true);
    try {
      const newImages = maxImages === 1 ? [] : [...images];
      const newBlurs = maxImages === 1 ? [] : [...padBlurUrls(images, blurs)];
      for (const item of processed) {
        const result = await uploadBlob(item.file, item.originalName);
        newImages.push(result.publicUrl);
        newBlurs.push(result.blurUrl);
      }
      onChange(newImages, newBlurs);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload image(s).';
      alert(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCropModalClose = () => {
    setSelectedFiles([]);
    setCropModalOpen(false);
  };

  const removeImage = (index: number) => {
    onChange(
      images.filter((_, i) => i !== index),
      blurs.filter((_, i) => i !== index)
    );
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === images.length - 1) return;

    const newImages = [...images];
    const newBlurs = [...blurs];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;

    // Swap
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    [newBlurs[index], newBlurs[targetIndex]] = [newBlurs[targetIndex], newBlurs[index]];

    onChange(newImages, newBlurs);
  };

  return (
    <div className="block group">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</span>
        {uploading && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--gold)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading…
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {images.map((img, i) => (
          <div key={i} className="group relative aspect-video overflow-hidden rounded-2xl border-2 border-[var(--brown)]/10 bg-[var(--warm-white)]">
            <OptimizedImage
              src={img}
              blurSrc={blurs[i]}
              alt=""
              fit="cover"
              loading="lazy"
              imgClassName="h-full w-full"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-2 right-2 rounded-full bg-red-500/90 p-2 text-white shadow-lg hover:bg-red-600 transition hover:scale-110 active:scale-95 z-10"
              title="Delete Image"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Reorder Buttons */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/60 p-1 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 z-10">
                <button
                  type="button"
                  onClick={() => moveImage(i, 'left')}
                  disabled={i === 0}
                  className="rounded-full p-1.5 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Move Left"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(i, 'right')}
                  disabled={i === images.length - 1}
                  className="rounded-full p-1.5 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Move Right"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add image button */}
        {(!maxImages || maxImages === 1 || images.length < maxImages) && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--brown)]/20 bg-[var(--warm-white)]/50 text-[var(--brown)] transition-colors hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 hover:text-[var(--gold)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <ImagePlus className="h-7 w-7" />
                  <Scissors className="h-4 w-4 opacity-60" />
                </div>
                <span className="text-xs font-bold">
                  {maxImages === 1 && images.length > 0 ? "Replace Image" : "Upload & Crop"}
                </span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple={maxImages !== 1}
          accept="image/jpeg, image/png, image/webp, image/gif"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={uploading}
        />
      </div>

      {/* Crop Modal — processes all files at once */}
      {selectedFiles.length > 0 && (
        <LocalImageCropModal
          isOpen={cropModalOpen}
          onClose={handleCropModalClose}
          onComplete={handleCropModalComplete}
          title={`Crop Images (${selectedFiles.length})`}
          outputMimeType="image/webp"
          files={selectedFiles}
          aspectRatio={aspectRatio}
        />
      )}
    </div>
  );
}

function Btn({ onClick, children, variant = 'primary', disabled = false, icon: Icon }: { onClick?: () => void; children?: ReactNode; variant?: 'primary' | 'danger' | 'secondary' | 'ghost'; disabled?: boolean; icon?: React.ElementType }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold tracking-wide transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';
  const styles = {
    primary: 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-white shadow-lg shadow-[var(--gold)]/20 hover:shadow-xl hover:shadow-[var(--gold)]/30',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 ring-1 ring-inset ring-red-100 shadow-sm',
    secondary: 'bg-white text-[var(--brown)] ring-1 ring-inset ring-[var(--brown)]/20 hover:bg-[var(--warm-white)] hover:ring-[var(--brown)]/30 shadow-sm',
    ghost: 'text-[var(--muted)] hover:bg-[var(--card-bg)] hover:text-[var(--brown)] transition-colors',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>
      {Icon && <Icon className="h-4.5 w-4.5" />}
      {children}
    </button>
  );
}

function StatusBadge({ active, activeText = 'Published', inactiveText = 'Draft' }: { active: boolean; activeText?: string; inactiveText?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ring-1 ring-inset ${
      active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'
    }`}>
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {active ? activeText : inactiveText}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractData(res: any, fallback: any = []) { return res.data?.data ?? res.data ?? fallback; }

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [globalSearch, setGlobalSearch] = useState('');

  const sectionFromUrl = searchParams.get('section') || '';
  const activeSectionObj = SECTIONS.find(s => s.name === sectionFromUrl) || SECTIONS[0];
  const activeSection = activeSectionObj.name;

  useEffect(() => {
    // Prevent stale cross-section filters from making unrelated modules look empty.
    queueMicrotask(() => setGlobalSearch(''));
  }, [activeSection]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken(undefined);
    navigate('/admin/login');
  };

  const handleGlobalSearch = (value: string) => {
    setGlobalSearch(value);
  };

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans selection:bg-[var(--gold)]/20">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-full w-[280px] flex-col border-r border-[var(--brown)]/10 bg-white shadow-2xl shadow-black/5">
        <div className="px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Gold gradient background for admin logo */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] rounded-2xl blur-lg opacity-25"></div>
              <div className="relative bg-gradient-to-br from-[var(--gold)]/15 via-[var(--gold-light)]/10 to-[var(--gold)]/15 p-2.5 rounded-2xl border border-[var(--gold)]/25 backdrop-blur-sm">
                <img 
                  src="/sprojectlogo.png" 
                  alt="S Project Admin Logo" 
                  className="h-6 w-6 object-contain filter drop-shadow-sm"
                />
              </div>
            </div>
            <div>
              <h1 className="font-['Playfair_Display'] text-xl font-bold text-[var(--brown)] leading-none">Admin</h1>
              <p className="mt-1.5 text-[0.65rem] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">Command Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-4">
          <div className="mb-4 px-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]/50">Modules</div>
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.name;
            return (
              <button
                key={s.name}
                onClick={() => setSearchParams({ section: s.name })}
                className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-[var(--brown)] text-white shadow-xl shadow-[var(--brown)]/20' 
                    : 'text-[var(--muted)] hover:bg-[var(--warm-white)] hover:text-[var(--brown)] hover:shadow-sm'
                }`}
              >
                <s.icon className={`h-5 w-5 ${isActive ? 'text-[var(--gold-light)]' : 'text-[var(--muted)] group-hover:text-[var(--gold)]'} transition-colors`} />
                {s.name}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[var(--brown)]/5 p-4 space-y-2 bg-[var(--card-bg)]">
          <NavLink to="/" target="_blank" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--muted)] transition-all hover:bg-white hover:text-[var(--brown)]">
            <ExternalLink className="h-4 w-4" /> View Live Site
          </NavLink>
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-red-500 transition-all hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-4 w-4" /> Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="ml-[280px] flex-1 px-10 py-10 relative">
        <header className="mb-6 flex items-center justify-between border-b border-[var(--brown)]/5 pb-4">
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-3 font-['Playfair_Display'] text-3xl font-bold text-[var(--brown)]">
              <activeSectionObj.icon className="h-8 w-8 text-[var(--gold)]" />
              {activeSection}
            </h2>
            <p className="mt-1 text-xs font-medium tracking-wide text-[var(--muted)]">Management module</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Global search bar */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-[var(--muted)]" />
              </div>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                placeholder="Search all sections..."
                className="w-64 rounded-xl border border-[var(--brown)]/10 bg-[var(--warm-white)] py-2 pl-9 pr-3 text-sm font-medium text-[var(--brown)] placeholder-[var(--muted)]/50 outline-none transition-all hover:border-[var(--brown)]/20 focus:border-[var(--gold)] focus:bg-white focus:ring-2 focus:ring-[var(--gold)]/10"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold)] via-[var(--gold-light)] to-[var(--gold)] rounded-full blur-lg opacity-25"></div>
              <div className="relative bg-gradient-to-br from-[var(--gold)]/15 via-[var(--gold-light)]/10 to-[var(--gold)]/15 p-2 rounded-full border border-[var(--gold)]/25 backdrop-blur-sm">
                <img 
                  src="/sprojectlogo.png" 
                  alt="S Project Admin Logo" 
                  className="h-5 w-5 object-contain filter drop-shadow-sm"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          {activeSection === 'Story / Timeline' && <TimelineManager searchQuery={globalSearch} />}
          {activeSection === 'Daily Log' && <DailyLogManager searchQuery={globalSearch} />}
          {/* {activeSection === 'Thoughts' && <ThoughtsManager searchQuery={globalSearch} />} */}
          {activeSection === 'Press' && <PressManager searchQuery={globalSearch} />}
          {/* {activeSection === 'Achievements' && <AchievementsManager searchQuery={globalSearch} />} */}
          {activeSection === 'Connect' && <ConnectManager />}
          {activeSection === 'Contact Submissions' && <ContactsViewer searchQuery={globalSearch} />}
          {activeSection === 'Site Settings' && <SettingsManager />}
        </div>
      </main>
    </div>
  );
}

/* ─── MANAGERS ─── */

function TimelineManager({ searchQuery }: { searchQuery: string }) {
  const [items, setItems] = useState<TimelineEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ year: '', title: '', description: '', images: [] as string[], imageBlurUrls: [] as string[] });
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => { apiClient.get('/story/timeline', { params: { search: debouncedSearch } }).then((r) => setItems(extractData(r))).catch(() => {}); }, [debouncedSearch]);

  const openForm = (item?: TimelineEntry) => {
    if (item) {
      setEditingId(item._id);
      setForm({ year: item.year, title: item.title, description: item.description, images: item.images || [], imageBlurUrls: padBlurUrls(item.images, item.imageBlurUrls) });
    } else {
      setEditingId(null);
      setForm({ year: '', title: '', description: '', images: [], imageBlurUrls: [] });
    }
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.year || !form.title || !form.description) return;
    try {
      if (editingId) {
        const r = await apiClient.put(`/story/timeline/${editingId}`, form);
        setItems(items.map(i => i._id === editingId ? extractData(r) : i));
      } else {
        const r = await apiClient.post('/story/timeline', form);
        setItems([...items, extractData(r)]);
      }
      setModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const remove = async (id: string) => { try { await apiClient.delete(`/story/timeline/${id}`); setItems(items.filter((i) => i._id !== id)); } catch (err) { console.error(err); } };

  return (
    <>
      <Panel title="Historical Directory" description="Review and manage established timeline nodes." action={<Btn onClick={() => openForm()} icon={Plus}>Create Milestone</Btn>}>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="group flex items-start justify-between rounded-2xl border-2 border-[var(--brown)]/5 bg-[var(--warm-white)] p-6 transition-all hover:border-[var(--brown)]/10 hover:shadow-lg">
              <div className="flex gap-5">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white font-black text-[var(--gold)] ring-1 ring-inset ring-[var(--gold)]/20 shadow-sm overflow-hidden relative">
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0]} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <>{item.year.slice(-2)}'</>
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[var(--brown)]">{item.title}</h4>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--muted)]">{item.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100 pl-4">
                <Btn onClick={() => openForm(item)} variant="secondary" icon={Edit2} />
                <Btn onClick={() => remove(item._id)} variant="danger" icon={Trash2} />
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="py-16 text-center text-sm font-bold text-[var(--muted)] border-2 border-dashed border-[var(--brown)]/10 rounded-2xl">No milestones on record.</div>}
        </div>
      </Panel>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Milestone" : "Deploy Historic Milestone"}>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormInput label="Milestone Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} placeholder="e.g. 2026" />
            <FormInput label="Header Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Launched X..." />
          </div>
          <FormTextarea label="Core Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={5} placeholder="A brief narrative about this chapter..." />
          <ImageUploader
            images={form.images}
            imageBlurUrls={form.imageBlurUrls}
            onChange={(imgs, blurs) => setForm({ ...form, images: imgs, imageBlurUrls: blurs })}
            folder="story"
            aspectRatio={1}
            maxImages={GALLERY_MAX_IMAGES}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--brown)]/5">
            <Btn onClick={() => setModalOpen(false)} variant="ghost">Cancel Setup</Btn>
            <Btn onClick={save} icon={editingId ? Edit2 : Plus}>{editingId ? 'Save Changes' : 'Establish Timeline Node'}</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

function DailyLogManager({ searchQuery }: { searchQuery: string }) {
  const [items, setItems] = useState<LogItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: '',
    title: '',
    body: '',
    tags: '',
    images: [] as string[],
    imageBlurUrls: [] as string[],
  });
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => { apiClient.get('/log/all', { params: { search: debouncedSearch } }).then((r) => setItems(extractData(r))).catch(() => {}); }, [debouncedSearch]);

  const openForm = (item?: LogItem) => {
    if (item) {
      setEditingId(item._id);
      setForm({
        date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
        title: item.title,
        body: item.body,
        tags: item.tags?.join(', ') || '',
        images: item.images || [],
        imageBlurUrls: padBlurUrls(item.images, item.imageBlurUrls),
      });
    } else {
      setEditingId(null);
      setForm({ date: '', title: '', body: '', tags: '', images: [], imageBlurUrls: [] });
    }
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.body) return;
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      isOptimized: galleryLooksFullyOptimized(form.images),
    };
    try {
      if (editingId) {
        const r = await apiClient.put(`/log/${editingId}`, payload);
        setItems(items.map(i => i._id === editingId ? extractData(r) : i));
      } else {
        const r = await apiClient.post('/log', { ...payload, published: true });
        setItems([extractData(r), ...items]);
      }
      setModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const toggle = async (id: string) => { try { const r = await apiClient.patch(`/log/${id}/publish`, {}); setItems(items.map((i) => i._id === id ? extractData(r) : i)); } catch (err) { console.error(err); } };
  const remove = async (id: string) => { try { await apiClient.delete(`/log/${id}`); setItems(items.filter((i) => i._id !== id)); } catch (err) { console.error(err); } };

  return (
    <>
      <Panel title="Log Registry" description="Manage chronologic journal strings and records." action={<Btn onClick={() => openForm()} icon={Plus}>Draft New Log</Btn>}>
        <div className="grid gap-5">
          {items.map((item) => (
            <div key={item._id} className="group flex flex-col gap-4 rounded-2xl border-2 border-[var(--brown)]/5 bg-white p-6 shadow-sm transition-all hover:border-[var(--brown)]/15 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h4 className="font-['Playfair_Display'] text-xl font-bold text-[var(--brown)]">{item.title}</h4>
                  <StatusBadge active={item.published} />
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-[var(--muted)]">
                  <CalendarDays className="h-4 w-4 text-[var(--gold)]" />
                  {item.date ? new Date(item.date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'No date'}
                  {item.tags?.length > 0 && <span className="text-[var(--brown)]/20">•</span>}
                  {item.images?.length > 0 && <span className="flex items-center gap-1 text-[var(--gold)]"><ImagePlus className="h-3.5 w-3.5" /> {item.images.length}</span>}
                  {item.tags?.length > 0 && <span className="text-[var(--brown)]/20">•</span>}
                  {item.tags?.join(', ')}
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Btn onClick={() => toggle(item._id)} variant="ghost" icon={item.published ? XCircle : CheckCircle2} />
                <Btn onClick={() => openForm(item)} variant="secondary" icon={Edit2} />
                <Btn onClick={() => remove(item._id)} variant="danger" icon={Trash2} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Modify Framework" : "Draft Entry"}>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormInput label="Log Date (Optional)" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            <FormInput label="Headline" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Daily overview..." />
          </div>
          <FormTextarea label="Log Content (Markdown supported)" value={form.body} onChange={(v) => setForm({ ...form, body: v })} rows={6} placeholder="Write your log completely..." />
          <FormInput label="Organizational Tags" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="Strategy, Engineering, Marketing (comma split)" />
          
          <ImageUploader
            images={form.images}
            imageBlurUrls={form.imageBlurUrls}
            onChange={(imgs, blurs) => setForm({ ...form, images: imgs, imageBlurUrls: blurs })}
            folder="logs"
            maxImages={GALLERY_MAX_IMAGES}
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--brown)]/5">
            <Btn onClick={() => setModalOpen(false)} variant="ghost">Abort</Btn>
            <Btn onClick={save} icon={editingId ? Edit2 : Plus}>{editingId ? 'Commit Modifications' : 'Initialize Record'}</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function ThoughtsManager({ searchQuery }: { searchQuery: string }) {
  const [items, setItems] = useState<Thought[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    topic: '',
    title: '',
    summary: '',
    images: [] as string[],
    imageBlurUrls: [] as string[],
  });
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => { apiClient.get('/thoughts/all', { params: { search: debouncedSearch } }).then((r) => setItems(extractData(r))).catch(() => {}); }, [debouncedSearch]);

  const openForm = (item?: Thought) => {
    if (item) {
      setEditingId(item._id);
      setForm({
        topic: item.topic,
        title: item.title,
        summary: item.summary,
        images: item.images || [],
        imageBlurUrls: padBlurUrls(item.images, item.imageBlurUrls),
      });
    } else {
      setEditingId(null);
      setForm({ topic: '', title: '', summary: '', images: [], imageBlurUrls: [] });
    }
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.topic || !form.title || !form.summary) return;
    const payload = { ...form, isOptimized: galleryLooksFullyOptimized(form.images) };
    try {
      if (editingId) {
        const r = await apiClient.put(`/thoughts/${editingId}`, payload);
        setItems(items.map(i => i._id === editingId ? extractData(r) : i));
      } else {
        const r = await apiClient.post('/thoughts', { ...payload, published: true });
        setItems([extractData(r), ...items]);
      }
      setModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const toggle = async (id: string) => { try { const r = await apiClient.patch(`/thoughts/${id}/publish`, {}); setItems(items.map((i) => i._id === id ? extractData(r) : i)); } catch (err) { console.error(err); } };
  const remove = async (id: string) => { try { await apiClient.delete(`/thoughts/${id}`); setItems(items.filter((i) => i._id !== id)); } catch (err) { console.error(err); } };

  return (
    <>
      <Panel title="Cognitive Architecture" description="Manage deep essays and psychological musings." action={<Btn onClick={() => openForm()} icon={Plus}>Formulate Thought</Btn>}>
        <div className="grid lg:grid-cols-2 gap-8">
          {items.map((item) => (
            <div key={item._id} className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-[var(--brown)]/5 bg-white p-8 shadow-sm transition-all hover:-translate-y-1.5 hover:border-[var(--gold)]/30 hover:shadow-2xl hover:shadow-[var(--gold)]/10">
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-block rounded-xl bg-gradient-to-tr from-[var(--gold-light)]/20 to-white px-3.5 py-1.5 text-xs font-black uppercase tracking-widest text-[var(--gold)] shadow-sm">{item.topic}</span>
                  <div className="flex gap-3 items-center">
                     {item.images?.length > 0 && <span className="flex items-center gap-1 text-[var(--gold)] text-xs font-bold"><ImagePlus className="h-4 w-4" /> {item.images.length}</span>}
                     <StatusBadge active={item.published} />
                  </div>
                </div>
                <h4 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--brown)] leading-tight">{item.title}</h4>
                <p className="mt-4 text-sm font-medium leading-relaxed text-[var(--muted)] line-clamp-4">{item.summary}</p>
              </div>
              <div className="mt-8 flex items-center gap-2 border-t border-[var(--brown)]/5 pt-5 opacity-40 group-hover:opacity-100 transition-opacity">
                <Btn onClick={() => toggle(item._id)} variant="ghost" icon={item.published ? XCircle : CheckCircle2} />
                <Btn onClick={() => openForm(item)} variant="secondary" icon={Edit2}>Rewrite</Btn>
                <div className="flex-1" />
                <Btn onClick={() => remove(item._id)} variant="danger" icon={Trash2} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Rewrite Philosophy" : "Establish Structure"}>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormInput label="Parent Context" value={form.topic} onChange={(v) => setForm({ ...form, topic: v })} placeholder="e.g. Leadership" />
            <FormInput label="Essay Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Trap of minor optimizations" />
          </div>
          <FormTextarea label="Core Synthesis" value={form.summary} onChange={(v) => setForm({ ...form, summary: v })} rows={5} placeholder="Distill the thesis here..." />
          
          <ImageUploader
            images={form.images}
            imageBlurUrls={form.imageBlurUrls}
            onChange={(imgs, blurs) => setForm({ ...form, images: imgs, imageBlurUrls: blurs })}
            folder="thoughts"
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--brown)]/5">
            <Btn onClick={() => setModalOpen(false)} variant="ghost">Abort Protocol</Btn>
            <Btn onClick={save} icon={editingId ? Edit2 : Plus}>{editingId ? 'Finalize Rewrite' : 'Manifest Insight'}</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

function PressManager({ searchQuery }: { searchQuery: string }) {
  const [items, setItems] = useState<PressItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    outlet: '',
    outletLogo: '',
    outletLogoBlurUrl: '',
    mediaType: 'Newspaper',
    title: '',
    year: '',
    url: '',
    images: [] as string[],
    imageBlurUrls: [] as string[],
  });
  const debouncedSearch = useDebounce(searchQuery, 400);

  const MEDIA_TYPES = ['Newspaper', 'Magazine', 'Online Article', 'Broadcast / Video', 'Interview', 'Other'];

  useEffect(() => {
    apiClient
      .get('/press', { params: { search: debouncedSearch } })
      .then((r) => setItems(extractData(r)))
      .catch(() => {});
  }, [debouncedSearch]);

  const openForm = (item?: PressItem) => {
    if (item) {
      setEditingId(item._id);
      setForm({
        outlet: item.outlet,
        outletLogo: item.outletLogo || '',
        outletLogoBlurUrl: item.outletLogoBlurUrl || '',
        mediaType: item.mediaType || 'Newspaper',
        title: item.title,
        year: item.year,
        url: item.url,
        images: item.images || [],
        imageBlurUrls: padBlurUrls(item.images, item.imageBlurUrls),
      });
    } else {
      setEditingId(null);
      setForm({
        outlet: '',
        outletLogo: '',
        outletLogoBlurUrl: '',
        mediaType: 'Newspaper',
        title: '',
        year: new Date().getFullYear().toString(),
        url: '',
        images: [],
        imageBlurUrls: [],
      });
    }
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.outlet) {
      alert('Please fill in both the Publisher Name and Article Headline.');
      return;
    }
    const finalYear = form.year || new Date().getFullYear().toString();
    const payload = { ...form, year: finalYear, isOptimized: galleryLooksFullyOptimized(form.images) };
    try {
      if (editingId) {
        const r = await apiClient.put(`/press/${editingId}`, payload);
        setItems(items.map((i) => (i._id === editingId ? extractData(r) : i)));
      } else {
        const r = await apiClient.post('/press', payload);
        setItems([extractData(r), ...items]);
      }
      setModalOpen(false);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to save press mention. Please check your connection or inputs.';
      alert(message);
    }
  };

  const remove = async (id: string) => {
    try {
      await apiClient.delete(`/press/${id}`);
      setItems(items.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Panel
        title="Press & Media Citations"
        description="Manage newspaper clippings, publication logos, and public media references."
        action={<Btn onClick={() => openForm()} icon={Plus}>Catalog Media Mention</Btn>}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((p) => (
            <div
              key={p._id}
              className="group flex flex-col justify-between relative rounded-3xl border-2 border-[var(--brown)]/5 bg-white p-6 shadow-sm transition hover:border-[var(--gold)]/20 hover:shadow-xl hover:-translate-y-1"
            >
              <div>
                {/* Top row: Format/Year on left, Logo on top-right */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[var(--gold)]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--gold)] shrink-0">
                    {p.year} · {p.mediaType || 'Newspaper'}
                  </span>

                  {p.outletLogo ? (
                    <div className="h-8 max-w-[130px] flex items-center justify-end shrink-0">
                      <img src={p.outletLogo} alt={p.outlet} className="max-h-8 max-w-full object-contain object-right" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--muted)]/50 uppercase">Press</span>
                  )}
                </div>

                {/* Outlet Name */}
                <h4 className="font-['Playfair_Display'] text-sm font-black uppercase tracking-wide text-[var(--brown)] mb-2">
                  {p.outlet}
                </h4>

                <p className="text-base font-bold text-[var(--brown)] leading-snug line-clamp-2">
                  {p.title}
                </p>

                {/* Clipping Scan Preview */}
                {p.images && p.images.length > 0 && (
                  <div className="mt-3 relative h-28 w-full overflow-hidden rounded-xl border border-[var(--brown)]/10 bg-[var(--cream)]/40">
                    <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                      Clipping Attached
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--warm-white)] px-3 py-2 text-xs font-bold text-[var(--brown)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View Link
                  </a>
                )}
                <Btn onClick={() => openForm(p)} variant="secondary" icon={Edit2} />
                <Btn onClick={() => remove(p._id)} variant="danger" icon={Trash2} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Press Feature' : 'Add Media Coverage / Press Clipping'}
      >
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormInput
              label="Publisher / News Outlet Name"
              value={form.outlet}
              onChange={(v) => setForm({ ...form, outlet: v })}
              placeholder="e.g. The Hindu, Times of India, Forbes"
            />
            <FormInput
              label="Publication Year / Date"
              value={form.year}
              onChange={(v) => setForm({ ...form, year: v })}
              placeholder="e.g. 2025"
            />

            {/* Media Type Selector */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                Media Format / Type
              </label>
              <div className="flex flex-wrap gap-2">
                {MEDIA_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, mediaType: type })}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                      form.mediaType === type
                        ? 'bg-[var(--gold)] text-white shadow-sm'
                        : 'bg-[var(--warm-white)] text-[var(--brown)] hover:bg-[var(--cream)]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <FormInput
                label="Article Headline"
                value={form.title}
                onChange={(v) => setForm({ ...form, title: v })}
                placeholder="e.g. Salman Shariff: Changing Lives Through Philanthropy"
              />
            </div>
            <div className="md:col-span-2">
              <FormInput
                label="Direct Web URL (Optional)"
                value={form.url}
                onChange={(v) => setForm({ ...form, url: v })}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Publication Logo Uploader */}
          <div className="rounded-2xl border border-[var(--brown)]/10 bg-[var(--warm-white)]/50 p-4">
            <ImageUploader
              label="1. News Outlet / Publisher Logo (e.g. The Hindu, TOI logo)"
              images={form.outletLogo ? [form.outletLogo] : []}
              imageBlurUrls={form.outletLogoBlurUrl ? [form.outletLogoBlurUrl] : []}
              onChange={(imgs, blurs) =>
                setForm({
                  ...form,
                  outletLogo: imgs[0] || '',
                  outletLogoBlurUrl: blurs[0] || '',
                })
              }
              folder="press-logos"
              maxImages={1}
            />
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              Upload the official publication logo (PNG/SVG/WebP). If omitted, an elegant typography masthead will be used.
            </p>
          </div>

          {/* Newspaper Clipping / Article Scan */}
          <div className="rounded-2xl border border-[var(--brown)]/10 bg-[var(--warm-white)]/50 p-4">
            <ImageUploader
              label="2. Newspaper Clipping / Article Scan (Full scan or photo of newspaper)"
              images={form.images}
              imageBlurUrls={form.imageBlurUrls}
              onChange={(imgs, blurs) => setForm({ ...form, images: imgs, imageBlurUrls: blurs })}
              folder="press"
              maxImages={1}
            />
            <p className="mt-2 text-[11px] text-[var(--muted)]">
              Upload the scanned newspaper clipping, magazine page, or article screenshot.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--brown)]/5">
            <Btn onClick={() => setModalOpen(false)} variant="ghost">
              Cancel
            </Btn>
            <Btn onClick={save} icon={editingId ? Edit2 : Plus}>
              {editingId ? 'Save Changes' : 'Publish Coverage'}
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function AchievementsManager({ searchQuery }: { searchQuery: string }) {
  const [items, setItems] = useState<Achievement[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    icon: '',
    title: '',
    description: '',
    year: '',
    images: [] as string[],
    imageBlurUrls: [] as string[],
  });
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => { apiClient.get('/achievements', { params: { search: debouncedSearch } }).then((r) => setItems(extractData(r))).catch(() => {}); }, [debouncedSearch]);

  const openForm = (item?: Achievement) => {
    if (item) {
      setEditingId(item._id);
      setForm({
        icon: item.icon,
        title: item.title,
        description: item.description,
        year: item.year,
        images: item.images || [],
        imageBlurUrls: padBlurUrls(item.images, item.imageBlurUrls),
      });
    } else {
      setEditingId(null);
      setForm({ icon: '', title: '', description: '', year: '', images: [], imageBlurUrls: [] });
    }
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.description || !form.year) return;
    const payload = { ...form, isOptimized: galleryLooksFullyOptimized(form.images) };
    try {
      if (editingId) {
        const r = await apiClient.put(`/achievements/${editingId}`, payload);
        setItems(items.map(i => i._id === editingId ? extractData(r) : i));
      } else {
        const r = await apiClient.post('/achievements', payload);
        setItems([extractData(r), ...items]);
      }
      setModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const remove = async (id: string) => { try { await apiClient.delete(`/achievements/${id}`); setItems(items.filter((i) => i._id !== id)); } catch (err) { console.error(err); } };

  return (
    <>
       <Panel title="Professional Trophies" description="Record career benchmarks and massive scale wins." action={<Btn onClick={() => openForm()} icon={Trophy}>Mint Achievement</Btn>}>
        <div className="grid xl:grid-cols-2 gap-6">
          {items.map(a => (
            <div key={a._id} className="group flex flex-col md:flex-row gap-6 rounded-3xl border-2 border-[var(--brown)]/5 bg-[var(--warm-white)] p-6 shadow-sm transition-all hover:border-[var(--gold)]/20 hover:bg-white hover:shadow-xl hover:-translate-y-1">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-inner text-4xl ring-1 ring-inset ring-[var(--brown)]/10 group-hover:scale-105 transition duration-300 relative">
                {a.icon}
                {a.images?.length > 0 && <div className="absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--gold)] text-white shadow-md ring-2 ring-white"><ImagePlus className="h-3 w-3" /></div>}
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--brown)]">{a.title}</h4>
                  <p className="text-sm font-black uppercase tracking-widest text-[var(--gold)] mt-1 mb-2">{a.year}</p>
                  <p className="text-sm font-medium leading-relaxed text-[var(--muted)]">{a.description}</p>
                </div>
                <div className="mt-4 flex gap-2 opacity-50 transition-opacity group-hover:opacity-100">
                  <Btn onClick={() => openForm(a)} variant="secondary" icon={Edit2} />
                  <Btn onClick={() => remove(a._id)} variant="danger" icon={Trash2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Recalibrate Milestone" : "Forging Victory"}>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <FormInput label="Symbol Array" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} placeholder="🚀" />
            <FormInput label="Official Taxonomy" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Forbes 30 Under 30" />
            <FormInput label="Year Recorded" value={form.year} onChange={(v) => setForm({ ...form, year: v })} placeholder="2025" />
          </div>
          <FormTextarea label="Granular Details" value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={4} />

          <ImageUploader
            images={form.images}
            imageBlurUrls={form.imageBlurUrls}
            onChange={(imgs, blurs) => setForm({ ...form, images: imgs, imageBlurUrls: blurs })}
            folder="achievements"
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--brown)]/5">
            <Btn onClick={() => setModalOpen(false)} variant="ghost">Disengage Setup</Btn>
            <Btn onClick={save} icon={editingId ? Edit2 : Plus}>{editingId ? 'Modify Blueprint' : 'Authorize Plaque'}</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

function ConnectManager() {
  const [data, setData] = useState<SocialLinks>({ whatsapp: '', instagram: '', linkedin: '', twitter: '', facebook: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { apiClient.get('/connect').then((r) => setData((prev) => extractData(r, prev))).catch ((err) => { console.error(err); }); }, []);
  const save = async () => { setSaving(true); setMsg(''); try { await apiClient.put('/connect', data); setMsg('System topology updated.'); } catch { setMsg('Failure saving data.'); } finally { setSaving(false); } };

  return (
    <div className="max-w-3xl mx-auto">
      <Panel 
        title="Social Engineering Configurator" 
        description="Master links used routing system-wide logic."
        action={<Btn onClick={save} disabled={saving} icon={saving ? Loader2 : Link2}>{saving ? 'Transmitting...' : 'Synchronize Topology'}</Btn>}
      >
        <div className="grid md:grid-cols-2 gap-8">
          <FormInput label="Global Priority Email" value={data.email} onChange={(v) => setData({ ...data, email: v })} type="email" />
          <FormInput label="LinkedIn Canonical" value={data.linkedin} onChange={(v) => setData({ ...data, linkedin: v })} />
          <FormInput label="Twitter / X Platform" value={data.twitter} onChange={(v) => setData({ ...data, twitter: v })} />
          <FormInput label="Facebook Profile" value={data.facebook} onChange={(v) => setData({ ...data, facebook: v })} />
          <FormInput label="WhatsApp Encryption URL" value={data.whatsapp} onChange={(v) => setData({ ...data, whatsapp: v })} />
          <div>
            <FormInput label="Instagram Graph Web" value={data.instagram} onChange={(v) => setData({ ...data, instagram: v })} />
          </div>
          
          {msg && <div className="md:col-span-2 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800 flex items-center gap-3 border-2 border-emerald-200/50"><CheckCircle2 className="h-5 w-5" /> {msg}</div>}
        </div>
      </Panel>
    </div>
  );
}

function ContactsViewer({ searchQuery }: { searchQuery: string }) {
  const [items, setItems] = useState<ContactEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(searchQuery, 400);

  useEffect(() => { 
    apiClient.get('/contact', { params: { search: debouncedSearch } })
      .then((r) => setItems(extractData(r)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);
  const markRead = async (id: string) => { try { await apiClient.patch(`/contact/${id}/read`, {}); setItems(items.map((c) => c._id === id ? { ...c, read: true } : c)); } catch (e) { console.error('Failed to mark read', e); } };
  const remove = async (id: string) => { try { await apiClient.delete(`/contact/${id}`); setItems(items.filter((c) => c._id !== id)); } catch (e) { console.error('Failed to eliminate', e); } };

  return (
    <Panel title="Inbound Transmissions" description="Monitor and clear inbound user inquiries directly.">
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-[var(--brown)]/5" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[var(--brown)]/10 rounded-3xl bg-[var(--warm-white)]/50">
          <MessageSquare className="h-12 w-12 text-[var(--muted)]/40 mb-4" />
          <p className="font-bold text-[var(--muted)] text-xl">Transmission log empty.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((c: ContactEntry) => (
            <div key={c._id} className={`group relative rounded-3xl border-2 p-8 transition-shadow hover:shadow-xl ${c.read ? 'border-[var(--brown)]/5 bg-[#FDFBF7]' : 'border-[var(--gold)]/40 bg-white shadow-lg'}`}>
              {!c.read && (
                <div className="absolute -top-3 -right-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md ring-4 ring-white">NEW THREAD</div>
              )}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <h4 className="font-['Playfair_Display'] text-2xl font-bold text-[var(--brown)] mb-1">{c.name}</h4>
                  <p className="text-sm font-bold text-[var(--gold)]">{c.email}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-sm font-bold text-[var(--muted)] md:mb-4">{new Date(c.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <div className="mt-4 md:mt-0 flex self-start md:self-end justify-start md:justify-end gap-2">
                    {!c.read && <Btn onClick={() => markRead(c._id)} variant="secondary" icon={CheckCircle2}>Disarm Thread</Btn>}
                    <Btn onClick={() => remove(c._id)} variant="danger" icon={Trash2} />
                  </div>
                </div>
              </div>
              <p className="mt-6 rounded-2xl bg-white/50 p-6 font-mono text-sm leading-relaxed text-[var(--brown)] border-2 border-[var(--brown)]/5 whitespace-pre-wrap">{c.message}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function SettingsManager() {
  const [form, setForm] = useState({ heroVideoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    apiClient.get('/settings')
      .then((res) => {
        const data = extractData(res, { heroVideoUrl: '' });
        setForm({ heroVideoUrl: data.heroVideoUrl || '' });
      })
      .catch(() => {
        setMessage({ text: 'Failed to load settings', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiClient.put('/settings', form);
      const data = extractData(res);
      setForm({ heroVideoUrl: data.heroVideoUrl || '' });
      setMessage({ text: 'Settings saved successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--gold)]" /></div>;
  }

  return (
    <Panel title="Global Site Settings" description="Manage core configuration like the Hero section video.">
      <div className="space-y-6 max-w-2xl">
        <FormInput 
          label="Hero Video URL (.mp4)" 
          value={form.heroVideoUrl} 
          onChange={(v) => setForm({ ...form, heroVideoUrl: v })} 
          placeholder="https://cdn.example.com/video.mp4" 
        />
        <p className="text-xs text-[var(--muted)] -mt-4 ml-1">
          Provide a direct link to an optimized .mp4 file. If left blank, the default hardcoded video will play.
        </p>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-[var(--brown)]/5">
          <Btn onClick={save} disabled={saving} icon={saving ? Loader2 : undefined}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </Btn>
        </div>
      </div>
    </Panel>
  );
}
