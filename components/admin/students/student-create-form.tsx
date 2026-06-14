"use client";

import { useState } from "react";
import { toast } from "sonner";

type FormData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  studentId?: string;
  faculty?: string;
};

export default function CreateStudentForm() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    studentId: "",
    faculty: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      toast.success("Student created successfully");

      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        studentId: "",
        faculty: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-xl border"
    >
      <h2 className="text-lg font-bold">Create Student</h2>

      <input
        name="name"
        placeholder="Name"
        onChange={handleChange}
        className="input"
      />
      <input
        name="email"
        placeholder="Email"
        onChange={handleChange}
        className="input"
      />
      <input
        name="password"
        placeholder="Password"
        onChange={handleChange}
        className="input"
      />
      <input
        name="phone"
        placeholder="Phone"
        onChange={handleChange}
        className="input"
      />
      <input
        name="studentId"
        placeholder="Student ID"
        onChange={handleChange}
        className="input"
      />
      <input
        name="faculty"
        placeholder="Faculty"
        onChange={handleChange}
        className="input"
      />

      <button
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Creating..." : "Create Student"}
      </button>
    </form>
  );
}
