import { useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function OrderDetailsPage() {
  const params = useParams();
  const { orderId } = params;

  if (!orderId || orderId === 'undefined') {
    return <div className="container mx-auto p-8">Invalid order ID provided.</div>;
  }

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await apiRequest("GET", `/api/orders/${orderId}`);
        const data = await res.json();
        setOrder(data.order ?? data);
      } catch (error) {
        console.error("Error fetching order:", error);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) return <div className="container mx-auto p-8">Loading...</div>;
  if (!order) return <div className="container mx-auto p-8">Order not found.</div>;

  const handleDownloadInvoice = () => {
    const doc = new jsPDF();
    doc.text(`Invoice - Order ${order.id}`, 14, 20);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 14, 30);
    const cols = ["Product", "Qty", "Price", "Total"];
    const rows = order.items.map((item: any) => [
      item.productName,
      item.quantity.toString(),
      `₹${item.productPrice}`,
      `₹${item.productPrice * item.quantity}`,
    ]);
    // @ts-ignore
    doc.autoTable({ head: [cols], body: rows, startY: 40 });
    doc.save(`invoice_${order.id}.pdf`);
  };

  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-2xl font-heading mb-4">Order Details</h1>
      <div className="mb-6">
        <Button onClick={handleDownloadInvoice} className="mr-2">Download Invoice</Button>
        <Button asChild>
          <Link href={`/orders/${order.id}/track`}>
            <a>Track Order</a>
          </Link>
        </Button>
      </div>
      <table className="table-auto mx-auto border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Product</th>
            <th className="border px-4 py-2">Qty</th>
            <th className="border px-4 py-2">Price</th>
            <th className="border px-4 py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item: any) => (
            <tr key={item.id}>
              <td className="border px-4 py-2">{item.productName}</td>
              <td className="border px-4 py-2">{item.quantity}</td>
              <td className="border px-4 py-2">₹{item.productPrice}</td>
              <td className="border px-4 py-2">₹{item.productPrice * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6">
        <p><b>Order ID:</b> {order.id}</p>
        <p><b>Status:</b> {order.status}</p>
        <p><b>Total:</b> ₹{order.totalAmount}</p>
        <p><b>Placed on:</b> {new Date(order.createdAt).toLocaleDateString()}</p>
      </div>
      <Button asChild className="mt-4">
        <Link href="/account">
          <a>Back to Account</a>
        </Link>
      </Button>
    </div>
  );
}
