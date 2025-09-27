"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { customersApi } from "@/lib/api/customers";
import { financeApi } from "@/lib/api/finance";

interface SelectorCustomer {
  id: number;
  name: string;
  email: string;
  phone: string;
  balance: number;
  registrationDate: string;
}

interface CustomerSelectorProps {
  selectedCustomer: SelectorCustomer | null;
  onSelectCustomer: (customer: SelectorCustomer | null) => void;
  placeholder?: string;
}

const buildDisplayName = (customer: import("@/lib/api/customers").Customer) => {
  if (customer.clientName && customer.clientName.trim()) {
    return customer.clientName.trim();
  }
  const parts = [customer.surname, customer.name, customer.fathername]
    .filter((part) => part && part.trim().length > 0);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return customer.email;
};

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  onSelectCustomer,
  placeholder = "Поиск клиента..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<import("@/lib/api/customers").Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balanceCache, setBalanceCache] = useState<Record<number, number>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchCustomers = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const response = await customersApi.getCustomers({ search: term || undefined, size: 20 });
      setCustomers(response.content ?? []);
      setError(null);
    } catch (err) {
      console.error("Не удалось загрузить клиентов", err);
      setCustomers([]);
      setError("Не удалось загрузить клиентов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      fetchCustomers(searchTerm.trim());
    }, 300);
    return () => window.clearTimeout(handler);
  }, [fetchCustomers, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('kk-KZ', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleClearSelection = () => {
    onSelectCustomer(null);
    setSearchTerm("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCustomerSelect = async (customer: import("@/lib/api/customers").Customer) => {
    try {
      setIsOpen(false);
      setSearchTerm("");
      let balance = balanceCache[customer.id];
      if (balance === undefined) {
        try {
          const response = await financeApi.getBalance(customer.id);
          balance = response.balance ?? 0;
          setBalanceCache((prev) => ({ ...prev, [customer.id]: balance! }));
        } catch (error) {
          console.error("Не удалось получить баланс клиента", error);
          balance = 0;
        }
      }

      onSelectCustomer({
        id: customer.id,
        name: buildDisplayName(customer),
        email: customer.email,
        phone: customer.phone ?? "",
        balance: balance ?? 0,
        registrationDate: "—",
      });
    } catch (error) {
      console.error("Ошибка выбора клиента", error);
    }
  };

  const visibleCustomers = useMemo(() => customers, [customers]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Клиент *
      </label>

      {selectedCustomer ? (
        <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium">{selectedCustomer.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCustomer.email} • {selectedCustomer.phone || "—"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Баланс: {formatCurrency(selectedCustomer.balance)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Очистить выбор"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={placeholder}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      )}

      {isOpen && !selectedCustomer && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">Загрузка…</div>
          ) : error ? (
            <div className="px-4 py-3 text-red-600 dark:text-red-400 text-sm">{error}</div>
          ) : visibleCustomers.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">Клиенты не найдены</div>
          ) : (
            visibleCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {buildDisplayName(customer)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {customer.email}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {customer.phone || "—"}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;
