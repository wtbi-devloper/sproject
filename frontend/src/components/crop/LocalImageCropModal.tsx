import React, { useState, useCallback, useRef } from 'react';
import { Cropper, CircleStencil, RectangleStencil } from 'react-advanced-cropper';
import type { CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Scissors } from 'lucide-react';
import { compressImageToBlob } from '../../utils/nativeImageCompress';

export interface LocalImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (processedFiles: { file: File | Blob; originalName: string }[]) => void;
  CircularCrop?: boolean;
  aspectRatio?: number;
  outputMimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  title?: string;
  files?: File[];
}

const LocalImageCropModal: React.FC<LocalImageCropModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  CircularCrop = false,
  aspectRatio,
  outputMimeType = 'image/jpeg',
  title = 'Crop Images',
  files,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [processedFiles, setProcessedFiles] = useState<{ [index: number]: Blob | File }>({});
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cropperRef = useRef<CropperRef>(null);

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  React.useEffect(() => {
    if (files && files.length > 0) {
      const urls = files.map(f => URL.createObjectURL(f));
      setThumbnails(urls);
      setActiveIndex(0);
      setProcessedFiles({});
      return () => {
        urls.forEach(u => URL.revokeObjectURL(u));
      };
    } else {
      setThumbnails([]);
      setProcessedFiles({});
    }
  }, [files]);

  React.useEffect(() => {
    if (files && files[activeIndex]) {
      readFile(files[activeIndex])
        .then(setImageSrc)
        .catch(() => setError('Failed to read image.'));
    } else {
      setImageSrc(null);
    }
  }, [files, activeIndex]);

  const handleMarkProcessed = useCallback((data: Blob | File) => {
    setProcessedFiles(prev => {
      const next = { ...prev, [activeIndex]: data };
      const nextUnprocessed = files?.findIndex((_, i) => !next[i]);
      if (nextUnprocessed !== undefined && nextUnprocessed !== -1) {
        setActiveIndex(nextUnprocessed);
      }
      return next;
    });
  }, [activeIndex, files]);

  const handleCrop = useCallback(() => {
    if (!cropperRef.current) return;
    setIsProcessing(true);
    setError(null);
    try {
      const canvas = cropperRef.current.getCanvas();
      if (!canvas) throw new Error();
      canvas.toBlob(
        (blob: Blob | null) => {
          setIsProcessing(false);
          if (!blob) throw new Error();
          handleMarkProcessed(blob);
        },
        outputMimeType,
        outputMimeType === 'image/png' ? undefined : 0.9
      );
    } catch {
      setError('Failed to crop the image.');
      setIsProcessing(false);
    }
  }, [outputMimeType, handleMarkProcessed]);

  const handleSkip = () => {
    if (files && files[activeIndex]) {
      handleMarkProcessed(files[activeIndex]);
    }
  };

  const handleUploadOriginals = () => {
    if (!files) return;
    const originals = Object.fromEntries(files.map((file, index) => [index, file]));
    setProcessedFiles(originals);
    setError(null);
  };

  const resetAndClose = () => {
    setImageSrc(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!files || !onComplete) return;
    setIsProcessing(true);
    try {
      const results = await Promise.all(
        files.map(async (f, i) => {
          const processedOrOrig = processedFiles[i] || f;
          const compressed = await compressImageToBlob(processedOrOrig, 1400, 0.85);
          return {
            file: compressed,
            originalName: f.name,
          };
        })
      );
      setIsProcessing(false);
      onComplete(results);
      resetAndClose();
    } catch {
      setIsProcessing(false);
      setError('Failed to compress images before upload.');
    }
  };

  const handleZoomIn = () => cropperRef.current?.zoomImage(1.1);
  const handleZoomOut = () => cropperRef.current?.zoomImage(0.9);
  const handleRotate = () => cropperRef.current?.rotateImage(90);



  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(44, 26, 14, 0.7)', backdropFilter: 'blur(6px)' }}
          onClick={resetAndClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col"
            style={{
              backgroundColor: 'var(--warm-white)',
              border: '1px solid rgba(200,150,42,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 shrink-0" style={{ borderBottom: '1px solid rgba(44,26,14,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)', boxShadow: '0 4px 12px rgba(200,150,42,0.25)' }}>
                  <Scissors className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: 'var(--brown)' }}>
                  {title}
                </h2>
              </div>
              <button type="button" onClick={resetAndClose} className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] text-[var(--muted)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 flex-1 overflow-y-auto">
              {thumbnails.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-4 mb-4" style={{ borderBottom: '1px solid rgba(44,26,14,0.06)' }}>
                  {thumbnails.map((url, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                        i === activeIndex ? 'border-[var(--gold)] scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} className="h-full w-full object-cover" alt="" />
                      {processedFiles[i] && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {imageSrc && (
                <div>
                  <div className="relative overflow-hidden rounded-2xl" style={{ height: '320px', backgroundColor: '#1a0f07' }}>
                    <Cropper
                      ref={cropperRef}
                      src={imageSrc}
                      stencilComponent={CircularCrop ? CircleStencil : RectangleStencil}
                      stencilProps={{ movable: true, resizable: true, lines: true, grid: true, aspectRatio }}
                      className="h-full w-full"
                      backgroundClassName="bg-[#1a0f07]"
                    />
                  </div>

                  <p className="mt-3 text-center text-xs text-[var(--muted)]">
                    Drag edges / corners to resize • Drag inside to reposition
                  </p>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center gap-1 rounded-xl px-2 py-1.5 bg-[var(--cream)]">
                      <ControlBtn onClick={handleZoomOut} title="Zoom out"><ZoomOut className="h-4 w-4" /></ControlBtn>
                      <span className="px-2 text-xs font-bold text-[var(--muted)]">Zoom</span>
                      <ControlBtn onClick={handleZoomIn} title="Zoom in"><ZoomIn className="h-4 w-4" /></ControlBtn>
                    </div>
                    <ControlBtnWide onClick={handleRotate}>
                      <RotateCw className="h-4 w-4" /> Rotate 90°
                    </ControlBtnWide>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-6" style={{ borderTop: '1px solid rgba(44,26,14,0.06)' }}>
                    <div className="text-sm font-bold text-[var(--muted)]">
                      {Object.keys(processedFiles).length} / {files?.length || 0} processed
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <button type="button" onClick={resetAndClose} className="rounded-xl px-5 py-2.5 text-sm font-bold text-[var(--muted)] hover:bg-[var(--cream)] transition-all">Cancel</button>
                      <button type="button" onClick={handleUploadOriginals} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold bg-[var(--cream)] text-[var(--brown)] border border-[rgba(44,26,14,0.12)] hover:border-[var(--gold)] transition-all">
                        Upload Originals
                      </button>
                      <button type="button" onClick={handleSkip} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold bg-[var(--cream)] text-[var(--brown)] border border-[rgba(44,26,14,0.12)] hover:border-[var(--gold)] transition-all">Use As-Is</button>
                      <button type="button" onClick={handleCrop} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)' }}>
                        {isProcessing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Check className="h-4 w-4" />}
                        Crop
                      </button>
                      {files && files.length > 0 && (
                        <button type="button" onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-lg bg-emerald-600 hover:bg-emerald-700 transition-all">
                          Upload All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mt-4 rounded-2xl p-4 text-sm font-medium bg-red-50 text-red-600 border border-red-200">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function ControlBtn({ onClick, children, title }: { onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--brown)] hover:text-[var(--gold)] hover:bg-[rgba(200,150,42,0.12)] transition-all">
      {children}
    </button>
  );
}

function ControlBtnWide({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold bg-[var(--cream)] text-[var(--brown)] hover:text-[var(--gold)] hover:bg-[rgba(200,150,42,0.12)] transition-all">
      {children}
    </button>
  );
}

export default LocalImageCropModal;
