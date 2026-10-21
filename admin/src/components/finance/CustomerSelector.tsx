"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { customersApi } from "@/lib/api/customers";
import { financeApi } from "@/lib/api/finance";
import { formatKzt } from "@/lib/format";
import { controlClass, fieldLabelClass } from "./tableUi";

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
  placeholder = "Поиск клиента"
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

  const formatCurrency = formatKzt;

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
      <span className={fieldLabelClass}>Клиент</span>

      {selectedCustomer ? (
        <div className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{selectedCustomer.name}</div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {[selectedCustomer.email, selectedCustomer.phone].filter(Boolean).join(", ")}
              {", баланс "}
              <span className="tabular-nums">{formatCurrency(selectedCustomer.balance)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="ml-2 inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white/90"
            title="Очистить выбор"
            aria-label="Очистить выбор клиента"
          >
            <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 18 18 6M6 6l12 12" />
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
            className={`${controlClass} w-full pr-10`}
            placeholder={placeholder}
            aria-label="Поиск клиента"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="size-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </div>
        </div>
      )}

      {isOpen && !selectedCustomer && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Загрузка…</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-error-600 dark:text-error-500">{error}</div>
          ) : visibleCustomers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Клиенты не найдены</div>
          ) : (
            visibleCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleCustomerSelect(customer)}
                className="cursor-pointer border-b border-gray-100 px-3 py-2 last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.04]"
              >
                <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {buildDisplayName(customer)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {[customer.email, customer.phone].filter(Boolean).join(", ") || "—"}
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
