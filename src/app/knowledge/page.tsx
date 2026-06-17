"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  FileText,
  Trash2,
  Hash,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface KnowledgeDocument {
  id: string;
  title: string;
  source_url: string | null;
  status: "active" | "archived";
  created_at: string;
  knowledge_chunks?: { count: number }[];
}

async function fetchDocuments(): Promise<KnowledgeDocument[]> {
  const res = await fetch("/api/documents");
  if (!res.ok) throw new Error("Failed to load documents");
  const data = await res.json();
  return data.documents;
}

async function createDocument(payload: { title: string; content: string; source_url?: string }) {
  const res = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create document");
  return res.json();
}

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", source_url: "" });
  const [formError, setFormError] = useState("");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
  });

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setShowForm(false);
      setForm({ title: "", content: "", source_url: "" });
      setFormError("");
    },
    onError: (err: Error) => setFormError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Title and content are required.");
      return;
    }
    create({
      title: form.title,
      content: form.content,
      source_url: form.source_url || undefined,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            FAQ documents and product guides for RAG retrieval.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((p) => !p)}
          size="sm"
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Document
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">New Document</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <Input
                placeholder="e.g., Refund Policy FAQ"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Source URL (optional)</label>
              <Input
                placeholder="https://..."
                value={form.source_url}
                onChange={(e) => setForm({ ...form, source_url: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Content</label>
              <textarea
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm min-h-[160px] outline-none focus:ring-2 focus:ring-ring resize-y"
                placeholder="Paste your document content here…"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            {formError && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {formError}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isCreating} className="gap-1.5">
                {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {isCreating ? "Creating…" : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowForm(false); setFormError(""); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Document list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !documents || documents.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No documents yet.</p>
          <p className="text-xs mt-1">Add your first document to power the RAG retrieval.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const chunkCount =
              Array.isArray(doc.knowledge_chunks) && doc.knowledge_chunks.length > 0
                ? (doc.knowledge_chunks[0] as { count: number }).count
                : 0;

            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/20 transition-colors"
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                    doc.status === "active" ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground"
                  )}
                >
                  <FileText className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      {chunkCount} chunks
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        doc.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
