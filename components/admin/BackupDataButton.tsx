// BackupDataButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button"; // or your UI library

export function BackupDataButton() {
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/admin/backup", {
        method: "POST",
      });

      // 1. Check if the server returned an error (500, 401, etc.)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Backup failed with status ${res.status}`);
      }

      // 2. Process file download blob safely
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from response headers or fallback to default
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "ucstgo-backup.sql";
      if (contentDisposition && contentDisposition.includes("filename=")) {
        filename = contentDisposition
          .split("filename=")[1]
          .replace(/["']/g, "");
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Backup trigger failed:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleBackup} disabled={loading}>
      {loading ? "Generating Backup..." : "Download SQL Backup"}
    </Button>
  );
}