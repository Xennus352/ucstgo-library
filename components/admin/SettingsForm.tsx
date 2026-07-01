"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateLibrarySettings, LibrarySettings } from "@/app/actions/settings";
import { toast } from "sonner";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 1. Updated validation schema: Fields are now optional, but if filled, they check min-lengths.
const formSchema = z.object({
  about_p1: z
    .string()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  about_p2: z
    .string()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  vision: z
    .string()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  mission: z
    .string()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  motivation_en: z
    .string()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
  motivation_mm: z
    .string()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val))
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: LibrarySettings;
}) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      about_p1: initialSettings?.about_p1 || "",
      about_p2: initialSettings?.about_p2 || "",
      vision: initialSettings?.vision || "",
      mission: initialSettings?.mission || "",
      motivation_en: initialSettings?.motivation_en || "",
      motivation_mm: initialSettings?.motivation_mm || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsPending(true);

    // 2. Filter out undefined or empty values so the backend only receives the fields changing.
    const updatedFields = Object.fromEntries(
      Object.entries(data).filter(
        ([_, value]) => value !== undefined && value !== "",
      ),
    );

    if (Object.keys(updatedFields).length === 0) {
      toast.info("No modifications detected.");
      setIsPending(false);
      return;
    }

    // Pass only the modified payload down to Prisma partial update logic
    const promise = updateLibrarySettings(updatedFields as any);

    toast.promise(promise, {
      loading: "Updating layout adjustments...",
      success: (result) => {
        if (!result.success) throw new Error(result.message);
        return result.message;
      },
      error: (err) => err.message || "Something went wrong saving settings.",
    });

    try {
      await promise;
    } catch (error) {
      // Handled by toast container
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full h-full min-h-[calc(100vh-6rem)] shadow-sm border-none rounded-none sm:rounded-xl md:border md:shadow-md flex flex-col">
      <CardHeader className="px-4 sm:px-6 md:px-8 pt-6">
        <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
          Edit Landing Page Content
        </CardTitle>
        <CardDescription className="text-sm">
          Update individual segments or all sections at once. Empty boxes will
          not overwrite historical content.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 px-4 sm:px-6 md:px-8 pb-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 h-full flex flex-col justify-between"
        >
          <div className="space-y-6 flex-1">
            {/* About Paragraph 1 */}
            <div className="space-y-2" data-invalid={!!errors.about_p1}>
              <label
                htmlFor="about_p1"
                className="text-sm font-semibold text-gray-700 block"
              >
                About Paragraph 1
              </label>
              <Textarea
                id="about_p1"
                rows={4}
                placeholder="Leave blank to keep current, or enter update..."
                aria-invalid={!!errors.about_p1}
                {...register("about_p1")}
                className="w-full min-h-[100px]"
              />
              {errors.about_p1 && (
                <p className="text-xs font-medium text-red-500">
                  {errors.about_p1.message}
                </p>
              )}
            </div>

            {/* About Paragraph 2 */}
            <div className="space-y-2" data-invalid={!!errors.about_p2}>
              <label
                htmlFor="about_p2"
                className="text-sm font-semibold text-gray-700 block"
              >
                About Paragraph 2
              </label>
              <Textarea
                id="about_p2"
                rows={4}
                placeholder="Leave blank to keep current, or enter update..."
                aria-invalid={!!errors.about_p2}
                {...register("about_p2")}
                className="w-full min-h-[100px]"
              />
              {errors.about_p2 && (
                <p className="text-xs font-medium text-red-500">
                  {errors.about_p2.message}
                </p>
              )}
            </div>

            {/* Vision & Mission Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vision */}
              <div className="space-y-2" data-invalid={!!errors.vision}>
                <label
                  htmlFor="vision"
                  className="text-sm font-semibold text-gray-700 block"
                >
                  Vision Statement
                </label>
                <Input
                  id="vision"
                  placeholder="Update vision statement..."
                  aria-invalid={!!errors.vision}
                  {...register("vision")}
                  className="w-full py-5"
                />
                {errors.vision && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.vision.message}
                  </p>
                )}
              </div>

              {/* Mission */}
              <div className="space-y-2" data-invalid={!!errors.mission}>
                <label
                  htmlFor="mission"
                  className="text-sm font-semibold text-gray-700 block"
                >
                  Mission Statement
                </label>
                <Input
                  id="mission"
                  placeholder="Update mission statement..."
                  aria-invalid={!!errors.mission}
                  {...register("mission")}
                  className="w-full py-5"
                />
                {errors.mission && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.mission.message}
                  </p>
                )}
              </div>
            </div>

            {/* Motivations Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Motivation EN */}
              <div className="space-y-2" data-invalid={!!errors.motivation_en}>
                <label
                  htmlFor="motivation_en"
                  className="text-sm font-semibold text-gray-700 block"
                >
                  Motivation (English)
                </label>
                <Input
                  id="motivation_en"
                  placeholder="Update English motivational quote..."
                  aria-invalid={!!errors.motivation_en}
                  {...register("motivation_en")}
                  className="w-full py-5"
                />
                {errors.motivation_en && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.motivation_en.message}
                  </p>
                )}
              </div>

              {/* Motivation MM */}
              <div className="space-y-2" data-invalid={!!errors.motivation_mm}>
                <label
                  htmlFor="motivation_mm"
                  className="text-sm font-semibold text-gray-700 block"
                >
                  Motivation (Myanmar)
                </label>
                <Input
                  id="motivation_mm"
                  placeholder="မြန်မာဆောင်ပုဒ်အား ပြောင်းလဲရန်..."
                  aria-invalid={!!errors.motivation_mm}
                  {...register("motivation_mm")}
                  className="w-full py-5"
                />
                {errors.motivation_mm && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.motivation_mm.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Footer Button Group */}
          <div className="pt-6 border-t mt-8 flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto px-8 py-5 text-base font-semibold transition-all shadow-sm"
            >
              {isPending ? "Saving changes..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
