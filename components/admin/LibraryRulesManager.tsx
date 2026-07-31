"use client";

import { useState } from "react";
import {
  createLibraryRule,
  deleteLibraryRule,
  updateLibraryRule,
} from "@/app/actions/library-rules";
import { toast } from "sonner";
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

interface Rule {
  id: string;
  content: string;
  createdAt: Date;
}

export function LibraryRulesManager({ rules: initial }: { rules: Rule[] }) {
  const [rules, setRules] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isPending, setIsPending] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setContent("");
  };

  const startEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setContent(rule.content);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData();
    formData.append("content", content);

    const result = editingId
      ? await updateLibraryRule(editingId, formData)
      : await createLibraryRule(formData);
    setIsPending(false);

    if (result.success) {
      if (editingId) {
        setRules((prev) =>
          prev.map((r) => (r.id === editingId ? { ...r, content } : r)),
        );
      }
      toast.success(result.message);
      resetForm();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this rule?");
    if (!confirmed) return;

    const result = await deleteLibraryRule(id);
    if (result.success) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) resetForm();
      toast.success("Rule deleted.");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Library Rules Management</CardTitle>
        <CardDescription>
          Add, edit, and manage library rules displayed on the student
          dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rule</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g., စာအုပ်ငှားကာလမှာ 14 ရက် (2 Weeks) ဖြစ်သည်။"
              rows={3}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingId ? "Updating..." : "Adding..."}
                </>
              ) : editingId ? (
                "Update Rule"
              ) : (
                "Add Rule"
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
            Existing Rules ({rules.length})
          </h3>
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4 text-center">
              No rules added yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-start gap-3 p-3 bg-card border rounded-lg text-sm transition-colors ${
                    editingId === rule.id
                      ? "border-blue-400 ring-1 ring-blue-300"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <span className="w-2 h-2 mt-1.5 rounded-full shrink-0 bg-emerald-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{rule.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => startEdit(rule)}
                    title="Edit rule"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(rule.id)}
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
