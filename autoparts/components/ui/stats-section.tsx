import { MoveDownLeft, MoveUpRight } from "lucide-react";

type StatsProps = {
  totalTopUps: number; // суммарно пополнено, ₸
  spent: number;       // потрачено, ₸ (положительное число)
  remaining: number;   // остаток на счёте, ₸
  updatedAt?: string;  // ISO время последнего обновления баланса
}

function Stats({ totalTopUps, spent, remaining, updatedAt }: StatsProps) {
  const fmt = (n: number) => new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(n || 0)
  const fmtUpdated = (iso?: string) => {
    if (!iso) return null
    try {
      const d = new Date(iso)
      const s = d.toLocaleString('ru-RU', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
      return s
    } catch {
      return null
    }
  }

  return (
    <div className="w-full py-8 lg:py-10">
      <div className="container mx-auto">
        <div className="grid text-left grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full gap-4 lg:gap-8">
          <div className="flex gap-0 flex-col justify-between p-6 border rounded-md bg-white">
            <MoveUpRight className="w-4 h-4 mb-10 text-primary" />
            <h2 className="text-3xl lg:text-4xl tracking-tighter max-w-xl text-left font-regular flex flex-row gap-3 items-end">
              {fmt(totalTopUps)}
            </h2>
            <p className="text-base leading-relaxed tracking-tight text-muted-foreground max-w-xl text-left">
              Общее сумма пополнений в счёт
            </p>
          </div>
          <div className="flex gap-0 flex-col justify-between p-6 border rounded-md bg-white">
            <MoveDownLeft className="w-4 h-4 mb-10 text-destructive" />
            <h2 className="text-3xl lg:text-4xl tracking-tighter max-w-xl text-left font-regular flex flex-row gap-3 items-end">
              {fmt(spent)}
            </h2>
            <p className="text-base leading-relaxed tracking-tight text-muted-foreground max-w-xl text-left">
              Сколько потрачено на покупку запчастей
            </p>
          </div>
          <div className="flex gap-0 flex-col justify-between p-6 border rounded-md bg-white">
            <MoveUpRight className="w-4 h-4 mb-10 text-success" />
            <h2 className="text-3xl lg:text-4xl tracking-tighter max-w-xl text-left font-regular flex flex-row gap-3 items-end">
              {fmt(remaining)}
            </h2>
            <p className="text-base leading-relaxed tracking-tight text-muted-foreground max-w-xl text-left">
              Остаток на счёте
            </p>
            {fmtUpdated(updatedAt) && (
              <p className="text-xs text-muted-foreground mt-1">Обновлено: {fmtUpdated(updatedAt)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { Stats };
