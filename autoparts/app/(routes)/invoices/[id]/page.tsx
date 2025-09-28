'use client';

import { Announcement } from '@/components/Announcement';
import ForReturnTableComponent, { type UiItem } from '@/components/ForReturnTableComponent';
import { ReturnModalComponent } from '@/components/ReturnModalComponent';
import { useEffect, useMemo, useState } from 'react';
import { getInvoiceDetails, type InvoiceDetails } from '@/lib/api/invoices';
import { useParams } from 'next/navigation';

export default function InvoicePage() {
  const params = useParams<{ id: string }>()
  const id = Number(params?.id)
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [itemsState, setItemsState] = useState<UiItem[]>([])

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        setLoading(true)
        const data = await getInvoiceDetails(id)
        setInvoice(data)
        setItemsState(data.items.map(i => ({ ...i, toReturn: 0 })))
      } finally { setLoading(false) }
    }
    load()
  }, [id])

  const contactName = useMemo(() => `${invoice?.receiver?.name ?? ''}`.trim(), [invoice])

  if (loading) return <div className="p-10">Загрузка...</div>;
  if (!invoice) return <div className="p-10">Фактура не найдена</div>;

  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <h1 className="text-2xl font-bold pt-9">
          Оформление возврата по Фактуре № {invoice.invoiceNumber}
        </h1>

        <div className="mt-6 space-y-2 text-sm text-gray-800 bg-gray-100 border-1 py-4 px-6 rounded-md">
          <p>
            <span className="font-semibold">Дата фактуры:</span>{' '}
            {invoice.invoiceDate}
          </p>
          <p>
            <span className="font-semibold">Дата и время создания:</span>{' '}
            {invoice.createdAt}
          </p>
          <p>
            <span className="font-semibold">Грузополучатель:</span>{' '}
            {invoice.receiver.id} {invoice.receiver.name}
          </p>
          <p>
            <span className="font-semibold">Адрес доставки:</span>{' '}
            {invoice.address}
          </p>
          <p>
            <span className="font-semibold">Контактное лицо:</span>{' '}
            {invoice.receiver.id} {invoice.receiver.name} {invoice.receiver.phone}
          </p>
          <p>
            <span className="font-semibold">Способ получения:</span>{' '}
            {invoice.deliveryMethod}
          </p>
          <p>
            <span className="font-semibold">УПД/Товчек:</span>{' '}
            {invoice.receiptNumber}
          </p>
          <p>
            <span className="font-semibold">Оплата:</span>{' '}
            {invoice.paymentMethod}
          </p>
        </div>
        <div>
            <Announcement />
          </div>
          <section className='bg-gray-100 p-6 rounded-md mt-6 border'> 
            <h2 className="text-xl font-semibold mt-6 ">Список позиций для возврата</h2>
            <ForReturnTableComponent items={invoice.items} onChange={setItemsState} />
          </section>
          <div className="flex justify-end mt-4 mb-10">
            <ReturnModalComponent invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} address={invoice.address} contactName={contactName} items={itemsState} />
          </div>
      </main>
    </div>
  );
}
