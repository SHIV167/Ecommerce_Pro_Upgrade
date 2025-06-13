import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { apiRequest } from '@/lib/queryClient';
import {
  AppDialog as Dialog,
  AppDialogTrigger as DialogTrigger,
  AppDialogContent as DialogContent,
  AppDialogHeader as DialogHeader,
  AppDialogTitle as DialogTitle,
  AppDialogFooter as DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@/components/ui/table';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface PrizeForm {
  title: string;
  description?: string;
  imageUrl?: string;
  weight: number;
  prizeType: 'coupon' | 'product' | 'credit';
  payload: string;
  quantity: number;
}

interface SpinCampaignFormValues {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  maxSpinsPerUser: number;
  prizes: PrizeForm[];
}

interface SpinCampaign {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  maxSpinsPerUser: number;
  prizes: PrizeForm[];
}

export default function SpinCampaignsManagement() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const form = useForm<SpinCampaignFormValues>({
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      maxSpinsPerUser: 1,
      prizes: [
        { title: '', description: '', imageUrl: '', weight: 1, prizeType: 'coupon', payload: '', quantity: -1 },
      ],
    },
  });
  const { fields, remove } = useFieldArray({ name: 'prizes', control: form.control });

  const { data: campaigns = [], isLoading } = useQuery<SpinCampaign[], Error>({
    queryKey: ['spinCampaignsAdmin'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/admin/spin-campaigns');
        return (await res.json()) as SpinCampaign[];
      } catch (err) {
        return [];
      }
    },
  });

  const saveMutation = useMutation<SpinCampaign, Error, SpinCampaignFormValues>({
    mutationFn: (data) =>
      apiRequest(
        editingId ? 'PUT' : 'POST',
        editingId ? `/api/admin/spin-campaigns/${editingId}` : '/api/admin/spin-campaigns',
        data
      ).then((res) => res.json() as Promise<SpinCampaign>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spinCampaignsAdmin'] });
      toast.success(`Campaign ${editingId ? 'updated' : 'created'}`);
      setIsOpen(false);
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/spin-campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spinCampaignsAdmin'] });
      toast.success('Campaign deleted');
    },
  });

  const onSubmit = (data: SpinCampaignFormValues) => {
    saveMutation.mutate(data);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset();
    setIsOpen(true);
  };

  const openEdit = (c: SpinCampaign) => {
    setEditingId(c._id);
    form.reset({
      name: c.name,
      description: c.description || '',
      startDate: new Date(c.startDate),
      endDate: new Date(c.endDate),
      maxSpinsPerUser: c.maxSpinsPerUser,
      prizes: c.prizes.map((p) => ({ ...p, payload: String(p.payload) })),
    });
    setIsOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Spin Campaigns</h1>
        <Button onClick={openNew}>Create Campaign</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Spins/User</TableHead>
            <TableHead>Prizes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5}>Loading campaigns...</TableCell>
            </TableRow>
          ) : (
            campaigns.map((c) => (
              <TableRow key={c._id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>
                  {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{c.maxSpinsPerUser}</TableCell>
                <TableCell>{c.prizes.length}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(c._id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          dateFormat="yyyy-MM-dd"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          dateFormat="yyyy-MM-dd"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="maxSpinsPerUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Spins Per User</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <h3 className="font-medium">Prizes</h3>
                {fields.map((item, index) => (
                  <div key={item.id} className="p-4 border rounded space-y-2 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                    <FormField
                      control={form.control}
                      name={`prizes.${index}.title` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`prizes.${index}.weight` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`prizes.${index}.prizeType` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <FormControl>
                            <Select {...field}>
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="coupon">Coupon</SelectItem>
                                <SelectItem value="product">Product</SelectItem>
                                <SelectItem value="credit">Credit</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`prizes.${index}.payload` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payload</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`prizes.${index}.quantity` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter className="justify-end space-x-2 mt-4">
    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button type="submit">Save</Button>
</DialogFooter>
</form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
