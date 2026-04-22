"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader, ImageUploaderValue } from "@/components/image-uploader";

export function SettingsForm({
  name: initialName,
  email,
  image: initialImage,
}: {
  name: string;
  email: string;
  image: string;
}) {
  const t = useTranslations();
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState(initialImage);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image }),
      }).then((r) => r.json());

      if (res.code === 0) {
        toast.success(t("dashboard.settings.saved"));
      } else {
        toast.error(res.message || t("dashboard.settings.save_failed"));
      }
    } catch {
      toast.error(t("dashboard.settings.save_failed"));
    } finally {
      setSaving(false);
    }
  }

  function handleAvatarChange(items: ImageUploaderValue[]) {
    const uploaded = items.find((item) => item.status === "uploaded" && item.url);
    setImage(uploaded?.url || "");
  }

  return (
    <form onSubmit={handleSave} className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.settings.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.settings.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.settings.profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-6">
          <div className="space-y-2">
            <Label>{t("dashboard.settings.avatar")}</Label>
            <ImageUploader
              defaultPreviews={image ? [image] : []}
              onChange={handleAvatarChange}
              maxSizeMB={0.5}
              emptyHint={t("dashboard.settings.avatar_hint")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{t("dashboard.settings.name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("dashboard.settings.email")}</Label>
            <Input id="email" value={email} disabled className="opacity-60" />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? t("dashboard.settings.saving") : t("dashboard.settings.save")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
