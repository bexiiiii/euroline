'use client';

import { useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import type { InvoiceItem } from '@/lib/api/invoices';
import { submitInvoiceReturn, type CreateReturnReq } from '@/lib/api/invoices';

export function ReturnModalComponent({
  invoiceId,
  invoiceNumber,
  address,
  contactName,
  items,
}: {
  invoiceId: number;
  invoiceNumber: string;
  address?: string;
  contactName?: string;
  items: (InvoiceItem & { toReturn?: number })[];
}) {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [method, setMethod] = useState('future');
    const [open, setOpen] = useState(false);

    const positions = useMemo(() => items.filter(i => (i.toReturn ?? 0) > 0).map((i) => ({
      id: i.itemId,
      code: i.article,
      brand: i.brand,
      name: i.name,
      quantity: i.toReturn ?? 0,
      productId: i.productId,
    })), [items])

    const totalSelected = useMemo(() => items.reduce((s, i) => s + Number(i.price || 0) * Number(i.toReturn || 0), 0), [items])

    const handleSubmit = async () => {
      try {
        if (positions.length === 0){
          toast.error('Выберите хотя бы одну позицию')
          return
        }
        if (totalSelected < 30000){
          toast.error('Минимальная сумма возврата 30 000 ₸')
          return
        }
        const payload: CreateReturnReq = {
          reason, description, method,
          items: positions.map(p => ({ productId: p.productId, quantity: p.quantity }))
        }
        await submitInvoiceReturn(invoiceId, payload)
        toast.success('Заявка на возврат отправлена. Средства будут зачислены на баланс.')
        setReason(''); setDescription(''); setMethod('future'); setOpen(false)
      } catch (e: any){
        const msg = e?.message || 'Не удалось оформить возврат'
        toast.error(msg)
      }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="flex justify-end p-4">
                    <Button variant="default">Оформить возврат</Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl p-6 rounded-xl">
                <DialogHeader>
                    <DialogTitle>Оформить возврат по фактуре №{invoiceNumber}</DialogTitle>
                    <DialogDescription>
                        Укажите детали возврата и проверьте список товаров.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Укажите причину возврата:</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Выберите причину" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="broken">Повреждённый товар</SelectItem>
                                <SelectItem value="wrong">Неверный товар</SelectItem>
                                <SelectItem value="expired">Просроченный</SelectItem>
                                <SelectItem value="other">Другое</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Описание причины возврата:</Label>
                        <Input
                            type="text"
                            placeholder="Опишите, почему вы хотите вернуть товар"
                            value={description}
                            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                        />
                        <p className="text-sm text-muted-foreground">
                            {description.length}/500 символов
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Способ возврата денег:</Label>
                        <RadioGroup value={method} onValueChange={setMethod} className="space-y-1">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="future" id="future" name="return-method" />
                                <Label htmlFor="future">В счёт будущих покупок</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <Label className="block mb-1">Адрес доставки</Label>
                            <p className="text-sm bg-muted p-2 rounded">
                                {address || '—'}
                            </p>
                        </div>
                        <div>
                            <Label className="block mb-1">Контактное лицо</Label>
                            <p className="text-sm bg-muted p-2 rounded">
                                {contactName || '—'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Номер</TableHead>
                                    <TableHead>Код</TableHead>
                                    <TableHead>Бренд</TableHead>
                                    <TableHead>Наименование</TableHead>
                                    <TableHead>Количество к возврату</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {positions.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{item.code}</TableCell>
                                        <TableCell>{item.brand}</TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit}>Отправить заявку на возврат</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
