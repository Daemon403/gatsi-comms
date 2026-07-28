import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import PrintableReceipt from '@/components/PrintableReceipt';
import { getOrder } from '@/lib/actions/orders';

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const { data: order, error } = await getOrder(id);

  if (error || !order) {
    notFound();
  }

  const totalAmount = Number(order.totalAmount);
  const paidAmount = Number(order.paidAmount);

  return (
    <div className="flex flex-col bg-[#f8fafc]">
      <Header title="Receipt" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900">Receipt Preview</h3>
            <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-brand-500 to-brand-400" />
          </div>
          <PrintableReceipt
            orderNumber={order.orderNumber}
            createdAt={order.createdAt.toISOString()}
            customer={{
              name: `${order.customer.firstName} ${order.customer.lastName}`,
              phone: order.customer.phone,
            }}
            items={order.items.map((item) => ({
              name: item.garmentType + (item.service ? ` - ${item.service.name}` : ''),
              quantity: item.quantity,
              price: Number(item.unitPrice),
            }))}
            payments={order.payments.map((payment) => ({
              method: payment.method,
              amount: Number(payment.amount),
              date: new Date(payment.createdAt).toISOString(),
            }))}
            totalAmount={totalAmount}
            paidAmount={paidAmount}
          />
        </div>
      </div>
    </div>
  );
}
