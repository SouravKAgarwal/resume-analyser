"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateUser } from "@/lib/auth-client";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export function ProfileForm({
  name: initialName,
  email,
  image: initialImage,
}: {
  name: string;
  email: string;
  image: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState<string | null>(initialImage);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const dirty = name.trim() !== initialName || image !== initialImage;

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name can't be empty.");
      return;
    }
    setSaving(true);
    const { error } = await updateUser({ name: trimmed, image: image ?? undefined });
    setSaving(false);
    if (error) {
      toast.error(error.message ?? "Couldn't save your profile.");
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* avatar */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-16">
          {image && <AvatarImage src={image} alt="" />}
          <AvatarFallback className="text-lg">{initialsOf(name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <UploadButton
            endpoint="avatarUploader"
            onUploadBegin={() => setUploading(true)}
            onClientUploadComplete={(files) => {
              setUploading(false);
              const url = files[0]?.serverData?.url;
              if (url) {
                setImage(url);
                toast.success("Image uploaded — save to apply.");
              }
            }}
            onUploadError={(e) => {
              setUploading(false);
              toast.error(e.message);
            }}
            appearance={{
              button:
                "bg-secondary text-foreground border-border h-7.5 rounded-md border px-3 text-sm font-medium ut-uploading:opacity-70",
            }}
            content={{
              button: ({ ready }) =>
                uploading ? "Uploading…" : ready ? "Change photo" : "Preparing…",
              allowedContent: "PNG / JPG · up to 2 MB",
            }}
          />
          {image && (
            <button
              type="button"
              onClick={() => setImage(null)}
              className="text-muted-foreground hover:text-foreground block text-xs underline"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      {/* name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          autoComplete="name"
        />
      </div>

      {/* email — read only */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={email} disabled readOnly />
        <p className="text-muted-foreground text-xs">Your email can&rsquo;t be changed here.</p>
      </div>

      <Button onClick={save} disabled={saving || uploading || !dirty}>
        {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Save changes
      </Button>
    </div>
  );
}
