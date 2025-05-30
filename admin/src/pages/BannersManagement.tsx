import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AppDialog as Dialog, AppDialogContent as DialogContent, AppDialogHeader as DialogHeader, AppDialogTitle as DialogTitle, AppDialogFooter as DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

// Banner type (sync with backend)
type Banner = {
  id?: string;
  _id?: string;
  title: string;
  subtitle?: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  alt: string;
  enabled: boolean;
  position: number;
  linkUrl?: string;
};

type BannerFormProps = {
  open: boolean;
  onClose: () => void;
  onSave: (banner: Partial<Banner>, fileDesktop?: File, fileMobile?: File) => void;
  initial?: Partial<Banner>;
  mainServerUrl: string;
};

function BannerForm({ open, onClose, onSave, initial, mainServerUrl }: BannerFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [alt, setAlt] = useState(initial?.alt || "");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [position, setPosition] = useState(initial?.position || 0);
  const [fileDesktop, setFileDesktop] = useState<File | null>(null);
  const [fileMobile, setFileMobile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState<string>(initial?.linkUrl || "");

  // Reset on open/close
  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setSubtitle(initial?.subtitle || "");
      setAlt(initial?.alt || "");
      setEnabled(initial?.enabled ?? true);
      setPosition(initial?.position || 0);
      setFileDesktop(null);
      setFileMobile(null);
      setLinkUrl(initial?.linkUrl || "");
    }
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Validate required files for new banner only
    if (!initial) {
      if (!fileDesktop) { alert("Desktop image is required"); return; }
      if (!fileMobile) { alert("Mobile image is required"); return; }
    }
    
    const bannerData = { 
      title, 
      subtitle, 
      alt, 
      enabled, 
      position,
      linkUrl
    };
    
    onSave(bannerData, fileDesktop ?? undefined, fileMobile ?? undefined);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit Banner" : "Add Banner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Subtitle</Label>
            <Input value={subtitle} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubtitle(e.target.value)} />
          </div>
          <div>
            <Label>Alt Text</Label>
            <Input value={alt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlt(e.target.value)} required />
          </div>
          <div>
            <Label>Link URL</Label>
            <Input
              type="url"
              value={linkUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkUrl(e.target.value)}
              placeholder="https://"
              className="w-full"
            />
          </div>
          <div>
            <Label>Position</Label>
            <Input type="number" value={position} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosition(parseInt(e.target.value) || 0)} min={0} className="w-full" />
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 min-w-0">
                <Label>Desktop Image</Label>
                <input 
                  type="file" 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFileDesktop(e.target.files?.[0] || null)} 
                  accept="image/*" 
                  className="w-full" 
                />
                {fileDesktop && (
                  <img
                    src={URL.createObjectURL(fileDesktop)}
                    alt={alt || "Desktop banner image"}
                    className="h-14 mt-2 rounded"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => { const img=e.target as HTMLImageElement; img.onerror=null; img.src=`${mainServerUrl}/uploads/banners/placeholder.png`; }}
                  />
                )}
              </div>
              <div className="space-y-2 min-w-0">
                <Label>Mobile Image</Label>
                <input 
                  type="file" 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFileMobile(e.target.files?.[0] || null)} 
                  accept="image/*" 
                  className="w-full" 
                />
                {fileMobile && (
                  <img
                    src={URL.createObjectURL(fileMobile)}
                    alt={alt || "Mobile banner image"}
                    className="h-14 mt-2 rounded"
                    onError={e => { const img=e.target as HTMLImageElement; img.onerror=null; img.src=import.meta.env.BASE_URL + "placeholder-mobile.png"; }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label>Enabled</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initial?.id ? "Update" : "Add"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BannersManagement() {
  const queryClient = useQueryClient();
  // Determine API base path dynamically
  const apiBase = import.meta.env.VITE_API_URL ?? '';
  const mainServerUrl = import.meta.env.VITE_API_URL ?? '';
  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>();

  // Use the Banner type consistently throughout the component
  // Fetch banners from the correct API endpoint
  const { data: bannersData = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/banners`, { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to fetch banners');
      }
      const data = await res.json();
      return data.sort((a: Banner, b: Banner) => (a.position || 0) - (b.position || 0));
    },
  });

  // Mutations for create, update, delete
  const createBanner = useMutation({
    mutationFn: (data: { banner: Partial<Banner>; fileDesktop?: File; fileMobile?: File }) => {
      const formData = new FormData();
      const { banner, fileDesktop, fileMobile } = data;
      const { title, subtitle, alt, enabled, position } = banner;
      const linkUrl = (banner.linkUrl as string) || "";
      formData.append('title', title!);
      if (subtitle !== undefined) formData.append('subtitle', subtitle!);
      formData.append('alt', alt!);
      if (enabled !== undefined) formData.append('enabled', enabled.toString());
      formData.append('position', (position ?? 0).toString());
      if (fileDesktop) {
        formData.append('desktopImage', fileDesktop);
      }
      if (fileMobile) {
        formData.append('mobileImage', fileMobile);
      }
      if (linkUrl) formData.append('linkUrl', linkUrl);
      return fetch(`${apiBase}/api/banners`, {
        method: "POST",
        credentials: 'include',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({ title: "Banner added" });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
    onError: (error: any) => toast({ title: (error as Error).message, variant: "destructive" }),
  });

  const updateBanner = useMutation({
    mutationFn: ({ id, banner, fileDesktop, fileMobile }: { id: string; banner: Partial<Banner>; fileDesktop?: File; fileMobile?: File }) => {
      console.log('[BANNER] Creating form data:', { id, banner, hasDesktop: !!fileDesktop, hasMobile: !!fileMobile });
      const formData = new FormData();
      // Append only provided fields to avoid overwriting unchanged data
      if (banner.title !== undefined) formData.append('title', banner.title as string);
      if (banner.subtitle !== undefined) formData.append('subtitle', banner.subtitle as string);
      if (banner.alt !== undefined) formData.append('alt', banner.alt as string);
      if (banner.enabled !== undefined) formData.append('enabled', banner.enabled.toString());
      if (banner.position !== undefined) formData.append('position', banner.position.toString());
      if (banner.linkUrl !== undefined) formData.append('linkUrl', banner.linkUrl as string);
      if (fileDesktop) formData.append('desktopImage', fileDesktop);
      if (fileMobile) formData.append('mobileImage', fileMobile);
      return fetch(`${apiBase}/api/banners/${id}`, {
        method: "PUT",
        credentials: 'include',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      toast({ title: "Banner updated" });
      setFormOpen(false);
      setEditingBanner(undefined);
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
    onError: (error: any) => toast({ title: (error as Error).message, variant: "destructive" }),
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${apiBase}/api/banners/${id}`, { method: "DELETE", credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to delete banner');
      return data;
    },
    onSuccess: () => {
      toast({ title: "Banner deleted" });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
    onError: () => toast({ title: "Failed to delete banner", variant: "destructive" }),
  });

  function handleSave(banner: Partial<Banner>, fileDesktop?: File, fileMobile?: File) {
    if (editingBanner) {
      // Always use id fallback to _id
      const editId = editingBanner.id || editingBanner._id;
      updateBanner.mutate({ id: editId!, banner, fileDesktop, fileMobile });
    } else {
      createBanner.mutate({ banner, fileDesktop, fileMobile });
    }
    setFormOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading text-primary mb-1">Banner Management</h1>
        <Button onClick={() => { setEditingBanner(undefined); setFormOpen(true); }}>Add Banner</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Banners</CardTitle>
          <CardDescription>Manage homepage banners for your store</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th>Desktop</th>
                    <th>Mobile</th>
                    <th>Title</th>
                    <th>Alt</th>
                    <th>Enabled</th>
                    <th>Position</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bannersData?.map((banner: Banner) => (
                    <tr key={banner.id || banner._id} className="border-b">
                      <td>
                        <img
                          src={(() => {
                            const imageUrl = banner.desktopImageUrl;
                            if (!imageUrl) return `${mainServerUrl}/uploads/banners/placeholder.png`;
                            
                            // If it's a Cloudinary URL, ensure HTTPS
                            if (imageUrl.includes('cloudinary.com') && imageUrl.startsWith('http://')) {
                              return imageUrl.replace('http://', 'https://');
                            }
                            
                            return imageUrl;
                          })()}
                          alt={banner.alt ? banner.alt : "Desktop banner image"}
                          className="h-12 rounded"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            const img = e.target as HTMLImageElement;
                            img.onerror = null;
                            img.src = `${mainServerUrl}/uploads/banners/placeholder.png`;
                          }}
                        />
                      </td>
                      <td>
                        <img
                          src={(() => {
                            const imageUrl = banner.mobileImageUrl;
                            if (!imageUrl) return `${mainServerUrl}/uploads/banners/placeholder.png`;
                            
                            // If it's a Cloudinary URL, ensure HTTPS
                            if (imageUrl.includes('cloudinary.com') && imageUrl.startsWith('http://')) {
                              return imageUrl.replace('http://', 'https://');
                            }
                            
                            return imageUrl;
                          })()}
                          alt={banner.alt ? banner.alt : "Mobile banner image"}
                          className="h-12 rounded"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            const img = e.target as HTMLImageElement;
                            img.onerror = null;
                            img.src = `${mainServerUrl}/uploads/banners/placeholder.png`;
                          }}
                        />
                      </td>
                      <td>{banner.title}</td>
                      <td>{banner.alt}</td>
                      <td>
                        <Switch checked={banner.enabled} onCheckedChange={checked => updateBanner.mutate({ id: banner.id || banner._id!, banner: { enabled: checked } })} />
                      </td>
                      <td>
                        <Input
                          type="number"
                          value={banner.position || 0}
                          className="w-20"
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newPosition = parseInt(e.target.value);
                            if (!isNaN(newPosition)) {
                              updateBanner.mutate({
                                id: banner.id || banner._id!,
                                banner: { position: newPosition }
                              });
                            }
                          }}
                        />
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (banner.id || banner._id) {
                              setEditingBanner(banner);
                              setFormOpen(true);
                            }
                          }}
                          disabled={!(banner.id || banner._id)}
                          title={(banner.id || banner._id) ? "Edit banner" : "Missing banner.id"}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            const id = banner.id || banner._id;
                            if (typeof id === 'string') {
                              deleteBanner.mutate(id);
                            }
                          }}
                          className="ml-2"
                          disabled={!(banner.id || banner._id)}
                          title={(banner.id || banner._id) ? "Delete banner" : "Missing banner.id"}
                        >
                          Delete
                        </Button>
                        {!(banner.id || banner._id) && (
                          <span className="text-xs text-red-600 ml-2">Missing ID</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <BannerForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingBanner(undefined); }}
        onSave={handleSave}
        initial={editingBanner}
        mainServerUrl={mainServerUrl}
      />
    </div>
  );
}
