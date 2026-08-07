"use client";

import React, { useState } from "react";
import { useBrandConfig } from "@/components/brand-config-provider";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface BrandFormProps {
  initialName?: string;
  initialLogo?: string;
  initialFavicon?: string;
  initialTitle?: string;
}

export default function BrandForm({
  initialName = "",
  initialLogo = "/images/brand.png",
  initialFavicon = "/icon.png",
  initialTitle = "",
}: BrandFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [namePreview, setNamePreview] = useState(initialName);
  const [logoPreview, setLogoPreview] = useState(initialLogo);
  const [faviconPreview, setFaviconPreview] = useState(initialFavicon);
  const [titlePreview, setTitlePreview] = useState(initialTitle);
  const { refresh } = useBrandConfig();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/brand", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      if (data?.name) setNamePreview(data.name);
      if (data?.logo) setLogoPreview(data.logo);
      if (data?.favicon) setFaviconPreview(data.favicon);
      if (data?.title) setTitlePreview(data.title);
      refresh();
      toast.success("Brand configuration updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update brand. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full  overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-royal/5 to-transparent border-b">
        <CardTitle className="text-xl font-semibold tracking-tight text-navy">
          Identity &amp; Branding
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          Customize the global name, logo, favicon, and metadata for the digital
          library platform.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-6">
          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Live Application Preview
            </Label>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed bg-background/50">
              <div className="h-12 w-12 rounded-lg bg-card border flex items-center justify-center p-2 overflow-hidden shadow-inner">
                <img
                  src={logoPreview}
                  alt="Brand logo preview"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23CBD5E1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='Message'%3E%3C/path%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-navy">
                  {namePreview || "Untitled Platform"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Active Header Preview
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="name" className="text-sm font-medium">
                  Institution Name
                </Label>
                <span className="text-xs text-muted-foreground">
                  {namePreview.length}/22
                </span>
              </div>
              <Input
                id="name"
                name="name"
                type="text"
                required
                maxLength={22}
                value={namePreview}
                onChange={(e) => setNamePreview(e.target.value)}
                placeholder="UCSTGO Library"
                className="w-full bg-card"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 22 characters.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm font-medium">
                Browser Tab Title (SEO)
              </Label>
              <Input
                id="title"
                name="title"
                type="text"
                value={titlePreview}
                onChange={(e) => setTitlePreview(e.target.value)}
                placeholder="UCSTGO Digital Library"
                className="w-full bg-card"
              />
              <p className="text-xs text-muted-foreground">
                Shown in the browser tab and search engine results.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="logo" className="text-sm font-medium">
                Logo Graphic Asset
              </Label>
              <div className="relative group flex flex-col items-center justify-center border-2 border-dashed hover:border-royal rounded-lg p-6 bg-card cursor-pointer transition-colors text-center min-h-[160px]">
                <input
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-28 max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <svg
                    className="w-8 h-8 text-muted-foreground group-hover:text-royal transition-colors mb-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium text-navy mt-2">
                  {logoPreview
                    ? "Click to change or drag new file"
                    : "Click to change or drag file here"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, or SVG up to 5MB (Overwrites old version)
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="favicon" className="text-sm font-medium">
                Favicon (Browser Tab Icon)
              </Label>
              <div className="relative group flex flex-col items-center justify-center border-2 border-dashed hover:border-royal rounded-lg p-6 bg-card cursor-pointer transition-colors text-center min-h-[140px]">
                <input
                  id="favicon"
                  name="favicon"
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {faviconPreview ? (
                  <img
                    src={faviconPreview}
                    alt="Favicon preview"
                    className="max-h-20 max-w-full object-contain rounded"
                  />
                ) : (
                  <svg
                    className="w-8 h-8 text-muted-foreground group-hover:text-royal transition-colors mb-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium text-navy mt-2">
                  {faviconPreview
                    ? "Click to change or drag new file"
                    : "Click to upload favicon"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PNG, ICO, or SVG (32x32 or 16x16 recommended)
                </span>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 flex items-center justify-end gap-3 border-t bg-muted/10">
          <Button
            type="submit"
            disabled={isPending}
            className="min-w-[120px] bg-primary text-primary-foreground hover:bg-royal/90 shadow-sm"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
