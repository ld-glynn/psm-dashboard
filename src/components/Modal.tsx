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
      <div className="relative bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-[#1a1a2e] border-b border-[#2a2a3e] px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold text-white/90">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors">
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
