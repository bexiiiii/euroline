"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import Form from "@/components/form/Form";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { exportAdminData } from "@/lib/api/importExport";
import { useToast } from "@/context/ToastContext";

interface BalanceTransaction {
  id: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  amount: number;
  type: "topup" | "payment" | "refund";
  status: "Выполнен" | "В обработке" | "Отменен";
  method: "Наличные" | "Карта" | "Перевод" | "Терминал";
  description: string;
  createdAt: string;
  processedBy: string;
}

// Mock данные транзакций
const mockTransactions: BalanceTransaction[] = [
  {
    id: 1,
    clientName: "Иванов Петр Сергеевич",
    clientPhone: "+7 (912) 345-67-89",
    clientEmail: "ivanov@email.com",
    amount: 5000,
    type: "topup",
    status: "Выполнен",
    method: "Наличные",
    description: "Пополнение баланса наличными",
    createdAt: "2024-03-15T10:30:00",
    processedBy: "Администратор"
  },
  {
    id: 2,
    clientName: "Сидорова Анна Ивановна",
    clientPhone: "+7 (923) 456-78-90",
    clientEmail: "sidorova@email.com",
    amount: 12500,
    type: "payment",
    status: "Выполнен",
    method: "Карта",
    description: "Оплата заказа №12345",
    createdAt: "2024-03-15T11:15:00",
    processedBy: "Кассир"
  },
  {
    id: 3,
    clientName: "Петров Михаил Александрович",
    clientPhone: "+7 (934) 567-89-01",
    clientEmail: "petrov@email.com",
    amount: 2500,
    type: "refund",
    status: "В обработке",
    method: "Перевод",
    description: "Возврат за отмененный товар",
    createdAt: "2024-03-15T12:00:00",
    processedBy: "Менеджер"
  }
];

const BalanceManagementPage = () => {
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("Наличные");
  const [description, setDescription] = useState<string>("");
  const { success: showSuccess, error: showError } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Выполнен":
        return <Badge color="success" variant="light">Выполнен</Badge>;
      case "В обработке":
        return <Badge color="warning" variant="light">В обработке</Badge>;
      case "Отменен":
        return <Badge color="error" variant="light">Отменен</Badge>;
      default:
        return <Badge color="light" variant="light">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "topup":
        return <Badge color="success" variant="light">Пополнение</Badge>;
      case "payment":
        return <Badge color="primary" variant="light">Оплата</Badge>;
      case "refund":
        return <Badge color="warning" variant="light">Возврат</Badge>;
      default:
        return <Badge color="light" variant="light">{type}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "Наличные":
        return <Badge color="success" variant="light">💵 Наличные</Badge>;
      case "Карта":
        return <Badge color="primary" variant="light">💳 Карта</Badge>;
      case "Перевод":
        return <Badge color="info" variant="light">🏦 Перевод</Badge>;
      case "Терминал":
        return <Badge color="warning" variant="light">🖥️ Терминал</Badge>;
      default:
        return <Badge color="light" variant="light">{method}</Badge>;
    }
  };

  const handleTopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Пополнение баланса:", {
      client: selectedClient,
      amount: parseFloat(amount),
      method: paymentMethod,
      description
    });
    // Сброс формы
    setSelectedClient("");
    setAmount("");
    setDescription("");
    setIsTopupModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Создание платежа:", {
      client: selectedClient,
      amount: parseFloat(amount),
      method: paymentMethod,
      description
    });
    // Сброс формы
    setSelectedClient("");
    setAmount("");
    setDescription("");
    setIsPaymentModalOpen(false);
  };

  const buildFileName = (base: string, from?: string, to?: string) => {
    const parts = [base];
    if (from) parts.push(from);
    if (to && to !== from) parts.push(to);
    return `${parts.join("-")}.csv`;
  };

  const handleExportTransactions = async ({ from, to }: ExportDateRange) => {
    try {
      await exportAdminData({
        type: "balances",
        from: from || undefined,
        to: to || undefined,
        fileName: buildFileName("client-balances", from, to),
      });
      showSuccess("Экспорт балансов сформирован");
    } catch (err) {
      console.error("Не удалось экспортировать данные по балансам", err);
      showError("Не удалось экспортировать данные по балансам");
    }
  };

  // Статистика баланса
  const balanceStats = [
    {
      title: "Пополнений за день",
      value: "15",
      amount: "67,500 ₽",
      color: "success"
    },
    {
      title: "Платежей за день",
      value: "23",
      amount: "145,600 ₽",
      color: "primary"
    },
    {
      title: "Возвратов за день",
      value: "3",
      amount: "12,300 ₽",
      color: "warning"
    },
    {
      title: "Общий оборот",
      value: "41",
      amount: "200,800 ₽",
      color: "info"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Статистика операций */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {balanceStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </h3>
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {stat.amount}
                  </p>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${
                stat.color === "success" ? "bg-green-100 dark:bg-green-900/20" :
                stat.color === "primary" ? "bg-blue-100 dark:bg-blue-900/20" :
                stat.color === "warning" ? "bg-yellow-100 dark:bg-yellow-900/20" :
                "bg-purple-100 dark:bg-purple-900/20"
              }`}>
                <div className={`w-6 h-6 ${
                  stat.color === "success" ? "text-green-600 dark:text-green-400" :
                  stat.color === "primary" ? "text-blue-600 dark:text-blue-400" :
                  stat.color === "warning" ? "text-yellow-600 dark:text-yellow-400" :
                  "text-purple-600 dark:text-purple-400"
                }`}>
                  {stat.color === "success" && "💰"}
                  {stat.color === "primary" && "💳"}
                  {stat.color === "warning" && "↩️"}
                  {stat.color === "info" && "📊"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Основное управление */}
      <ComponentCard
        title="Управление балансом клиентов"
        desc="Ручное пополнение баланса, создание платежей и возвратов"
      >
        {/* Кнопки действий */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Button 
            variant="primary" 
            onClick={() => setIsTopupModalOpen(true)}
          >
            💰 Пополнить баланс
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsPaymentModalOpen(true)}
          >
            💳 Создать платеж
          </Button>
          <Button variant="outline">
            📊 Отчет по операциям
          </Button>
          <ExportWithDateRange
            triggerLabel="📤 Экспорт данных"
            variant="outline"
            size="sm"
            onConfirm={handleExportTransactions}
            description="Выберите период для выгрузки операций по балансам клиентов."
          />
        </div>

        {/* Таблица транзакций */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            История операций
          </h3>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Клиент</TableCell>
                <TableCell>Контакты</TableCell>
                <TableCell>Сумма</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Способ</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Описание</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell>Обработал</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    #{transaction.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {transaction.clientName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      <div>{transaction.clientPhone}</div>
                      <div>{transaction.clientEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      transaction.type === "topup" ? "text-green-600" :
                      transaction.type === "payment" ? "text-blue-600" :
                      "text-yellow-600"
                    }`}>
                      {transaction.type === "refund" ? "-" : "+"}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(transaction.type)}
                  </TableCell>
                  <TableCell>
                    {getMethodBadge(transaction.method)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate block">
                      {transaction.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(transaction.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {transaction.processedBy}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Детали
                      </Button>
                      {transaction.status === "В обработке" && (
                        <Button variant="primary" size="sm">
                          Обработать
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ComponentCard>

      {/* Модальное окно пополнения баланса */}
      <Modal isOpen={isTopupModalOpen} onClose={() => setIsTopupModalOpen(false)} size="md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            💰 Пополнение баланса клиента
          </h2>
          
          <Form onSubmit={handleTopupSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Выберите клиента *
                </label>
                <select 
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Выберите клиента</option>
                  <option value="ivanov">Иванов Петр Сергеевич (+7 912 345-67-89)</option>
                  <option value="sidorova">Сидорова Анна Ивановна (+7 923 456-78-90)</option>
                  <option value="petrov">Петров Михаил Александрович (+7 934 567-89-01)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Сумма пополнения *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Введите сумму"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Способ оплаты *
                  </label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="Наличные">💵 Наличные</option>
                    <option value="Карта">💳 Банковская карта</option>
                    <option value="Перевод">🏦 Банковский перевод</option>
                    <option value="Терминал">🖥️ Терминал</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Комментарий
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Дополнительная информация о пополнении"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setIsTopupModalOpen(false)}>
                Отменить
              </Button>
              <Button variant="primary" type="submit">
                💰 Пополнить баланс
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Модальное окно создания платежа */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} size="md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            💳 Создание платежа
          </h2>
          
          <Form onSubmit={handlePaymentSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Выберите клиента *
                </label>
                <select 
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Выберите клиента</option>
                  <option value="ivanov">Иванов Петр Сергеевич (Баланс: 15,000 ₽)</option>
                  <option value="sidorova">Сидорова Анна Ивановна (Баланс: 8,500 ₽)</option>
                  <option value="petrov">Петров Михаил Александрович (Баланс: 12,300 ₽)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Сумма платежа *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Введите сумму"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Способ оплаты *
                  </label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="Баланс">💰 С баланса клиента</option>
                    <option value="Наличные">💵 Наличные</option>
                    <option value="Карта">💳 Банковская карта</option>
                    <option value="Перевод">🏦 Банковский перевод</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Назначение платежа *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Например: Оплата заказа №12345"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                Отменить
              </Button>
              <Button variant="primary" type="submit">
                💳 Создать платеж
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default BalanceManagementPage;
