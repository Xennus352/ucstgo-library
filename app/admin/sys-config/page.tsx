import React from "react";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getLibrarySettings } from "@/app/actions/settings";
import { getAllSemesters } from "@/app/actions/semesters";
import { AddSemesterForm } from "@/components/admin/AddSemesterForm";
import DeleteSemesterButton from "@/components/admin/DeleteSemesterButton";

const SystemConfiguration = async () => {
  const [settings, semestersRes] = await Promise.all([
    getLibrarySettings(),
    getAllSemesters(),
  ]);

  const semesters = semestersRes.success ? semestersRes.data : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          System Configuration
        </h1>
        <p className="text-sm text-neutral-500">
          Manage global configurations, variables, and academic slots.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Main Key-Value Library Configuration Settings Form */}

        <div className="border rounded-xl p-5 bg-white shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Academic Semesters
            </h2>
            <p className="text-xs text-neutral-500">
              Add slots used for organizing catalog e-books.
            </p>
          </div>

          <AddSemesterForm />

          <div className="space-y-2 max-h-[320px] overflow-y-auto pt-2 border-t">
            {semesters?.length === 0 ? (
              <p className="text-xs text-neutral-400 italic">
                No semesters added yet.
              </p>
            ) : (
              semesters?.map((sem) => (
                <div
                  key={sem.id}
                  className="flex items-center justify-between p-2.5 bg-neutral-50 border rounded-lg text-sm"
                >
                  <div>
                    <p className="font-medium text-neutral-800">{sem.name}</p>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {sem.slug}
                    </span>
                  </div>
                  <DeleteSemesterButton semesterId={sem.id} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Card layout for Dynamic Semesters Management */}
        <div className="lg:col-span-2">
          <SettingsForm initialSettings={settings} />
        </div>
      </div>
    </div>
  );
};

export default SystemConfiguration;
