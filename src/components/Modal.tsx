"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Content */}
      <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border)] px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--text-faint)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
