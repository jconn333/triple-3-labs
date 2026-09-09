"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button, Field, Input, Modal, Textarea } from "@/components/ui";

interface ContractUploadModalProps {
  accountId: string;
  onClose: () => void;
  onUploaded: () => void;
}

export default function ContractUploadModal({ accountId, onClose, onUploaded }: ContractUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  function handleFileSelect(f: File) {
    if (!ALLOWED_TYPES.includes(f.type)) {
      toast.error("Only PDF and Word documents are allowed");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }

  async function handleUpload() {
    if (!file || !title.trim()) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      if (description.trim()) formData.append("description", description.trim());

      const res = await fetch(`/api/accounts/${accountId}/contracts`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Your session has expired — reload the page, sign in, and try again.");
        if (res.status === 413) throw new Error("File too large for the server (limit ~4.5MB). Compress the PDF and retry.");
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      toast.success("Contract uploaded");
      onUploaded();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal
      title="Upload contract"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={!file || !title.trim()} loading={uploading}>
            {!uploading && <Upload size={14} />}
            Upload
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "cursor-pointer rounded-lg border border-dashed p-8 text-center transition-colors",
            dragOver
              ? "border-accent bg-accent-soft"
              : file
                ? "border-good/40 bg-good-soft"
                : "border-line-strong bg-ground hover:border-ink-3",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText size={22} className="text-good" />
              <div className="text-left">
                <p className="text-sm font-medium text-ink">{file.name}</p>
                <p className="text-sub text-ink-2">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="ml-2 text-ink-3 hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <Upload size={28} className="mx-auto mb-2 text-ink-3" />
              <p className="text-sm text-ink-2">Drop a file here or click to browse</p>
              <p className="mt-1 text-sub text-ink-3">PDF, DOC, DOCX up to 10MB</p>
            </>
          )}
        </div>

        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Service Agreement" />
        </Field>

        <Field label="Description (optional)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes about this contract..."
            rows={2}
          />
        </Field>
      </div>
    </Modal>
  );
}
