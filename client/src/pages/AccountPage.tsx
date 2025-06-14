import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Order } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from 'react-helmet';
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient"; // Assuming apiRequest is defined in this file
import { useToast } from "@/hooks/use-toast"; // Assuming useToast is defined in this file

export default function AccountPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout, updateProfile } = useAuth();
  console.log('AccountPage user context:', user);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Redirect to login after auth state resolves
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login?redirect=/account");
    }
  }, [authLoading, isAuthenticated, navigate]);
  
  // --- Normalize user ID & pagination state ---
  const normalizedUserId = user?.id;
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data = { orders: [], total: 0 }, isLoading: ordersLoading } = useQuery<{
    orders: Order[];
    total: number;
  }>({
    queryKey: [`/api/orders?userId=${normalizedUserId}&page=${page}&limit=${limit}`],
    queryFn: async () => {
      if (!normalizedUserId) return { orders: [], total: 0 };
      const res = await apiRequest(
        'GET',
        `/api/orders?userId=${normalizedUserId}&page=${page}&limit=${limit}`
      );
      const json = await res.json();
      if (Array.isArray(json)) {
        return { orders: json, total: json.length };
      }
      return json;
    },
    enabled: !!normalizedUserId,
    refetchInterval: 10000,
  });
  
  const [editingAddress, setEditingAddress] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });
  useEffect(() => {
    if (user) setFormData({
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      zipCode: user.zipCode || "",
      phone: user.phone || "",
    });
  }, [user]);
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setEditingAddress(false);
  };
  
  // --- Edit Profile State ---
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  // --- Change Password State ---
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  // --- Profile Edit Handler ---
  const handleProfileEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setEditingProfile(false);
      toast({ title: 'Profile updated!' });
    } catch (err) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  };
  // --- Password Change Handler ---
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'User not loaded', variant: 'destructive' });
      return;
    }
    try {
      await apiRequest('POST', `/api/users/${user.id}/password`, passwordForm);
      setChangingPassword(false);
      toast({ title: 'Password updated!' });
    } catch (err) {
      toast({ title: 'Failed to update password', variant: 'destructive' });
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout successful",
        description: "You have been logged out."
      });
    } catch {
      toast({
        title: "Logout failed",
        description: "Could not log out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Show nothing while auth is loading or redirecting (after all hooks)
  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>My Account | Kama Ayurveda</title>
        <meta name="description" content="Manage your account and view your orders." />
      </Helmet>
      
      <div className="bg-neutral-cream py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-heading text-4xl text-primary text-center mb-2">My Account</h1>
          {user?.name && (
            <p className="text-center text-neutral-gray mb-0">Welcome back, {user.name}!</p>
          )}
        </div>
      </div>
      
      <div className="container max-w-5xl mx-auto px-4 py-12 -mt-8">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full bg-white shadow-sm rounded-lg justify-center mb-8 p-1 gap-2">
            <TabsTrigger 
              value="profile" 
              className="font-heading text-sm text-primary data-[state=active]:bg-primary data-[state=active]:text-white rounded-md flex-1 max-w-[200px] py-3"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="font-heading text-sm text-primary data-[state=active]:bg-primary data-[state=active]:text-white rounded-md flex-1 max-w-[200px] py-3"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger 
              value="addresses" 
              className="font-heading text-sm text-primary data-[state=active]:bg-primary data-[state=active]:text-white rounded-md flex-1 max-w-[200px] py-3"
            >
              Addresses
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="bg-primary/5 p-6 border-b border-neutral-sand">
                    <h2 className="font-heading text-xl text-primary">Profile Information</h2>
                    <p className="text-sm text-neutral-gray mt-1">Manage your personal information</p>
                  </div>
                  <div className="p-8">
                    {editingProfile ? (
                      <form onSubmit={handleProfileEdit} className="space-y-4">
                        <input
                          placeholder="Name"
                          value={profileForm.name}
                          onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full border px-3 py-2 rounded"
                          required
                        />
                        <input
                          placeholder="Email"
                          type="email"
                          value={profileForm.email}
                          onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full border px-3 py-2 rounded"
                          required
                        />
                        <input
                          placeholder="Phone"
                          value={profileForm.phone}
                          onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full border px-3 py-2 rounded"
                          required
                        />
                        <div className="flex gap-2">
                          <Button type="submit">Save</Button>
                          <Button variant="ghost" onClick={() => setEditingProfile(false)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-neutral-50 rounded-lg p-6">
                          <label className="block text-sm font-medium text-neutral-gray mb-2">Name</label>
                          <p className="font-medium text-lg">{user?.name || "Not provided"}</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-6">
                          <label className="block text-sm font-medium text-neutral-gray mb-2">Email</label>
                          <p className="font-medium text-lg">{user?.email}</p>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-6">
                          <label className="block text-sm font-medium text-neutral-gray mb-2">Phone</label>
                          <p className="font-medium text-lg">{user?.phone || "Not provided"}</p>
                        </div>
                      </div>
                    )}
                    {!editingProfile && (
                      <div className="mt-6">
                        <Button 
                          variant="outline"
                          className="border-primary text-primary hover:bg-primary hover:text-white"
                          onClick={() => setEditingProfile(true)}
                        >
                          Edit Profile
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="bg-primary/5 p-6 border-b border-neutral-sand">
                    <h2 className="font-heading text-xl text-primary">Change Password</h2>
                    <p className="text-sm text-neutral-gray mt-1">Update your account password</p>
                  </div>
                  <div className="p-6">
                    {changingPassword ? (
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <input
                          placeholder="Current Password"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full border px-3 py-2 rounded"
                          required
                        />
                        <input
                          placeholder="New Password"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full border px-3 py-2 rounded"
                          required
                        />
                        <input
                          placeholder="Confirm New Password"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full border px-3 py-2 rounded"
                          required
                        />
                        <div className="flex gap-2">
                          <Button type="submit">Update Password</Button>
                          <Button variant="ghost" onClick={() => setChangingPassword(false)}>Cancel</Button>
                        </div>
                      </form>
                    ) : (
                      <Button 
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => setChangingPassword(true)}
                      >
                        Change Password
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white shadow-md rounded-lg overflow-hidden sticky top-8">
                  <div className="bg-primary/5 p-6 border-b border-neutral-sand">
                    <h2 className="font-heading text-xl text-primary">Account Actions</h2>
                    <p className="text-sm text-neutral-gray mt-1">Manage your account settings</p>
                  </div>
                  <div className="p-6">
                    <Button 
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white mb-4"
                    >
                      Logout
                    </Button>
                    <Button 
                      variant="ghost"
                      className="w-full text-neutral-gray hover:text-red-500"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="orders" className="mt-0">
            {ordersLoading ? (
              <div>Loading orders...</div>
            ) : data.orders.length === 0 ? (
              <div>No orders found.</div>
            ) : (
              <>
                <div className="space-y-4">
                  {data.orders.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded shadow">
                      <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                      <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                      <p>Status: {order.status}</p>
                      <p>Total: ₹{order.totalAmount.toFixed(2)}</p>
                      <Button onClick={() => navigate(`/orders/${order.id}`)}>View Details</Button>
                    </div>
                  ))}
                </div>
                {/* Pagination controls */}
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {page} of {Math.ceil(data.total / limit)}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= Math.ceil(data.total / limit)}
                    onClick={() => setPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="addresses" className="mt-0">
            <div className="border border-neutral-sand rounded-md overflow-hidden">
              <div className="bg-neutral-cream p-4 border-b border-neutral-sand">
                <h2 className="font-heading text-lg text-primary">Saved Addresses</h2>
              </div>
              <div className="p-6">
                {editingAddress ? (
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <input
                      placeholder="Address"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                    <input
                      placeholder="City"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                    <input
                      placeholder="State"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                    <input
                      placeholder="Zip Code"
                      value={formData.zipCode}
                      onChange={e => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                    <input
                      placeholder="Phone"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border px-3 py-2 rounded"
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit">Save Address</Button>
                      <Button variant="ghost" onClick={() => setEditingAddress(false)}>Cancel</Button>
                    </div>
                  </form>
                ) : user?.address ? (
                  <div className="border border-neutral-sand rounded-md p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <p className="font-medium">Default Address</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={() => setEditingAddress(true)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-red-500">Delete</Button>
                      </div>
                    </div>
                    <p>{user.name}</p>
                    <p>{user.address}</p>
                    <p>{user.city}, {user.state} {user.zipCode}</p>
                    <p>{user.phone}</p>
                  </div>
                ) : (
                  <p className="text-neutral-gray mb-4">You don't have any saved addresses yet.</p>
                )}
                {!editingAddress && (
                  <Button className="bg-primary hover:bg-primary-light text-white" onClick={() => setEditingAddress(true)}>
                    Add New Address
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
