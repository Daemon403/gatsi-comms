import Header from '@/components/Header';
import OrderForm from '@/components/OrderForm';

export default function NewOrderPage() {
  return (
    <div className="flex flex-col">
      <Header title="New Order" />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-4xl">
          <OrderForm />
        </div>
      </div>
    </div>
  );
}
