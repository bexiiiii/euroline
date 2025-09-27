"use client";
import React, { useState } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";

interface TechnicalSetting {
  id: number;
  category: string;
  key: string;
  name: string;
  value: string;
  defaultValue: string;
  type: "string" | "number" | "boolean" | "select" | "json";
  description: string;
  isSecure: boolean;
  lastModified: string;
  modifiedBy: string;
  options?: string[];
}

const TechnicalSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<TechnicalSetting | null>(null);
  const [settings, setSettings] = useState<TechnicalSetting[]>([
    {
      id: 1,
      category: "general",
      key: "app_name",
      name: "Название приложения",
      value: "AutoParts Admin",
      defaultValue: "AutoParts Admin",
      type: "string",
      description: "Основное название приложения, отображаемое в интерфейсе",
      isSecure: false,
      lastModified: "2024-12-15T10:30:00Z",
      modifiedBy: "admin@autoparts.ru"
    },
    {
      id: 2,
      category: "general",
      key: "app_version",
      name: "Версия приложения",
      value: "1.2.3",
      defaultValue: "1.0.0",
      type: "string",
      description: "Текущая версия системы",
      isSecure: false,
      lastModified: "2024-12-10T14:20:00Z",
      modifiedBy: "developer@autoparts.ru"
    },
    {
      id: 3,
      category: "database",
      key: "db_connection_timeout",
      name: "Таймаут подключения к БД",
      value: "30000",
      defaultValue: "30000",
      type: "number",
      description: "Время ожидания подключения к базе данных в миллисекундах",
      isSecure: false,
      lastModified: "2024-12-12T09:15:00Z",
      modifiedBy: "admin@autoparts.ru"
    },
    {
      id: 4,
      category: "database",
      key: "db_max_connections",
      name: "Максимум соединений с БД",
      value: "100",
      defaultValue: "50",
      type: "number",
      description: "Максимальное количество одновременных подключений к базе данных",
      isSecure: false,
      lastModified: "2024-12-08T16:45:00Z",
      modifiedBy: "admin@autoparts.ru"
    },
    {
      id: 5,
      category: "security",
      key: "session_timeout",
      name: "Время жизни сессии",
      value: "3600",
      defaultValue: "1800",
      type: "number",
      description: "Время жизни пользовательской сессии в секундах",
      isSecure: true,
      lastModified: "2024-12-14T11:30:00Z",
      modifiedBy: "admin@autoparts.ru"
    },
    {
      id: 6,
      category: "security",
      key: "max_login_attempts",
      name: "Максимум попыток входа",
      value: "5",
      defaultValue: "3",
      type: "number",
      description: "Максимальное количество неудачных попыток входа перед блокировкой",
      isSecure: true,
      lastModified: "2024-12-13T13:20:00Z",
      modifiedBy: "admin@autoparts.ru"
    },
    {
      id: 7,
      category: "cache",
      key: "cache_enabled",
      name: "Включить кэширование",
      value: "true",
      defaultValue: "true",
      type: "boolean",
      description: "Включить или отключить кэширование данных",
      isSecure: false,
      lastModified: "2024-12-11T15:10:00Z",
      modifiedBy: "admin@autoparts.ru"
    },
    {
      id: 8,
      category: "cache",
      key: "cache_ttl",
      name: "Время жизни кэша",
      value: "1800",
      defaultValue: "3600",
      type: "number",
      description: "Время жизни кэшированных данных в секундах",
      isSecure: false,
      lastModified: "2024-12-09T12:00:00Z",
      modifiedBy: "admin@autoparts.ru"
    },
    {
      id: 9,
      category: "email",
      key: "smtp_host",
      name: "SMTP сервер",
      value: "smtp.gmail.com",
      defaultValue: "localhost",
      type: "string",
      description: "Адрес SMTP сервера для отправки почты",
      isSecure: true,
      lastModified: "2024-12-07T10:45:00Z",
      modifiedBy: "admin@autoparts.ru"
    },
    {
      id: 10,
      category: "email",
      key: "smtp_port",
      name: "SMTP порт",
      value: "587",
      defaultValue: "25",
      type: "number",
      description: "Порт SMTP сервера",
      isSecure: false,
      lastModified: "2024-12-07T10:46:00Z",
      modifiedBy: "admin@autoparts.ru"
    }
  ]);

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "string":
        return "primary";
      case "number":
        return "success";
      case "boolean":
        return "warning";
      case "select":
        return "info";
      case "json":
        return "dark";
      default:
        return "light";
    }
  };

  const openEditModal = (setting: TechnicalSetting) => {
    setSelectedSetting(setting);
    setIsModalOpen(true);
  };

  const saveSetting = (updatedSetting: TechnicalSetting) => {
    setSettings(prev => prev.map(s => 
      s.id === updatedSetting.id 
        ? { ...updatedSetting, lastModified: new Date().toISOString(), modifiedBy: "admin@autoparts.ru" }
        : s
    ));
    setIsModalOpen(false);
  };

  const resetToDefault = (setting: TechnicalSetting) => {
    const updatedSetting = {
      ...setting,
      value: setting.defaultValue,
      lastModified: new Date().toISOString(),
      modifiedBy: "admin@autoparts.ru"
    };
    saveSetting(updatedSetting);
  };

  const filteredSettings = settings.filter(setting => {
    if (activeTab === "all") return true;
    return setting.category === activeTab;
  });

  const getSettingStats = () => {
    const total = settings.length;
    const modified = settings.filter(s => s.value !== s.defaultValue).length;
    const secure = settings.filter(s => s.isSecure).length;
    return { total, modified, secure };
  };

  const stats = getSettingStats();

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Всего настроек</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">параметров системы</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Изменено</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.modified}</p>
            <div className="ml-2 flex items-center text-sm font-medium text-gray-500">
              <span>из {stats.total}</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">от значений по умолчанию</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Защищенные</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.secure}</p>
            <div className="ml-2 flex items-center text-sm font-medium text-red-600">
              <span>критичных</span>
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">настроек безопасности</p>
        </div>
      </div>

      {/* Основной контент */}
      <ComponentCard
        title="Технические настройки системы"
        description="Управление конфигурацией и параметрами системы"
        action={
          <div className="flex space-x-2">
            <Button size="sm" variant="outline">Экспорт настроек</Button>
            <Button size="sm" variant="outline">Импорт настроек</Button>
            <Button size="sm">Сохранить все</Button>
          </div>
        }
      >
        {/* Табы */}
        <div className="border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("all")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "all"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Все настройки
            </button>
            <button
              onClick={() => setActiveTab("general")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "general"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Общие
            </button>
            <button
              onClick={() => setActiveTab("database")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "database"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              База данных
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "security"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Безопасность
            </button>
            <button
              onClick={() => setActiveTab("cache")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "cache"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Кэширование
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "email"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              Почта
            </button>
          </nav>
        </div>

        {/* Таблица настроек */}
        <div className="mt-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <div className="min-w-[1200px]">
                <Table>
                  <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                    <TableRow>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Параметр</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Тип</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Текущее значение</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">По умолчанию</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Изменено</TableCell>
                      <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {filteredSettings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div>
                            <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {setting.name}
                              {setting.isSecure && (
                                <span className="ml-2 inline-flex items-center">
                                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                              {setting.key}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                              {setting.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <Badge color={getTypeColor(setting.type) as any} size="sm">
                            {setting.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="font-mono text-gray-800 dark:text-white/90">
                            {setting.type === "boolean" ? (setting.value === "true" ? "Да" : "Нет") : setting.value}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div className="font-mono text-gray-500 dark:text-gray-400">
                            {setting.type === "boolean" ? (setting.defaultValue === "true" ? "Да" : "Нет") : setting.defaultValue}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start text-theme-sm">
                          <div>
                            <div className="text-gray-700 dark:text-gray-300">
                              {formatDateTime(setting.lastModified)}
                            </div>
                            <div className="text-gray-500 text-theme-xs dark:text-gray-400">
                              {setting.modifiedBy}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-start">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(setting)}
                            >
                              Изменить
                            </Button>
                            {setting.value !== setting.defaultValue && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resetToDefault(setting)}
                              >
                                Сбросить
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>

      {/* Модальное окно редактирования */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        {selectedSetting && (
          <EditSettingModal
            setting={selectedSetting}
            onSave={saveSetting}
            onClose={() => setIsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

// Компонент модального окна редактирования
const EditSettingModal: React.FC<{
  setting: TechnicalSetting;
  onSave: (setting: TechnicalSetting) => void;
  onClose: () => void;
}> = ({ setting, onSave, onClose }) => {
  const [value, setValue] = useState(setting.value);

  const handleSave = () => {
    onSave({ ...setting, value });
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
        Редактировать настройку
      </h3>
      
      <div className="space-y-4">
        <div>
          <Label>Название параметра</Label>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {setting.name}
          </div>
        </div>
        
        <div>
          <Label>Ключ</Label>
          <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {setting.key}
          </div>
        </div>
        
        <div>
          <Label>Описание</Label>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {setting.description}
          </div>
        </div>
        
        <div>
          <Label>Значение по умолчанию</Label>
          <div className="text-sm font-mono text-gray-500 dark:text-gray-400">
            {setting.defaultValue}
          </div>
        </div>
        
        <div>
          <Label>Новое значение</Label>
          {setting.type === "boolean" ? (
            <Select
              options={[
                { value: "true", label: "Да" },
                { value: "false", label: "Нет" }
              ]}
              defaultValue={value}
              onChange={setValue}
              placeholder="Выберите значение"
            />
          ) : (
            <Input
              type={setting.type === "number" ? "number" : "text"}
              defaultValue={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Введите новое значение"
            />
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6">
        <Button variant="outline" onClick={onClose}>
          Отменить
        </Button>
        <Button onClick={handleSave}>
          Сохранить
        </Button>
      </div>
    </div>
  );
};

export default TechnicalSettingsPage;
