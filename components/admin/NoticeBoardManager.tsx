"use client";

import { useState } from "react";
import {
  createNotice,
  deleteNotice,
  updateNotice,
} from "@/app/actions/notice";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Pencil, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Notice {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: Date;
}

const colorOptions = [
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "emerald", label: "Emerald", class: "bg-emerald-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
];

const colorHex: Record<string, string> = {
  red: "#ef4444",
  emerald: "#10b981",
  cyan: "#06b6d4",
  blue: "#3b82f6",
  amber: "#f59e0b",
};

export function NoticeBoardManager({ notices: initial }: { notices: Notice[] }) {
  const [notices, setNotices] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("red");
  const [isPending, setIsPending] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setColor("red");
  };

  const startEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setContent(notice.content);
    setColor(notice.color);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("color", color);

    const result = editingId
      ? await updateNotice(editingId, formData)
      : await createNotice(formData);
    setIsPending(false);

    if (result.success) {
      if (editingId) {
        setNotices((prev) =>
          prev.map((n) =>
            n.id === editingId ? { ...n, title, content, color } : n,
          ),
        );
        toast.success(result.message);
      } else {
        toast.success(result.message);
      }
      resetForm();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this notice?");
    if (!confirmed) return;

    const result = await deleteNotice(id);
    if (result.success) {
      setNotices((prev) => prev.filter((n) => n.id !== id));
      if (editingId === id) resetForm();
      toast.success("Notice deleted.");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notice Board Management</CardTitle>
        <CardDescription>
          Add, edit, and manage notices displayed on the student dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., စာကြည့်တိုက်ပိတ်ရက် အသိပေးချက်"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Notice details..."
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dot Color</label>
            <div className="flex gap-2">
              {colorOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setColor(opt.value)}
                  className={`w-8 h-8 rounded-full ${opt.class} ${
                    color === opt.value
                      ? "ring-2 ring-offset-2 ring-slate-900"
                      : ""
                  }`}
                  title={opt.label}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingId ? "Updating..." : "Adding..."}
                </>
              ) : editingId ? (
                "Update Notice"
              ) : (
                "Add Notice"
              )}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
                className="text-slate-500"
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Existing Notices ({notices.length})
          </h3>
          {notices.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4 text-center">
              No notices added yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`flex items-start gap-3 p-3 bg-card border rounded-lg text-sm transition-colors ${
                    editingId === notice.id
                      ? "border-blue-400 ring-1 ring-blue-300"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <span
                    className="w-2 h-2 mt-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: colorHex[notice.color] || "#ef4444",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{notice.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notice.content}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => startEdit(notice)}
                    title="Edit notice"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(notice.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
