"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User } from "@/types/UserType";
import { Input } from "@/components/ui/input";
import { BanIcon, UserCheckIcon } from "lucide-react"; // Import icons

type FormData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  studentId?: string;
  faculty?: string;
  banned?: boolean; // Add this
};

interface CreateStudentFormProps {
  onStudentCreated: () => void;
  studentToEdit?: User | null;
}

export default function CreateStudentForm({
  onStudentCreated,
  studentToEdit,
}: CreateStudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    studentId: "",
    faculty: "",
    banned: false, // Initialize as false
  });

  useEffect(() => {
    if (studentToEdit) {
      setIsEditMode(true);
      setForm({
        name: studentToEdit.name || "",
        email: studentToEdit.email || "",
        password: "",
        phone: studentToEdit.phone || "",
        studentId: studentToEdit.studentId || "",
        faculty: studentToEdit.faculty || "",
        banned: studentToEdit.banned ?? false, // Load existing value
      });
    } else {
      setIsEditMode(false);
      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        studentId: "",
        faculty: "",
        banned: false,
      });
    }
  }, [studentToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let url = "/api/admin/students";
      let method = "POST";

      if (isEditMode && studentToEdit?.id) {
        url = `/api/admin/students/${studentToEdit.id}`;
        method = "PATCH";
      }

      const submitData: any = { ...form };
      if (isEditMode) delete submitData.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");

      toast.success(isEditMode ? "Student updated" : "Student created");
      onStudentCreated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border rounded-2xl shadow-sm p-6 md:p-8 space-y-6"
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {isEditMode ? "Edit Student" : "Create Student"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input
            name="email"
            placeholder="Email Address"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          {!isEditMode && (
            <Input
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="md:col-span-2"
              required
            />
          )}
          <Input
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
          />
          <Input
            name="studentId"
            placeholder="Student ID"
            value={form.studentId}
            onChange={handleChange}
          />
          <Input
            name="faculty"
            placeholder="Faculty / Department"
            value={form.faculty}
            onChange={handleChange}
            className="md:col-span-2"
          />

          {/* Banned Toggle Component */}
          <div className="md:col-span-2 mt-2">
            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div className="flex items-center gap-3">
                {form.banned ? (
                  <BanIcon className="w-5 h-5 text-rose-500" />
                ) : (
                  <UserCheckIcon className="w-5 h-5 text-emerald-500" />
                )}
                <span className="text-sm font-medium">
                  {form.banned ? "Banned Account" : "Active Account"}
                </span>
              </div>
              <input
                name="banned"
                type="checkbox"
                checked={form.banned}
                onChange={handleChange}
                className="w-5 h-5 accent-rose-500"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 h-11 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          {loading
            ? "Saving..."
            : isEditMode
              ? "Update Student"
              : "Create Student"}
        </button>
      </form>
    </div>
  );
}
