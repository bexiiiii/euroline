import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function PartInfoTableComponent() {
  const partDetails = [
    { label: "Артикул", value: "21707132" },
    { label: "Бренд", value: "VOLVO" },
    { label: "Наименование", value: "масляный фильтр !by-pass \\Volvo FH12., FORD Cargo" },
    { label: "Вес в инд. упак", value: "1.136 кг" },
    { label: "Объем", value: "3.168 дм³" },
    { label: "Длина", value: "320 мм" },
    { label: "Высота", value: "90 мм" },
    { label: "Ширина", value: "110 мм" },
    { label: "Код Alatrade", value: "21707132_VO" },
    { label: "Код аналога", value: "KA502664" },
    { label: "Заменена", value: "477556" },
    { label: "Применимость авто", value: "Volvo FH12., FORD Cargo" },
  ];

  return (
    <div className="relative max-w-[600px] overflow-auto rounded-md border bg-background">
      <Table aria-label="Информация о запчасти">
        <TableHeader>
          <TableRow>
            <TableHead>Параметр</TableHead>
            <TableHead>Значение</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partDetails.map((detail, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium whitespace-nowrap">{detail.label}</TableCell>
              <TableCell>{detail.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
