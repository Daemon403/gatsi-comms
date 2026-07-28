import { notFound } from 'next/navigation';
import { getOrder } from '@/lib/actions/orders';
import OrderDetailClient from './OrderDetailClient';
import type { Metadata } from 'next';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getOrder(id);
  return {
    title: data ? `Order ${data.orderNumber} - GATSI COMMS` : 'Order Not Found',
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const { data: order, error } = await getOrder(id);

  if (error || !order) {
    notFound();
  }

  return <OrderDetailClient orderId={id} />;
}
