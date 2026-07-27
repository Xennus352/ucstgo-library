import React from "react";
import fs from "fs/promises";
import path from "path";
import {
  Settings,
  Palette,
  GraduationCap,
  Bell,
  CheckSquare,
  BookMarked,
  Database,
} from "lucide-react";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getLibrarySettings } from "@/app/actions/settings";
import { getAllSemesters } from "@/app/actions/semesters";
import { AddSemesterForm } from "@/components/admin/AddSemesterForm";
import DeleteSemesterButton from "@/components/admin/DeleteSemesterButton";
import UpdateBrandForm from "@/components/admin/updateBrand";
import { NoticeBoardManager } from "@/components/admin/NoticeBoardManager";
import { LibraryRulesManager } from "@/components/admin/LibraryRulesManager";
import { getNotices } from "@/app/actions/notice";
import { getLibraryRules } from "@/app/actions/library-rules";
import { BackupDataButton } from "@/components/admin/BackupDataButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SystemConfiguration = async () => {
  const [settings, semestersRes, noticesRes, rulesRes] = await Promise.all([
    getLibrarySettings(),
    getAllSemesters(),
    getNotices(),
    getLibraryRules(),
  ]);

  const configPath = path.join(process.cwd(), "config", "brand.ts");
  let initialName = "UCSTGO Library";
  let initialLogo = "/images/brand.jpg";
  let initialFavicon = "/icon.png";
  let initialTitle = "UCSTGO Digital Library";
  try {
    const configText = await fs.readFile(configPath, "utf8");
    initialName = configText.match(/name:\s*"([^"]+)"/)?.[1] ?? initialName;
    initialLogo = configText.match(/logo:\s*"([^"]+)"/)?.[1] ?? initialLogo;
    initialFavicon =
      configText.match(/favicon:\s*"([^"]+)"/)?.[1] ?? initialFavicon;
    initialTitle = configText.match(/title:\s*"([^"]+)"/)?.[1] ?? initialTitle;
  } catch {}

  const semesters = semestersRes.success ? semestersRes.data : [];
  const notices = noticesRes.success && noticesRes.data ? noticesRes.data : [];
  const rules = rulesRes.success && rulesRes.data ? rulesRes.data : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          System Configuration
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage global configurations, branding, and academic semesters.
        </p>
      </div>

      <Tabs defaultValue="settings">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto"
        >
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="size-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="size-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="semesters" className="gap-2">
            <GraduationCap className="size-4" />
            Semesters
          </TabsTrigger>
          <TabsTrigger value="notice-board" className="gap-2">
            <Bell className="size-4" />
            Notice Board
          </TabsTrigger>
          <TabsTrigger value="library-rules" className="gap-2">
            <CheckSquare className="size-4" />
            Library Rules
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Database className="size-4" />
            Backup
          </TabsTrigger>
       
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <SettingsForm initialSettings={settings} />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <UpdateBrandForm
            initialName={initialName}
            initialLogo={initialLogo}
            initialFavicon={initialFavicon}
            initialTitle={initialTitle}
          />
        </TabsContent>

        <TabsContent value="semesters" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Semesters</CardTitle>
              <CardDescription>
                Add and manage semesters used for organizing catalog e-books.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <AddSemesterForm />

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Existing Semesters
                </h3>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {semesters?.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-8 text-center">
                      No semesters added yet.
                    </p>
                  ) : (
                    semesters?.map((sem) => (
                      <div
                        key={sem.id}
                        className="flex items-center justify-between p-3 bg-card border rounded-lg text-sm hover:bg-accent/50 transition-colors"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-medium truncate">{sem.name}</p>
                          <span className="text-xs text-muted-foreground font-mono">
                            {sem.slug}
                          </span>
                        </div>
                        <DeleteSemesterButton semesterId={sem.id} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notice-board" className="mt-6">
          <NoticeBoardManager notices={notices} />
        </TabsContent>

        <TabsContent value="library-rules" className="mt-6">
          <LibraryRulesManager rules={rules} />
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Backup</CardTitle>
              <CardDescription>
                Download a complete SQL dump of all database tables and data.
                Only administrators can perform backups.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupDataButton />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemConfiguration;
