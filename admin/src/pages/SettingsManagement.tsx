import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
// Import UI components
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function SettingsManagement() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/settings');
      return res.json();
    }
  });

  const [siteName, setSiteName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [shiprocketApiKey, setShiprocketApiKey] = useState('');
  const [shiprocketApiSecret, setShiprocketApiSecret] = useState('');
  const [shiprocketSourcePincode, setShiprocketSourcePincode] = useState('');
  const [shiprocketPickupLocation, setShiprocketPickupLocation] = useState('');
  const [shiprocketChannelId, setShiprocketChannelId] = useState<number>(0);

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || '');
      setSupportEmail(settings.supportEmail || '');
      setMaintenanceMode(!!settings.maintenanceMode);
      setTaxEnabled(!!settings.taxEnabled);
      setTaxPercentage(settings.taxPercentage || 0);
      setRazorpayKeyId(settings.razorpayKeyId || '');
      setRazorpayKeySecret(settings.razorpayKeySecret || '');
      setShiprocketApiKey(settings.shiprocketApiKey || '');
      setShiprocketApiSecret(settings.shiprocketApiSecret || '');
      setShiprocketSourcePincode(settings.shiprocketSourcePincode || '');
      setShiprocketPickupLocation(settings.shiprocketPickupLocation || '');
      setShiprocketChannelId(settings.shiprocketChannelId || 0);
    }
  }, [settings]);

  const { mutate: updateSettings, isPending } = useMutation({
    mutationFn: async () => {
      const payload = { 
        // General Settings
        siteName, 
        supportEmail, 
        maintenanceMode, 
        
        // Tax Settings
        taxEnabled,
        taxPercentage,
        
        // Payment Settings
        razorpayKeyId, 
        razorpayKeySecret, 
        
        // Shipping Settings
        shiprocketApiKey, 
        shiprocketApiSecret, 
        shiprocketSourcePincode, 
        shiprocketPickupLocation, 
        shiprocketChannelId 
      };
      const res = await apiRequest('PUT', '/api/admin/settings', payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Settings updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error updating settings', description: err.message, variant: 'destructive' });
    }
  });

  const isUpdating = isPending;
  const { mutate: backupDatabase, isPending: isBackingUp } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/backup');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Backup failed');
      return data;
    },
    onSuccess: (data) => {
      toast({ title: 'Database backup created', description: `Download link: ${data.downloadLink}` });
    },
    onError: (err: any) => {
      toast({ title: 'Database backup failed', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-lg">Loading settings...</div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-primary mb-6">Store Settings</h1>
      
      <div className="space-y-8 max-w-3xl">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={supportEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupportEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="maintenanceMode"
                checked={maintenanceMode}
                onCheckedChange={(checked: boolean) => setMaintenanceMode(checked)}
              />
              <Label htmlFor="maintenanceMode" className="font-medium">Maintenance Mode</Label>
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Tax Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="taxEnabled"
                checked={taxEnabled}
                onCheckedChange={(checked: boolean) => setTaxEnabled(checked)}
              />
              <Label htmlFor="taxEnabled" className="font-medium">Enable Tax Calculation</Label>
            </div>
            <div className={!taxEnabled ? 'opacity-50' : ''}>
              <Label htmlFor="taxPercentage" className="block text-sm font-medium mb-1">Tax Percentage (%)</Label>
              <div className="flex items-center">
                <Input
                  id="taxPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={taxPercentage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaxPercentage(Number(e.target.value))}
                  disabled={!taxEnabled}
                  className="w-32"
                />
                <span className="ml-2">%</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This tax rate will be applied to all orders at checkout.
                Taxes will be calculated based on the order subtotal.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Payment Gateway</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                <Input
                  id="razorpayKeyId"
                  value={razorpayKeyId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRazorpayKeyId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
                <Input
                  id="razorpayKeySecret"
                  type="password"
                  value={razorpayKeySecret}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRazorpayKeySecret(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Shipping Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shiprocketApiKey">Shiprocket API Key</Label>
                <Input
                  id="shiprocketApiKey"
                  value={shiprocketApiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShiprocketApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shiprocketApiSecret">Shiprocket API Secret</Label>
                <Input
                  id="shiprocketApiSecret"
                  type="password"
                  value={shiprocketApiSecret}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShiprocketApiSecret(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shiprocketSourcePincode">Source Pincode</Label>
                <Input
                  id="shiprocketSourcePincode"
                  value={shiprocketSourcePincode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShiprocketSourcePincode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shiprocketPickupLocation">Pickup Location</Label>
                <Input
                  id="shiprocketPickupLocation"
                  value={shiprocketPickupLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShiprocketPickupLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiprocketChannelId">Channel ID</Label>
              <Input
                id="shiprocketChannelId"
                type="number"
                className="max-w-[150px]"
                value={shiprocketChannelId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShiprocketChannelId(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
        
        {/* Backup Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Backup Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => backupDatabase()}
              disabled={isBackingUp}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
            >
              {isBackingUp ? 'Backing Up...' : 'Backup Database'}
            </Button>
          </CardContent>
        </Card>
        
        <div className="pt-4">
          <Button
            onClick={() => updateSettings()}
            disabled={isUpdating}
            className="px-6 py-2"
          >
            {isUpdating ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
