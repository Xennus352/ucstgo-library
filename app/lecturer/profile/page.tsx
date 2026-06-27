"use client";

import { ProfileTab } from "@/components/students/tabs/ProfileTab";
import React, { useState, useEffect, useCallback } from "react";
import { getUserProfileData } from "@/app/actions/profile";
import { toast } from "sonner";

const ProfilePage = () => {
  const [profileData, setProfileData] = useState<{
    borrowRecords: any[];
    reservations: any[];
  }>({
    borrowRecords: [],
    reservations: [],
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const loadProfileDetails = useCallback(async () => {
    try {
      setIsProfileLoading(true);
      const res = await getUserProfileData();
      if (res.success && res.data) {
        setProfileData(res.data);
      } else {
        toast.error(res.error || "Could not synchronize history items");
      }
    } catch (err) {
      toast.error("Network error sync failure");
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileDetails();
  }, [loadProfileDetails]);

  if (isProfileLoading) {
    return (
      <div className="text-center py-20 text-muted-foreground animate-pulse">
        Checking your profile logs...
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Pass the newly isolated fetch states directly down to your existing UI tab */}
      <ProfileTab
        borrowRecords={profileData.borrowRecords}
        reservations={profileData.reservations}
      />
    </div>
  );
};

export default ProfilePage;
