"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { api } from "@/lib/api";
import type { DocumentMeta } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md", ".docx", ".pptx"];
const MAX_SIZE_MB = 10;

interface TopicDocumentsProps {
  sessionId: string;
  linkedDocumentIds: string[];
  onDocumentsUpdated: (documentIds: string[]) => void;
}

export function TopicDocuments({
  sessionId,
  linkedDocumentIds,
  onDocumentsUpdated,
}: TopicDocumentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    if (linkedDocumentIds.length === 0) {
      setDocuments([]);
      return;
    }

    api.documents
      .list()
      .then((res) => {
        if (cancelled) return;
        const linked = new Set(linkedDocumentIds);
        // Only sources linked to this topic — never other topics' docs.
        setDocuments(res.documents.filter((doc) => linked.has(doc.id)));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load documents");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, linkedDocumentIds]);

  async function linkDocsToTopic(documentIds: string[]) {
    const updated = await api.chat.updateSessionDocuments(sessionId, documentIds);
    onDocumentsUpdated(updated.document_ids);
    return updated;
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB} MB.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const doc = await api.documents.upload(file);
      const nextIds = linkedDocumentIds.includes(doc.id)
        ? linkedDocumentIds
        : [...linkedDocumentIds, doc.id];
      await linkDocsToTopic(nextIds);
      setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
      setSuccess(`Uploaded and linked "${doc.filename}" to this topic.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function normalizeUrl(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(withScheme);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }

  async function handleAddUrl() {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Enter a valid http(s) link.");
      return;
    }

    setAddingUrl(true);
    setError(null);
    setSuccess(null);
    try {
      const doc = await api.documents.ingestUrl(normalized);
      const nextIds = linkedDocumentIds.includes(doc.id)
        ? linkedDocumentIds
        : [...linkedDocumentIds, doc.id];
      await linkDocsToTopic(nextIds);
      setDocuments((prev) => [doc, ...prev.filter((d) => d.id !== doc.id)]);
      setUrl("");
      setSuccess(`Added and linked ${doc.filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "URL ingest failed.");
    } finally {
      setAddingUrl(false);
    }
  }

  async function handleRemove(docId: string) {
    setRemovingId(docId);
    setError(null);
    setSuccess(null);
    try {
      const nextIds = linkedDocumentIds.filter((id) => id !== docId);
      await linkDocsToTopic(nextIds);
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      setSuccess("Removed from this topic.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove source.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <GlassCard sheen className="flex h-full flex-col p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-caps">Sources</p>
          <p className="mt-1 text-sm text-muted">
            Only for this topic. Upload a file or add a link.
          </p>
        </div>
        <Button
          type="button"
          variant="soft"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md,.docx,.pptx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <form
        className="mb-4 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleAddUrl();
        }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-mist/45">
          Add link
        </p>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            inputMode="url"
            autoComplete="url"
            aria-label="Web page URL"
            className="min-w-0 flex-1 rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-mist outline-none placeholder:text-mist/30 focus:border-accent/70"
          />
          <Button
            type="submit"
            variant="soft"
            loading={addingUrl}
            disabled={!url.trim()}
          >
            Add link
          </Button>
        </div>
      </form>

      {error && (
        <p className="mb-2 rounded-xl bg-[var(--danger-bg)] px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {success && (
        <output className="mb-2 block text-sm text-accent">{success}</output>
      )}

      {documents.length === 0 ? (
        <p className="border-t border-white/10 pt-4 text-sm text-faint">
          No sources in this topic yet. Upload a file or paste a link above.
        </p>
      ) : (
        <ul className="space-y-2 border-t border-white/10 pt-4">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm"
            >
              <span className="flex-1 truncate text-mist">{doc.filename}</span>
              <span className="label-caps !text-mist/30">{doc.num_chunks} chunks</span>
              <Button
                type="button"
                variant="ghost"
                loading={removingId === doc.id}
                onClick={() => void handleRemove(doc.id)}
                className="!px-2 !py-1 text-xs"
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}
