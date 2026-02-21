import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import mimeLogo from "@/assets/mime-logo.png";
import { ArrowLeft, Save, Store, Globe, Upload, User, Mail, X } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeName, setStoreName] = useState("");
  const [domain, setDomain] = useState("");
  const [storeLogoUrl, setStoreLogoUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setStoreName(data.store_name || "");
        setDomain(data.domain || "");
        setStoreLogoUrl(data.store_logo_url || "");
        setDisplayName(data.display_name || "");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("store-logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("store-logos").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`;
    setStoreLogoUrl(publicUrl);
    setUploading(false);
    toast({ title: "Uploaded", description: "Logo uploaded successfully." });
  };

  const removeLogo = () => {
    setStoreLogoUrl("");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        store_name: storeName,
        domain,
        store_logo_url: storeLogoUrl,
        display_name: displayName,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully." });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center px-4 md:px-6">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>
        <img src={mimeLogo} alt="MIME" className={`h-8 ml-4 ${theme === "dark" ? "brightness-0 invert" : ""}`} />
      </header>

      <main className="max-w-lg mx-auto p-6 space-y-8 mt-8">
        <div>
          <h1 className="text-2xl font-bold font-heading">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and store information.</p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> Email</Label>
            <Input value={user?.email || ""} disabled className="opacity-60" />
          </div>

          <div className="border-t border-border/50 pt-5">
            <h2 className="text-lg font-semibold font-heading mb-4">Store Information</h2>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Store className="h-3.5 w-3.5" /> Store Name</Label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Awesome Store" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Globe className="h-3.5 w-3.5" /> Domain</Label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2"><Upload className="h-3.5 w-3.5" /> Store Logo</Label>
            {storeLogoUrl ? (
              <div className="flex items-center gap-4">
                <img src={storeLogoUrl} alt="Store logo" className="h-16 w-16 rounded-xl object-cover border border-border" />
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? "Uploading..." : "Change"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={removeLogo} className="text-destructive hover:text-destructive">
                    <X className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Upload className="h-6 w-6" />
                <span className="text-sm">{uploading ? "Uploading..." : "Click to upload logo"}</span>
                <span className="text-xs text-muted-foreground">PNG, JPG, SVG · Max 2MB</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full h-11">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </main>
    </div>
  );
}
