"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { User } from "@/types/UserType";
import {
  MailIcon,
  LockIcon,
  UserIcon,
  PhoneIcon,
  BookOpenIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  BanIcon,
  UserCheckIcon,
} from "lucide-react";

type FormData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  faculty?: string;
  banned?: boolean;
};

interface Props {
  teacherToEdit?: User | null;
  onTeacherCreated?: () => void;
}

const emptyForm: FormData = {
  name: "",
  email: "",
  password: "",
  phone: "",
  faculty: "",
  banned: false,
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function CreateTeacherForm({
  teacherToEdit,
  onTeacherCreated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!teacherToEdit;

  useEffect(() => {
    const nextForm = teacherToEdit
      ? {
          name: teacherToEdit.name,
          email: teacherToEdit.email,
          password: "",
          phone: teacherToEdit.phone || "",
          faculty: teacherToEdit.faculty || "",
          banned: teacherToEdit.banned ?? false,
        }
      : emptyForm;

    setForm(nextForm);
    setTouched({});
    setErrors({});
  }, [teacherToEdit]);

  const validateField = (name: string, value: string) => {
    if (name === "name") {
      if (!value.trim()) return "Name is required";
      if (value.trim().length < 2) return "Name must be at least 2 characters";
      return "";
    }
    if (name === "email") {
      if (!value.trim()) return "Email is required";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Please enter a valid email address";
      return "";
    }
    if (name === "password") {
      if (!isEditMode && !value) return "Password is required";
      if (value && value.length < 6)
        return "Password must be at least 6 characters";
      return "";
    }
    if (name === "phone") {
      if (value && !/^[\d\s+()-]{8,}$/.test(value))
        return "Please enter a valid phone number";
      return "";
    }
    if (name === "faculty") {
      if (value && value.trim().length < 2)
        return "Please enter a valid faculty name";
      return "";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleChecked = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    // Define the subset of keys that are actually strings
    const fieldsToValidate: (keyof FormData)[] = isEditMode
      ? ["name", "email", "phone", "faculty"]
      : ["name", "email", "password", "phone", "faculty"];

    fieldsToValidate.forEach((field) => {
      // Use a type guard or fallback to ensure value is a string
      const value = (form[field] as string) || "";
      const error = validateField(field, value);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const url = teacherToEdit
        ? `/api/admin/teachers/${teacherToEdit.id}`
        : "/api/admin/teachers";
      const method = teacherToEdit ? "PATCH" : "POST";

      let submitData;
      if (isEditMode) {
        const { password, ...rest } = form;
        submitData = rest;
      } else {
        submitData = form;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = (await res.json()) as { message?: unknown };

      if (!res.ok) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Failed to save teacher",
        );
      }

      toast.success(
        teacherToEdit
          ? "Teacher updated successfully"
          : "Teacher created successfully",
      );

      if (!teacherToEdit) {
        setForm(emptyForm);
        setTouched({});
        setErrors({});
      }

      onTeacherCreated?.();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save teacher"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
          <BookOpenIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {isEditMode ? "Edit Teacher" : "Add New Teacher"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isEditMode
            ? "Update teacher information and status"
            : "Create a new teacher account for the academic system"}
        </p>
      </div>

      <div className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Full Name *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="name"
              type="text"
              placeholder="e.g., Dr. Sarah Johnson"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                touched.name && errors.name
                  ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500"
              }`}
            />
          </div>
          {touched.name && errors.name && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircleIcon className="w-3 h-3" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Email Address *
          </label>
          <div className="relative">
            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="email"
              type="email"
              placeholder="teacher@university.edu"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                touched.email && errors.email
                  ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500"
              }`}
            />
          </div>
          {touched.email && errors.email && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircleIcon className="w-3 h-3" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field - Only show in create mode */}
        {!isEditMode && (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a secure password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-9 pr-10 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                  touched.password && errors.password
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                    : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <AlertCircleIcon className="w-3 h-3" />
                {errors.password}
              </p>
            )}
            {!touched.password && !errors.password && (
              <p className="mt-1 text-xs text-slate-400">
                Must be at least 6 characters long
              </p>
            )}
          </div>
        )}

        {/* Phone Field */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Phone Number (Optional)
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                touched.phone && errors.phone
                  ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500"
              }`}
            />
          </div>
          {touched.phone && errors.phone && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircleIcon className="w-3 h-3" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* Faculty Field */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Faculty / Department
          </label>
          <div className="relative">
            <BookOpenIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="faculty"
              type="text"
              placeholder="e.g., Computer Science, Mathematics"
              value={form.faculty}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                touched.faculty && errors.faculty
                  ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                  : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500"
              }`}
            />
          </div>
          {touched.faculty && errors.faculty && (
            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
              <AlertCircleIcon className="w-3 h-3" />
              {errors.faculty}
            </p>
          )}
        </div>

        {/* Banned Toggle */}
        <div className="pt-2">
          <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
            <div className="flex items-center gap-3">
              {form.banned ? (
                <BanIcon className="w-5 h-5 text-rose-500" />
              ) : (
                <UserCheckIcon className="w-5 h-5 text-emerald-500" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {form.banned ? "Banned Account" : "Active Account"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {form.banned
                    ? "Teacher cannot access the system"
                    : "Teacher has full access privileges"}
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                name="banned"
                type="checkbox"
                checked={form.banned}
                onChange={handleChecked}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-rose-500 transition-colors duration-200"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-5"></div>
            </div>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full relative mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {isEditMode ? "Updating..." : "Creating..."}
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CheckCircleIcon className="w-4 h-4" />
            {isEditMode ? "Update Teacher" : "Create Teacher"}
          </span>
        )}
      </button>

      {/* Info Note for Edit Mode */}
      {isEditMode && (
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <LockIcon className="w-3 h-3" />
            Password cannot be changed here.
          </p>
        </div>
      )}
    </form>
  );
}
