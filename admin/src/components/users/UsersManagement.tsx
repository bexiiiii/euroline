"use client";
import React, { useState, useEffect } from "react";
import Button from "../ui/button/Button";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import { userApi, User as ApiUser } from "@/lib/api/users";
import { userActivityApi, UserActivity as ApiUserActivity } from "@/lib/api/userActivity";
import ExportWithDateRange, { ExportDateRange } from "@/components/common/ExportWithDateRange";
import { exportAdminData } from "@/lib/api/importExport";
import { useToast } from "@/context/ToastContext";
import { formatDateTime } from "@/lib/format";
import StatCard, { StatGrid } from "@/components/common/StatCard";
import {
  EditIcon,
  PlusIcon,
  RowAction,
  controlClass,
  rowClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
} from "@/components/finance/tableUi";

// Локальный тип для UI с дополнительными полями
interface User extends ApiUser {
  status: "active" | "inactive" | "blocked";
  /** Время последнего входа; API пока не отдаёт это поле. */
  lastLogin?: string;
  displayName: string;
  // Дополнительные поля для регистрации
  country?: string;
  state?: string;
  city?: string;
  officeAddress?: string;
  type?: string;
  fathername?: string;
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

type UserRole = ApiUser["role"];

const ACTIVITY_STATUS_META: Record<UserActivity["status"], { label: string; color: "success" | "error" | "warning" }> = {
  success: { label: "Успешно", color: "success" },
  failed: { label: "Ошибка", color: "error" },
  warning: { label: "Предупреждение", color: "warning" },
};

const EMPTY_CREATE_FORM = {
  clientName: "",
  surname: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

type CreateUserForm = typeof EMPTY_CREATE_FORM;

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const UsersManagement = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userForm, setUserForm] = useState<{ role: UserRole; banned: boolean }>({ role: "USER", banned: false });
  const [createForm, setCreateForm] = useState<CreateUserForm>(EMPTY_CREATE_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadUsers();
    loadUserActivities();
  }, []);

  const normalizeRole = (role?: string): UserRole => {
    const clean = role?.toUpperCase().replace(/^ROLE_/, "");
    return clean === "ADMIN" ? "ADMIN" : "USER";
  };

  useEffect(() => {
    if (isModalOpen) {
      setUserForm({
        role: normalizeRole(selectedUser?.role),
        banned: selectedUser?.status === "blocked",
      });
      setCreateForm(EMPTY_CREATE_FORM);
      setFormError(null);
    }
  }, [isModalOpen, selectedUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userApi.getUsers({ page: 0, size: 100 });
      
      // Маппим данные API в локальный тип
      const mappedUsers: User[] = data.content.map((u: ApiUser) => ({
        ...u,
        status: u.banned ? "blocked" : "active",
        displayName: `${u.name || ""} ${u.surname || ""}`.trim() || u.clientName || u.email,
      }));
      
      setUsers(mappedUsers);
      setTotalUsers(data.totalElements ?? mappedUsers.length);
    } catch (e) {
      console.error("Не удалось загрузить пользователей:", e);
      setError("Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivities = async () => {
    try {
      setActivitiesLoading(true);
      setActivitiesError(null);
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
    } catch (e) {
      console.error("Не удалось загрузить активность пользователей:", e);
      setUserActivities([]);
      setActivitiesError("Не удалось загрузить данные");
    } finally {
      setActivitiesLoading(false);
    }
  };

  const buildExportFileName = (base: string, from?: string, to?: string) => {
    const parts = [base];
    if (from) parts.push(from);
    if (to && to !== from) parts.push(to);
    return `${parts.join("-")}.csv`;
  };

  const handleExportUserActivity = async ({ from, to }: ExportDateRange) => {
    try {
      await exportAdminData({
        type: "user_activity",
        from: from || undefined,
        to: to || undefined,
        fileName: buildExportFileName("user-activity", from, to),
      });
      showSuccess("Экспорт активности пользователей сформирован");
    } catch (err) {
      console.error("Не удалось экспортировать активность", err);
      showError("Не удалось экспортировать активность");
    }
  };

  const newUsersLastMonth = (() => {
    const withDates = users.filter((u) => u.createdAt && !Number.isNaN(new Date(u.createdAt).getTime()));
    if (withDates.length === 0) return null;
    const threshold = Date.now() - MONTH_MS;
    return withDates.filter((u) => new Date(u.createdAt as string).getTime() >= threshold).length;
  })();

  const getRoleBadge = (role: string) => {
    const normalizedRole = role?.toLowerCase().replace(/^role_/, "");
    switch (normalizedRole) {
      case "admin":
        return <Badge size="sm" color="primary">Администратор</Badge>;
      case "user":
        return <Badge size="sm" color="light">Пользователь</Badge>;
      default:
        return <Badge size="sm" color="light">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge size="sm" color="success">Активен</Badge>;
      case "inactive":
        return <Badge size="sm" color="warning">Неактивен</Badge>;
      case "blocked":
        return <Badge size="sm" color="error">Заблокирован</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  const openModal = (user?: User) => {
    setSelectedUser(user || null);
    setIsModalOpen(true);
  };

  const toggleBan = async (u: User) => {
    const isBlocked = u.status === "blocked";
    const confirmed = window.confirm(
      isBlocked
        ? `Разблокировать пользователя «${u.displayName}»?`
        : `Заблокировать пользователя «${u.displayName}»?`
    );
    if (!confirmed) return;
    try {
      await userApi.toggleUserBan(u.id, !isBlocked);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, banned: !isBlocked, status: isBlocked ? "active" : "blocked" } : x)));
      showSuccess(isBlocked ? "Пользователь разблокирован" : "Пользователь заблокирован");
    } catch (e) {
      console.error("Не удалось изменить статус пользователя", e);
      showError("Не удалось изменить статус пользователя");
    }
  };

  const updateCreateField = (field: keyof CreateUserForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async () => {
    const form = {
      clientName: createForm.clientName.trim(),
      surname: createForm.surname.trim(),
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone.trim(),
    };
    if (!form.clientName || !form.surname || !form.name || !form.email || !form.phone) {
      setFormError("Заполните все обязательные поля");
      return;
    }
    if (!createForm.password) {
      setFormError("Введите пароль");
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      setFormError("Пароли не совпадают");
      return;
    }
    setFormError(null);
    try {
      setSavingUser(true);
      await userApi.createUser({
        ...form,
        password: createForm.password,
        role: userForm.role,
      });
      showSuccess("Пользователь создан");
      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      console.error("Не удалось создать пользователя", err);
      showError("Не удалось создать пользователя");
    } finally {
      setSavingUser(false);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) {
      await handleCreateUser();
      return;
    }

    try {
      setSavingUser(true);
      let role = selectedUser.role;
      if (normalizeRole(selectedUser.role) !== userForm.role) {
        const updated = await userApi.updateUserRole(selectedUser.id, userForm.role);
        role = updated.role;
      }
      const wasBlocked = selectedUser.status === "blocked";
      if (wasBlocked !== userForm.banned) {
        await userApi.toggleUserBan(selectedUser.id, userForm.banned);
      }
      const patch: Partial<User> = {
        role,
        banned: userForm.banned,
        status: userForm.banned ? "blocked" : "active",
      };
      setUsers((prev) =>
        prev.map((user) => (user.id === selectedUser.id ? { ...user, ...patch } : user)),
      );
      setSelectedUser((prev) => (prev ? { ...prev, ...patch } : prev));
      showSuccess("Изменения сохранены");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Не удалось сохранить изменения пользователя", err);
      showError("Не удалось сохранить изменения пользователя");
    } finally {
      setSavingUser(false);
    }
  };

  const tabClass = (tab: string) =>
    `whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
      activeTab === tab
        ? "border-brand-500 text-brand-600 dark:text-brand-400"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
    }`;

  const errorBox = (onRetry: () => void) => (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
    >
      <span>Не удалось загрузить данные</span>
      <Button size="xs" variant="outline" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );

  const stateRow = (text: string, colSpan: number) => (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {text}
      </td>
    </tr>
  );

  const readOnlyItem = (label: string, value?: string, wide = false) => (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="break-words text-gray-800 dark:text-white/90">{value?.trim() ? value : "—"}</dd>
    </div>
  );

  const createInput = (
    id: keyof CreateUserForm,
    label: string,
    type: string = "text",
    autoComplete?: string,
  ) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={createForm[id]}
        onChange={updateCreateField(id)}
        className={`${controlClass} w-full`}
      />
    </div>
  );

  const svgProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const statValue = (value: number) => (loading || error ? "—" : value);

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard
          label="Всего пользователей"
          value={statValue(totalUsers)}
          icon={
            <svg {...svgProps}>
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6" />
            </svg>
          }
        />
        <StatCard
          label="Активные"
          value={statValue(users.filter((u) => u.status === "active").length)}
          icon={
            <svg {...svgProps}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 11-7.4M16 19l2 2 4-4" />
            </svg>
          }
        />
        {newUsersLastMonth !== null && (
          <StatCard
            label="Новые за 30 дней"
            value={loading ? "—" : newUsersLastMonth}
            icon={
              <svg {...svgProps}>
                <circle cx="10" cy="8" r="4" />
                <path d="M3 21a7 7 0 0 1 12-4.9M19 15v6M16 18h6" />
              </svg>
            }
          />
        )}
        <StatCard
          label="Заблокированные"
          value={statValue(users.filter((u) => u.status === "blocked").length)}
          icon={
            <svg {...svgProps}>
              <circle cx="12" cy="12" r="9" />
              <path d="m5.6 5.6 12.8 12.8" />
            </svg>
          }
        />
      </StatGrid>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 dark:border-gray-800">
          <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Разделы">
            <button type="button" onClick={() => setActiveTab("users")} className={tabClass("users")}>Пользователи</button>
            <button type="button" onClick={() => setActiveTab("activity")} className={tabClass("activity")}>Активность</button>
          </nav>
          <div className="py-2">
            {activeTab === "users" ? (
              <Button size="sm" startIcon={<PlusIcon />} onClick={() => openModal()}>
                Добавить пользователя
              </Button>
            ) : (
              <ExportWithDateRange
                triggerLabel="Экспорт CSV"
                size="sm"
                variant="outline"
                title="Экспорт активности"
                description="Период для выгрузки в CSV."
                onConfirm={handleExportUserActivity}
              />
            )}
          </div>
        </div>

        <div className="space-y-4 p-4">
          {activeTab === "users" && (
            <>
              {error && errorBox(loadUsers)}
              <div className={tableWrapClass}>
                <table className="w-full min-w-[720px]">
                  <thead className={theadClass}>
                    <tr>
                      <th className={thClass}>Пользователь</th>
                      <th className={thClass}>Роль</th>
                      <th className={thClass}>Статус</th>
                      <th className={thClass}>Регистрация</th>
                      <th className={`${thClass} text-right`}>Действия</th>
                    </tr>
                  </thead>
                  <tbody className={tbodyClass}>
                    {loading
                      ? stateRow("Загрузка…", 5)
                      : error
                        ? stateRow("Данные недоступны", 5)
                        : users.length === 0
                          ? stateRow("Пользователей пока нет", 5)
                          : users.map((user) => {
                              const blocked = user.status === "blocked";
                              return (
                                <tr key={user.id} className={rowClass}>
                                  <td className={tdClass}>
                                    <div className="font-medium text-gray-800 dark:text-white/90">{user.displayName}</div>
                                    <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                                      {[user.email, user.phone].filter(Boolean).join(", ")}
                                    </div>
                                  </td>
                                  <td className={tdClass}>{getRoleBadge(user.role)}</td>
                                  <td className={tdClass}>{getStatusBadge(user.status)}</td>
                                  <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(user.createdAt)}</td>
                                  <td className={tdClass}>
                                    <div className="flex items-center justify-end gap-1">
                                      <RowAction label={`Редактировать пользователя ${user.displayName}`} onClick={() => openModal(user)}>
                                        <EditIcon />
                                      </RowAction>
                                      <RowAction
                                        label={`${blocked ? "Разблокировать" : "Заблокировать"} пользователя ${user.displayName}`}
                                        onClick={() => { void toggleBan(user); }}
                                        destructive={!blocked}
                                      >
                                        {blocked ? (
                                          <svg {...svgProps} aria-hidden="true">
                                            <rect x="5" y="11" width="14" height="9" rx="2" />
                                            <path d="M8 11V7a4 4 0 0 1 7.5-2" />
                                          </svg>
                                        ) : (
                                          <svg {...svgProps} aria-hidden="true">
                                            <circle cx="12" cy="12" r="9" />
                                            <path d="m5.6 5.6 12.8 12.8" />
                                          </svg>
                                        )}
                                      </RowAction>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === "activity" && (
            <>
              {activitiesError && errorBox(loadUserActivities)}
              <div className={tableWrapClass}>
                <table className="w-full min-w-[760px]">
                  <thead className={theadClass}>
                    <tr>
                      <th className={thClass}>Пользователь</th>
                      <th className={thClass}>Действие</th>
                      <th className={thClass}>Модуль</th>
                      <th className={thClass}>Время</th>
                      <th className={thClass}>IP-адрес</th>
                      <th className={thClass}>Статус</th>
                    </tr>
                  </thead>
                  <tbody className={tbodyClass}>
                    {activitiesLoading
                      ? stateRow("Загрузка…", 6)
                      : activitiesError
                        ? stateRow("Данные недоступны", 6)
                        : userActivities.length === 0
                          ? stateRow("Активности пока нет", 6)
                          : userActivities.map((activity) => {
                              const statusMeta = ACTIVITY_STATUS_META[activity.status] ?? { label: activity.status || "—", color: "warning" as const };
                              return (
                                <tr key={activity.id} className={rowClass}>
                                  <td className={`${tdClass} font-medium text-gray-800 dark:text-white/90`}>{activity.userName}</td>
                                  <td className={tdClass}>{activity.action}</td>
                                  <td className={tdClass}>{activity.module || "—"}</td>
                                  <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDateTime(activity.timestamp)}</td>
                                  <td className={`${tdClass} tabular-nums`}>{activity.ipAddress || "—"}</td>
                                  <td className={tdClass}>
                                    <Badge size="sm" color={statusMeta.color}>{statusMeta.label}</Badge>
                                  </td>
                                </tr>
                              );
                            })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="lg" className="p-0">
        <form onSubmit={handleUserSubmit} className="space-y-4 p-5">
          <h2 className="pr-12 text-base font-semibold text-gray-800 dark:text-white/90">
            {selectedUser ? "Редактирование пользователя" : "Новый пользователь"}
          </h2>

          {formError && (
            <div role="alert" className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {formError}
            </div>
          )}

          {selectedUser ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {readOnlyItem("Клиент", selectedUser.clientName, true)}
              {readOnlyItem("Контактное лицо", [selectedUser.surname, selectedUser.name, selectedUser.fathername].filter(Boolean).join(" "))}
              {readOnlyItem("Email", selectedUser.email)}
              {readOnlyItem("Телефон", selectedUser.phone)}
              {readOnlyItem("Город", [selectedUser.state, selectedUser.city].filter(Boolean).join(", "))}
              {readOnlyItem("Адрес офиса", selectedUser.officeAddress, true)}
            </dl>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">{createInput("clientName", "Наименование клиента", "text", "organization")}</div>
              {createInput("surname", "Фамилия", "text", "family-name")}
              {createInput("name", "Имя", "text", "given-name")}
              {createInput("email", "Email", "email", "email")}
              {createInput("phone", "Телефон", "tel", "tel")}
              {createInput("password", "Пароль", "password", "new-password")}
              {createInput("confirmPassword", "Повтор пароля", "password", "new-password")}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2 dark:border-gray-800">
            <div>
              <Label htmlFor="role">Роль</Label>
              <select
                id="role"
                value={userForm.role}
                onChange={(e) =>
                  setUserForm((prev) => ({
                    ...prev,
                    role: normalizeRole(e.target.value),
                  }))
                }
                className={`${controlClass} w-full`}
              >
                <option value="USER">Пользователь</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </div>
            {selectedUser && (
              <label className="flex items-center gap-2 text-sm text-gray-700 sm:pt-7 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={userForm.banned}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, banned: e.target.checked }))}
                  className="size-4 rounded border-gray-300 accent-brand-500 dark:border-gray-600"
                />
                Заблокирован
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button size="sm" type="submit" disabled={savingUser}>
              {savingUser ? "Сохранение…" : selectedUser ? "Сохранить" : "Создать"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersManagement;
