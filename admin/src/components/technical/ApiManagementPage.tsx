"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { logPageView, logUserAction } from "@/lib/eventLogger";

interface ApiKey {
  id: number;
  name: string;
  active: boolean;
  createdAt?: string;
  lastUsed?: string;
}

const ApiManagementPage = () => {
  const [activeTab, setActiveTab] = useState("keys");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<{id: string, apiKey: string} | null>(null);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/admin/api/keys', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiKeys(data);
        }
      } catch (err) {
        console.error('Failed to fetch API keys:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
    // Log page view
    logPageView('Управление API', '/api-management');
  }, []);

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      alert('Пожалуйста, введите название ключа');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/admin/api/keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `name=${encodeURIComponent(newKeyName)}`
      });

      if (response.ok) {
        const result = await response.json();
        setCreatedKey(result);
        setNewKeyName('');
        
        // Log user action
        logUserAction(`Создан API ключ: ${newKeyName}`, `ID: ${result.id}`);
        
        const keysResponse = await fetch('http://localhost:8080/api/admin/api/keys', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          setApiKeys(keysData);
        }
      } else {
        alert('Ошибка создания ключа');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Ошибка создания ключа');
    }
  };

  const revokeApiKey = async (keyId: number) => {
    if (!confirm('Вы уверены, что хотите отозвать этот ключ?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/admin/api/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const keysResponse = await fetch('http://localhost:8080/api/admin/api/keys', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          setApiKeys(keysData);
        }
      } else {
        alert('Ошибка отзыва ключа');
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      alert('Ошибка отзыва ключа');
    }
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (active: boolean) => {
    return active 
      ? <Badge color="success" size="sm">Активен</Badge>
      : <Badge color="error" size="sm">Неактивен</Badge>;
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">Загрузка API данных...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Ключи</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{apiKeys.filter(k => k.active).length}</p>
                <div className="ml-2 flex items-center text-sm font-medium text-gray-500">
                  <span>из {apiKeys.length}</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">активных ключей</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Запросы сегодня</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">1,247</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">API вызовов</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Статус API</h3>
              <div className="mt-2 flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-lg font-medium text-green-600">Работает</p>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">99.9% uptime</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: "keys", name: "API Ключи" },
                  { id: "docs", name: "Документация" },
                  { id: "usage", name: "Использование" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "keys" && (
                <ComponentCard
                  title="Управление API ключами"
                  description="Создание и управление API ключами для внешних интеграций"
                  action={
                    <Button size="sm" onClick={() => setIsModalOpen(true)}>
                      Создать ключ
                    </Button>
                  }
                >
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Название</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Создан</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Последнее использование</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {apiKeys.map((key) => (
                          <TableRow key={key.id}>
                            <TableCell className="px-5 py-4 sm:px-6 text-start">
                              <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {key.name}
                              </div>
                              <div className="font-mono text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                                ID: {key.id}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              {getStatusBadge(key.active)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div className="text-gray-700 dark:text-gray-300">
                                {key.createdAt ? formatDateTime(key.createdAt) : 'Не указано'}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start text-theme-sm">
                              <div className="text-gray-700 dark:text-gray-300">
                                {key.lastUsed ? formatDateTime(key.lastUsed) : 'Никогда'}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-start">
                              {key.active && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => revokeApiKey(key.id)}
                                >
                                  Отозвать
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {apiKeys.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-gray-500 dark:text-gray-400">
                          <p className="text-lg font-medium">API ключи не найдены</p>
                          <p className="text-sm mt-1">Создайте первый API ключ для начала работы</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ComponentCard>
              )}

              {activeTab === "docs" && (
                <div className="space-y-6">
                  <ComponentCard
                    title="API Документация"
                    description="Руководство по интеграции с нашим API"
                  >
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Базовый URL</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
                          https://api.autoparts.kz/v1
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Аутентификация</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          Все запросы к API должны включать заголовок X-API-Key с вашим API ключом:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
                          X-API-Key: YOUR_API_KEY_HERE
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Доступные эндпоинты</h4>
                        <div className="space-y-4">
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge color="success" size="sm">GET</Badge>
                              <code className="text-sm">/external/products</code>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Получить список товаров с возможностью фильтрации
                            </p>
                          </div>
                          
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge color="success" size="sm">GET</Badge>
                              <code className="text-sm">/external/products/&#123;id&#125;</code>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Получить детальную информацию о товаре
                            </p>
                          </div>
                          
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge color="info" size="sm">POST</Badge>
                              <code className="text-sm">/external/orders</code>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Создать новый заказ
                            </p>
                          </div>
                          
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge color="success" size="sm">GET</Badge>
                              <code className="text-sm">/external/orders/&#123;id&#125;/status</code>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Получить статус заказа
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Формат ответа</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          Все ответы API возвращаются в формате JSON:
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
{`{
  "success": true,
  "data": {
    // данные ответа
  },
  "message": "Запрос выполнен успешно"
}`}
                        </div>
                      </div>
                    </div>
                  </ComponentCard>
                </div>
              )}

              {activeTab === "usage" && (
                <div className="space-y-6">
                  <ComponentCard
                    title="Примеры использования"
                    description="Готовые примеры интеграции на разных языках программирования"
                  >
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">JavaScript (fetch)</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
{`// Получить список товаров
fetch('https://api.autoparts.kz/v1/external/products', {
  headers: {
    'X-API-Key': 'YOUR_API_KEY_HERE',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">PHP (cURL)</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
{`<?php
$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => 'https://api.autoparts.kz/v1/external/products',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    'X-API-Key: YOUR_API_KEY_HERE',
    'Content-Type: application/json'
  ]
]);

$response = curl_exec($curl);
$data = json_decode($response, true);

curl_close($curl);
print_r($data);
?>`}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Python (requests)</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
{`import requests

headers = {
    'X-API-Key': 'YOUR_API_KEY_HERE',
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.autoparts.kz/v1/external/products',
    headers=headers
)

if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f'Error: {response.status_code}')`}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Создание заказа (POST)</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
{`// JavaScript example
const orderData = {
  customer: {
    name: 'Иван Иванов',
    email: 'ivan@example.com',
    phone: '+7 (495) 123-45-67'
  },
  items: [
    {
      productId: 12345,
      quantity: 2
    }
  ],
  deliveryAddress: {
    city: 'Москва',
    address: 'ул. Пример, д. 1'
  }
};

fetch('https://api.autoparts.kz/v1/external/orders', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
})
.then(response => response.json())
.then(data => console.log('Order created:', data));`}
                        </div>
                      </div>
                    </div>
                  </ComponentCard>
                </div>
              )}
            </div>
          </div>

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Создание API ключа
              </h3>
              
              {!createdKey ? (
                <div className="space-y-4">
                  <div>
                    <Label>Название ключа</Label>
                    <Input
                      type="text"
                      placeholder="Введите название для API ключа..."
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end pt-4 space-x-3">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={createApiKey}>
                      Создать ключ
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 dark:text-green-300">API ключ создан успешно!</h4>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      Скопируйте этот ключ сейчас. Он больше не будет отображаться.
                    </p>
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono text-sm">
                      {createdKey.apiKey}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => {
                      setCreatedKey(null);
                      setIsModalOpen(false);
                    }}>
                      Закрыть
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};

export default ApiManagementPage;