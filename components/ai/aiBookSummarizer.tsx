"use client";

import { summarizeBook } from "@/app/actions/ai/summarizeBook";
import { useState } from "react";

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
}

export function BookSummarizer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    try {
      const output = await summarizeBook(text);
      setResult(output);
    } catch (error) {
      console.error("Failed to generate summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const badgeColors = {
    Beginner: "bg-green-500/10 text-green-400 border-green-500/20",
    Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Advanced: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="p-6 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white">
          AI Studio: Text Summarizer
        </h2>
        <form onSubmit={handleSummarize} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste book text, paragraphs, or chapter summaries here (up to 20,000 characters)..."
            rows={6}
            className="w-full px-4 py-3 rounded-lg bg-slate-900/50 text-white border border-slate-700 focus:outline-none focus:border-cyan-500 placeholder-slate-400 text-sm resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white font-medium hover:opacity-90 disabled:opacity-40 transition-opacity text-sm"
            >
              {loading ? "Analyzing..." : "Generate Analysis"}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="p-6 backdrop-blur-sm bg-slate-900/40 border border-slate-800 rounded-xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-white text-base">
              Analysis Results
            </h3>
            <span
              className={`px-3 py-0.5 text-xs font-medium border rounded-full ${
                badgeColors[result.difficultyLevel] || badgeColors.Intermediate
              }`}
            >
              {result.difficultyLevel} Level
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Summary
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {result.summary}
            </p>
          </div>

          {result.keyPoints?.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Key Takeaways
              </h4>
              <ul className="space-y-1.5">
                {result.keyPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-cyan-400 mt-1 flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
