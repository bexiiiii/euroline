"use client";
import React, { useState, useEffect } from "react";
import ComponentCard from "../common/ComponentCard";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { userApi, User as ApiUser } from "@/lib/api/users";
import { userActivityApi, UserActivity as ApiUserActivity } from "@/lib/api/userActivity";
import { PageResponse } from "@/lib/api/types";
import { apiFetch } from "@/lib/api";

// Локальный тип для UI с дополнительными полями
interface User extends ApiUser {
  status: "active" | "inactive" | "blocked";
  lastLogin: string;
  displayName: string;
}

interface UserActivity {
  id: number;
  userId: number;
  userName: string;
  action: string;
  module: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failed" | "warning";
}

const UsersManagement = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"user" | "role">("user");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
    loadUserActivities();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getUsers({ page: 0, size: 100 });
      
      // Маппим данные API в локальный тип
      const mappedUsers: User[] = data.content.map((u: ApiUser) => ({
        ...u,
        status: u.banned ? "blocked" : "active",
        lastLogin: new Date().toISOString(), // заглушка, пока нет данных о последнем входе
        displayName: `${u.name || ""} ${u.surname || ""}`.trim() || u.clientName || u.email,
      }));
      
      setUsers(mappedUsers);
    } catch (e: any) {
      setError(e.message || "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivities = async () => {
    try {
      setActivitiesLoading(true);
      const data = await userActivityApi.getActivities(undefined, 0, 50);
      
      // Маппим данные API в локальный тип
      const mappedActivities: UserActivity[] = data.content.map((a: ApiUserActivity) => ({
        id: a.id,
        userId: a.userId,
        userName: a.userName || `Пользователь ${a.userId}`,
        action: a.action,
        module: a.module,
        timestamp: a.createdAt,
        ipAddress: a.ipAddress,
        userAgent: a.userAgent,
        status: a.status,
      }));
      
      setUserActivities(mappedActivities);
    } catch (e: any) {
      console.error("Не удалось загрузить активность пользователей:", e.message);
      // Не показываем ошибку пользователю, так как это не критично
      setUserActivities([]); // оставляем пустой список
    } finally {
      setActivitiesLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString("ru-RU");

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge color="error">Администратор</Badge>;
      case "manager":
        return <Badge color="primary">Менеджер</Badge>;
      case "operator":
        return <Badge color="warning">Оператор</Badge>;
      case "viewer":
        return <Badge color="light">Наблюдатель</Badge>;
      default:
        return <Badge color="light">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge color="success">Активен</Badge>;
      case "inactive":
        return <Badge color="warning">Неактивен</Badge>;
      case "blocked":
        return <Badge color="error">Заблокирован</Badge>;
      default:
        return <Badge color="light">{status}</Badge>;
    }
  };

  const openModal = (type: "user" | "role", user?: User) => {
    setModalType(type);
    setSelectedUser(user || null);
    setIsModalOpen(true);
  };

  const roleOptions = [
    { value: "admin", label: "Администратор" },
    { value: "manager", label: "Менеджер" },
    { value: "operator", label: "Оператор" },
    { value: "viewer", label: "Наблюдатель" },
  ];

  const statusOptions = [
    { value: "active", label: "Активен" },
    { value: "inactive", label: "Неактивен" },
    { value: "blocked", label: "Заблокирован" },
  ];

  const toggleBan = async (u: User) => {
    try {
      const newBannedStatus = u.status === "blocked";
      await userApi.toggleUserBan(u.id, !newBannedStatus);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: u.status === "blocked" ? "active" : "blocked" } : x)));
    } catch (e) {
      setError("Не удалось изменить статус пользователя");
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>}

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-white">Всего пользователей</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{users.length}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">в системе</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-white">Активных пользователей</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{users.filter(u=>u.status==='active').length}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">онлайн сейчас</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-white">Новые за месяц</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">—</p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">пользователей</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6">
          <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-white">Заблокированных</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{users.filter(u=>u.status==='blocked').length}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">пользователей</p>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-base lg:text-lg font-medium text-gray-900 dark:text-white">Управление пользователями</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Добавляйте новых пользователей, управляйте ролями и отслеживайте активность
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => openModal("role")} className="w-full sm:w-auto">Настроить роли</Button>
            <Button onClick={() => openModal("user")} className="w-full sm:w-auto">Добавить пользователя</Button>
          </div>
        </div>
      </div>

      {/* Основной контент с табами */}
      <ComponentCard
        title="Пользователи системы"
        description="Управление пользователями, ролями и мониторинг активности"
        action={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="sm" variant="outline" className="w-full sm:w-auto">Экспорт отчета</Button>
            <Button size="sm" className="w-full sm:w-auto">Настройки</Button>
          </div>
        }
      >
        {/* Табы */}
        <div className="border-b border-gray-200 dark:border-gray-700 -mx-6 px-6">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            <button onClick={() => setActiveTab("users")} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "users" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`}>Список пользователей</button>
            <button onClick={() => setActiveTab("activity")} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === "activity" ? "border-blue-500 text-blue-600 dark:text-blue-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"}`}>Активность пользователей</button>
          </nav>
        </div>

        {/* Контент табов */}
        <div className="mt-6">
          {activeTab === "users" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Пользователи системы</h3>
                <Button onClick={() => openModal("user")} className="w-full sm:w-auto">Добавить пользователя</Button>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Пользователь</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Роль</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Последний вход</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действия</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {loading ? (
                          <TableRow><TableCell className="px-5 py-4" colSpan={5}>Загрузка...</TableCell></TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="px-5 py-4 sm:px-6 text-start">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                    {user.displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{user.displayName}</div>
                                    <div className="text-gray-500 text-theme-xs dark:text-gray-400 truncate">{user.email}</div>
                                    <div className="text-gray-500 text-theme-xs dark:text-gray-400">{user.phone}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-start text-theme-sm">{getRoleBadge(user.role)}</TableCell>
                              <TableCell className="px-4 py-3 text-start text-theme-sm">{getStatusBadge(user.status)}</TableCell>
                              <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">{formatDateTime(user.lastLogin)}</TableCell>
                              <TableCell className="px-4 py-3 text-start">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openModal("user", user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/20 dark:hover:text-blue-400" title="Редактировать">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2"/></svg>
                                  </button>
                                  <button onClick={() => toggleBan(user)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400" title={user.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}>
                                    {user.status === 'blocked' ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 4a4 4 0 00-4 4v2H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2V8a4 4 0 00-4-4zm-2 6V8a2 2 0 114 0v2h-4z" stroke="currentColor" strokeWidth="2"/></svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="2"/></svg>
                                    )}
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Активность пользователей</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">Фильтры</Button>
                  <Button size="sm" variant="outline" className="w-full sm:w-auto">Экспорт</Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                  <div className="min-w-[900px]">
                    <Table>
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Пользователь</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Действие</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Модуль</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Время</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">IP адрес</TableCell>
                          <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Статус</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        {activitiesLoading ? (
                          <TableRow><TableCell className="px-5 py-4" colSpan={6}>Загрузка активности...</TableCell></TableRow>
                        ) : userActivities.length === 0 ? (
                          <TableRow><TableCell className="px-5 py-4" colSpan={6}>Нет данных об активности</TableCell></TableRow>
                        ) : (
                          userActivities.map((activity) => (
                            <TableRow key={activity.id}>
                              <TableCell className="px-5 py-4 sm:px-6 text-start"><div className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{activity.userName}</div></TableCell>
                              <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">{activity.action}</TableCell>
                              <TableCell className="px-4 py-3 text-start text-theme-sm"><Badge color="light">{activity.module}</Badge></TableCell>
                              <TableCell className="px-4 py-3 text-gray-700 text-start text-theme-sm dark:text-gray-300">{formatDateTime(activity.timestamp)}</TableCell>
                              <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">{activity.ipAddress}</TableCell>
                              <TableCell className="px-4 py-3 text-start text-theme-sm"><Badge color={activity.status==='success'?'success':activity.status==='failed'?'error':'warning'}>{activity.status}</Badge></TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ComponentCard>

      {/* Модальное окно пользователя */}
      <Modal isOpen={isModalOpen && modalType === "user"} onClose={() => setIsModalOpen(false)} size="lg">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">{selectedUser ? "Редактирование пользователя" : "Добавление нового пользователя"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Имя</Label><Input placeholder="Введите имя" defaultValue={selectedUser?.name || ""} /></div>
            <div><Label>Email</Label><Input type="email" placeholder="email@example.com" defaultValue={selectedUser?.email || ""} /></div>
            <div><Label>Телефон</Label><Input placeholder="+7 (999) 123-45-67" defaultValue={selectedUser?.phone || ""} /></div>
            <div><Label>Роль</Label><Select options={roleOptions} onChange={() => {}} placeholder="Выберите роль" defaultValue={selectedUser?.role || ""} /></div>
            <div><Label>Статус</Label><Select options={statusOptions} onChange={() => {}} placeholder="Выберите статус" defaultValue={selectedUser?.status || ""} /></div>
          </div>
          <div className="mt-6"><Label>Пароль</Label><Input type="password" placeholder={selectedUser ? "Оставьте пустым для сохранения текущего" : "Введите пароль"} /></div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">Отменить</Button>
            <Button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">{selectedUser ? "Сохранить изменения" : "Создать пользователя"}</Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно роли */}
      <Modal isOpen={isModalOpen && modalType === "role"} onClose={() => setIsModalOpen(false)} size="md">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Настройка ролей и прав</h3>
          <div className="space-y-4">
            <div><Label>Название роли</Label><Input placeholder="Введите название роли" /></div>
            <div>
              <Label>Описание</Label>
              <textarea rows={3} placeholder="Опишите права и обязанности роли" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">Отменить</Button>
            <Button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">Сохранить роль</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersManagement;
