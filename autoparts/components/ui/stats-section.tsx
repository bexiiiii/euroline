import { Banknote, CreditCard, MoveDownLeft, MoveUpRight } from "lucide-react";

type StatsProps = {
  totalTopUps: number;
  spent: number;
  remaining: number;
  creditLimit: number;
  creditUsed: number;
  availableCredit: number;
  updatedAt?: string;
}

function Stats({
  totalTopUps,
  spent,
  remaining,
  creditLimit,
  creditUsed,
  availableCredit,
  updatedAt,
}: StatsProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("ru-KZ", {
      style: "currency",
      currency: "KZT",
      maximumFractionDigits: 0,
    }).format(n || 0);

  const fmtUpdated = (iso?: string) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleString("ru-RU", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return null;
    }
  };

  const cards = [
    {
      icon: <MoveUpRight className="w-4 h-4 mb-10 text-primary" />,
      value: fmt(totalTopUps),
      label: "Общая сумма пополнений счёта",
    },
    {
      icon: <MoveDownLeft className="w-4 h-4 mb-10 text-destructive" />,
      value: fmt(spent),
      label: "Потрачено на заказы",
    },
    {
      icon: <MoveUpRight className="w-4 h-4 mb-10 text-success" />,
      value: fmt(remaining),
      label: "Доступный остаток на счёте",
      footer: fmtUpdated(updatedAt)
        ? `Обновлено: ${fmtUpdated(updatedAt)}`
        : undefined,
    },
    {
      icon: <CreditCard className="w-4 h-4 mb-10 text-blue-500" />,
      value: fmt(creditLimit),
      label: "Установленный кредитный лимит",
    },
    {
      icon: <MoveDownLeft className="w-4 h-4 mb-10 text-orange-500" />,
      value: fmt(creditUsed),
      label: "Использовано из лимита (текущий долг)",
    },
    {
      icon: <Banknote className="w-4 h-4 mb-10 text-emerald-500" />,
      value: fmt(availableCredit),
      label: "Ещё доступно по лимиту",
    },
  ];

  return (
    <div className="w-full py-8 lg:py-10">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
            <div
              key={card.label}
              className="flex flex-col justify-between gap-0 rounded-md border bg-white p-6"
            >
              {card.icon}
              <h2 className="flex flex-row items-end gap-3 text-left text-3xl font-medium tracking-tighter lg:text-4xl">
                {card.value}
              </h2>
              <p className="text-left text-sm font-normal leading-relaxed tracking-tight text-muted-foreground">
                {card.label}
              </p>
              {card.footer && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {card.footer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { Stats };
