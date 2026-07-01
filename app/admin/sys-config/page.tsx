import React from "react";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getLibrarySettings } from "@/app/actions/settings"; 

const SystemConfiguration = async () => {
  const settings = await getLibrarySettings();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <SettingsForm initialSettings={settings} />
    </div>
  );
};

export default SystemConfiguration;
