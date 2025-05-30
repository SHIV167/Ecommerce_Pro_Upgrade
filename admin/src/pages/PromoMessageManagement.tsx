import { useState, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';

interface Promo {
  _id?: string;
  minCartValue: number;
  maxCartValue: number;
  message: string;
}

export default function PromoMessageManagement() {
  const qc = useQueryClient();
  const { data: promos = [] } = useQuery<Promo[]>({
    queryKey: ['promomessages'],
    queryFn: () => apiRequest('GET', '/api/promomessages').then(r => r.json()),
  });

  const createPM = useMutation({
    mutationFn: (body: Partial<Promo>) => apiRequest('POST', '/api/promomessages', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promomessages'] }),
  });
  const updatePM = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Promo> }) =>
      apiRequest('PATCH', `/api/promomessages/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promomessages'] }),
  });
  const deletePM = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/promomessages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promomessages'] }),
  });

  const [form, setForm] = useState<Partial<Promo>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (editingId) updatePM.mutate({ id: editingId, body: form });
    else createPM.mutate(form);
    setForm({});
    setEditingId(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Promo Messages</h1>

      {/* List */}
      <table className="w-full mb-6 border">
        <thead>
          <tr>
            <th className="border px-2">Min ₹</th>
            <th className="border px-2">Max ₹</th>
            <th className="border px-2">Message</th>
            <th className="border px-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {promos.map(p => (
            <tr key={p._id}>
              <td className="border px-2">{p.minCartValue}</td>
              <td className="border px-2">{p.maxCartValue}</td>
              <td className="border px-2">{p.message}</td>
              <td className="border px-2 space-x-2">
                <Button onClick={() => { setEditingId(p._id!); setForm(p); }}>Edit</Button>
                <Button variant="destructive" onClick={() => deletePM.mutate(p._id!)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Form */}
      <div className="space-y-2 max-w-md">
        <Input
          type="number"
          placeholder="Min Cart Value"
          value={form.minCartValue ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, minCartValue: +e.target.value }))}
        />
        <Input
          type="number"
          placeholder="Max Cart Value"
          value={form.maxCartValue ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, maxCartValue: +e.target.value }))}
        />
        <Input
          type="text"
          placeholder="Message"
          value={form.message ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, message: e.target.value }))}
        />
        <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Create'}</Button>
      </div>
    </div>
  );
}
