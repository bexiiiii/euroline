"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// Mock data with ID
const kamazModifications = [
  {
    id: "5320",
    modification: "KAMAZ-5320",
    power: "210 л.с.",
    capacity: "8 тонн",
    platform: "Бортовая",
    engine: "Дизель",
    wheelFormula: "6x4",
    years: "1976-2001",
  },
  {
    id: "6520",
    modification: "KAMAZ-6520",
    power: "320 л.с.",
    capacity: "20 тонн",
    platform: "Самосвал",
    engine: "Дизель",
    wheelFormula: "6x4",
    years: "1998-н.в.",
  },
  {
    id: "4308",
    modification: "KAMAZ-4308",
    power: "150 л.с.",
    capacity: "4 тонны",
    platform: "Фургон",
    engine: "Дизель",
    wheelFormula: "4x2",
    years: "2003-н.в.",
  },
  {
    id: "65117",
    modification: "KAMAZ-65117",
    power: "300 л.с.",
    capacity: "15 тонн",
    platform: "Бортовая",
    engine: "Дизель",
    wheelFormula: "6x4",
    years: "2004-н.в.",
  },
  {
    id: "43118",
    modification: "KAMAZ-43118",
    power: "240 л.с.",
    capacity: "10 тонн",
    platform: "Вахтовка",
    engine: "Дизель",
    wheelFormula: "6x6",
    years: "1999-н.в.",
  },
  {
    id: "5490",
    modification: "KAMAZ-5490",
    power: "400 л.с.",
    capacity: "44 тонны",
    platform: "Седельный тягач",
    engine: "Дизель",
    wheelFormula: "4x2",
    years: "2013-н.в.",
  },
];

export function VehicleSelectionForm() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Выбор транспортного средства</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label htmlFor="brand" className="text-sm font-medium text-gray-700">
            Марка
          </label>
          <Input id="brand" type="text" placeholder="Выберите марку" className="w-full" />
        </div>

        <div className="space-y-2">
          <label htmlFor="model" className="text-sm font-medium text-gray-700">
            Модель
          </label>
          <Input id="model" type="text" placeholder="Выберите модель" className="w-full" />
        </div>

        <div className="space-y-2">
          <label htmlFor="modification" className="text-sm font-medium text-gray-700">
            Модификация
          </label>
          <Input id="modification" type="text" placeholder="Выберите модификацию" className="w-full" />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Доступные модификации KAMAZ</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Модификация</TableHead>
              <TableHead>Мощность</TableHead>
              <TableHead>Грузоподъёмность</TableHead>
              <TableHead>Тип платформы</TableHead>
              <TableHead>Тип двигателя</TableHead>
              <TableHead>Колёсная формула</TableHead>
              <TableHead>Годы выпуска</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kamazModifications.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-blue-600 hover:underline">
                  <Link href={`/catalogs/${item.id}`}>{item.modification}</Link>
                </TableCell>
                <TableCell>{item.power}</TableCell>
                <TableCell>{item.capacity}</TableCell>
                <TableCell>{item.platform}</TableCell>
                <TableCell>{item.engine}</TableCell>
                <TableCell>{item.wheelFormula}</TableCell>
                <TableCell>{item.years}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
