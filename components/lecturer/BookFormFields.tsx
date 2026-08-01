"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import {
  BookOpen,
  Tag,
  Image,
  FileText,
  Layers,
  Upload,
  X,
  MapPin,
  CheckCircle,
  GraduationCap,
} from "lucide-react";
import { getAllSemesters } from "@/app/actions/semesters";
import { toAsciiDigits } from "@/lib/digits";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useCategories } from "@/hooks/use-categories";
import { toast } from "sonner";
import { FILE_LIMITS } from "@/lib/upload-limits";

interface BookFormFieldsProps {
  form: {
    title: string;
    isbn: string;
    author: string;
    category: string;
    publisher: string;
    description: string;
    publicationYear: string;
    language: string;
    donate: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      title: string;
      isbn: string;
      author: string;
      category: string;
      publisher: string;
      description: string;
      publicationYear: string;
      language: string;
      donate: string;
    }>
  >;
  categories?: any[]; // Added categories array property here
  coverPreview: string | null;
  handleCoverChange: (file: File | null) => void;
  ebook: File | null;
  setEbook: React.Dispatch<React.SetStateAction<File | null>>;
  semester: string;
  setSemester: React.Dispatch<React.SetStateAction<string>>;
  copies: number;
  setCopies: React.Dispatch<React.SetStateAction<number>>;
  shelfLocation?: string;
  setShelfLocation?: React.Dispatch<React.SetStateAction<string>>;
}

// 1. Interface definition for the dynamic semester objects from your Prisma schema
interface SemesterData {
  id: string;
  name: string;
  slug: string;
}

export function BookFormFields({
  form,
  setForm,

  coverPreview,
  handleCoverChange,
  ebook,
  setEbook,
  semester,
  setSemester,
  copies,
  setCopies,
  shelfLocation = "",
  setShelfLocation,
}: BookFormFieldsProps) {
  // 2. State for handling the live semesters array from Server Actions
  const [semesterOptions, setSemesterOptions] = useState<SemesterData[]>([]);
  const { data: categories = [] } = useCategories();


  useEffect(() => {
    async function fetchSemesters() {
      const response = await getAllSemesters();
      if (response.success && response.data) {
        setSemesterOptions(response.data);
      }
    }
    fetchSemesters();
  }, []);

  return (
    <div className="space-y-4">
      {/* Basic Information - 2 column grid */}
      <Card className="p-4 border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
            Basic Information
          </h2>
          <span className="text-[10px] text-red-500 ml-auto">* Required</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Book Title *
            </label>
            <Input
              placeholder="Enter book title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              ISBN *
            </label>
            <Input
              placeholder="978-3-16-148410-0"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <Combobox
              value={form.category}
              onValueChange={(value) =>
                setForm({ ...form, category: value ?? "" })
              }
            >
              <ComboboxInput
                placeholder="Search or type a new category..."
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 text-sm w-full"
              />
              <ComboboxContent>
                <ComboboxList>
                  {/* 1. Safely resolve the array if it's nested inside an object */}
                  {(() => {
                    // Determine if 'categories' is an array, or if it lives inside data/categories properties
                    const categoriesArray = Array.isArray(categories)
                      ? categories
                      : (categories as any)?.data ||
                        (categories as any)?.categories ||
                        [];

                    if (!categoriesArray || categoriesArray.length === 0) {
                      return (
                        <ComboboxEmpty>
                          No categories found. Type to create one.
                        </ComboboxEmpty>
                      );
                    }

                    return categoriesArray.map((cat: any) => {
                      const categoryName =
                        typeof cat === "string" ? cat : cat?.name || cat?.title;
                      return (
                        <ComboboxItem key={categoryName} value={categoryName}>
                          {categoryName}
                        </ComboboxItem>
                      );
                    });
                  })()}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Author *
            </label>
            <Input
              placeholder="Author name"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="h-9 text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              New author will be auto-created
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <Textarea
              placeholder="Book description..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Additional Details - 2 column grid */}
      <Card className="p-4 border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
            <Tag className="w-4 h-4 text-purple-600" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
            Additional Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Publisher
            </label>
            <Input
              placeholder="Publisher name"
              value={form.publisher}
              onChange={(e) => setForm({ ...form, publisher: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Publication Year
            </label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="2024"
              value={form.publicationYear}
              onChange={(e) =>
                setForm({
                  ...form,
                  publicationYear: toAsciiDigits(e.target.value),
                })
              }
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Language
            </label>
            <Input
              placeholder="e.g., English"
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Donation Information (Optional)
            </label>
            <Input
              placeholder="e.g., Donated by ERPB"
              value={form.donate}
              onChange={(e) => setForm({ ...form, donate: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Media Uploads - 2 column grid */}
      <Card className="p-4 border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
            <Upload className="w-4 h-4 text-emerald-600" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
            Media Uploads
          </h2>
          <span className="text-[10px] text-red-500 ml-auto">
            * Cover required
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cover Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cover Image *
            </label>
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f && f.size > FILE_LIMITS.cover) {
                      toast.error(
                        `Cover image too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${Math.round(FILE_LIMITS.cover / 1024 / 1024)} MB.`,
                      );
                      e.target.value = "";
                      return;
                    }
                    handleCoverChange(f);
                  }}
                  className="hidden"
                />
                {coverPreview ? (
                  <div className="relative">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-32 object-contain rounded-md mb-2"
                    />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Cover selected
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleCoverChange(null);
                      }}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Image className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Click to upload cover
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      JPG, PNG, WebP (max 5MB)
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Ebook Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ebook (PDF)
            </label>
            <label className="cursor-pointer block">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f && f.size > FILE_LIMITS.ebook) {
                      toast.error(
                        `PDF too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${Math.round(FILE_LIMITS.ebook / 1024 / 1024)} MB.`,
                      );
                      e.target.value = "";
                      return;
                    }
                    setEbook(f);
                  }}
                  className="hidden"
                />
                {ebook ? (
                  <div className="relative">
                    <FileText className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate px-2">
                      {ebook.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {(ebook.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEbook(null);
                        setSemester("");
                      }}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Click to upload PDF
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      PDF format only (max{" "}
                      {Math.round(FILE_LIMITS.ebook / 1024 / 1024)}MB)
                    </p>
                  </>
                )}
              </div>
            </label>

            {/* Dynamic Target Semester Selection */}
            
              <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                  Target Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:focus-visible:ring-slate-300"
                >
                  <option value="">Select a semester...</option>
                  {/* 3. Updated loop to match database schema attributes (id and name) */}
                  {semesterOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            
          </div>
        </div>
      </Card>

      {/* Physical Copies Section */}
      <Card className="p-4 border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
            Physical Copies
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Number of Copies
            </label>
            <Input
              type="text"
              inputMode="numeric"
              min={1}
              value={copies}
              onChange={(e) =>
                setCopies(
                  Number(toAsciiDigits(e.target.value).replace(/\D/g, "")) || 0,
                )
              }
              className="w-full h-9 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Shelf Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="e.g., A-12-3"
                value={shelfLocation}
                onChange={(e) => setShelfLocation?.(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Format: Section-Row-Shelf (e.g., A-12-3)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
