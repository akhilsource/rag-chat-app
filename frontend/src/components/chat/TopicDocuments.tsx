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
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(linkedDocumentIds);
  const [uploading, setUploading] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDocIds(linkedDocumentIds);
  }, [linkedDocumentIds]);

  useEffect(() => {
    api.documents
      .list()
      .then((res) => setDocuments(res.documents))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      });
  }, []);

  function toggleDoc(id: string) {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
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
      setDocuments((prev) => [doc, ...prev]);
      setSelectedDocIds((prev) => [...prev, doc.id]);
      setSuccess(`Uploaded "${doc.filename}". Save to link it to this topic.`);
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

  async function linkDocsToTopic(documentIds: string[]) {
    const updated = await api.chat.updateSessionDocuments(sessionId, documentIds);
    setSelectedDocIds(updated.document_ids);
    onDocumentsUpdated(updated.document_ids);
    return updated;
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
      setDocuments((prev) => [doc, ...prev]);
      const nextIds = selectedDocIds.includes(doc.id)
        ? selectedDocIds
        : [...selectedDocIds, doc.id];
      await linkDocsToTopic(nextIds);
      setUrl("");
      setSuccess(`Added and linked ${doc.filename}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "URL ingest failed.");
    } finally {
      setAddingUrl(false);
    }
  }

  async function handleSaveSources() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await linkDocsToTopic(selectedDocIds);
      setSuccess(`Linked ${updated.document_ids.length} source(s) to this topic.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sources.");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    selectedDocIds.length !== linkedDocumentIds.length ||
    selectedDocIds.some((id) => !linkedDocumentIds.includes(id));

  return (
    <GlassCard sheen className="flex h-full flex-col p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-caps">Sources</p>
          <p className="mt-1 text-sm text-muted">
            Files or web links (Tavily).
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
          No sources yet. Upload a file or paste a link above.
        </p>
      ) : (
        <>
          <ul className="space-y-2 border-t border-white/10 pt-4">
            {documents.map((doc) => (
              <li key={doc.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-sm transition hover:bg-white/[0.06]">
                  <input
                    type="checkbox"
                    checked={selectedDocIds.includes(doc.id)}
                    onChange={() => toggleDoc(doc.id)}
                    className="accent-[var(--accent)]"
                  />
                  <span className="flex-1 truncate text-mist">{doc.filename}</span>
                  <span className="label-caps !text-mist/30">{doc.num_chunks} chunks</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button
              type="button"
              loading={saving}
              disabled={!hasChanges}
              onClick={handleSaveSources}
            >
              Save sources
            </Button>
          </div>
        </>
      )}
    </GlassCard>
  );
}
