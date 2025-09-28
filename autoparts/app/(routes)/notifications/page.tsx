"use client";
import Breadcrumbs from "@/components/Breadcrumb";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Check, Loader2, PartyPopper } from "lucide-react";
import FancyTable from "@/components/ui/fancytable";
import ModalDialog from "@/components/modal";
import { useNotificationsStore } from "@/lib/stores/notificationsStore";

const breadcrumbItems = [
  { label: "Главная", href: "/" },
  { label: "Уведомления", isCurrent: true },
];

type UINotif = { id:number; message:string; type:'info'|'warning'|'error'|'success'; createdAt:string; isRead:boolean }

function NotificationsPage() {
  const { items: notifItems, isLoading, error, load, toggleRead, removeLocal, markAll } = useNotificationsStore();
  const [filter, setFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');

  const { subscribe, unsubscribe } = useNotificationsStore()
  useEffect(() => {
    load(0)
    subscribe()
    return () => unsubscribe()
  }, [load, subscribe, unsubscribe]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedNotification, setSelectedNotification] = useState<UINotif | null>(null);

const openModal = (notification: UINotif) => {
  setSelectedNotification(notification);
  setIsModalOpen(true);
};

const closeModal = () => {
  setIsModalOpen(false);
  setSelectedNotification(null);
};

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success': return 'Успех';
      case 'warning': return 'Предупреждение';
      case 'error': return 'Ошибка';
      case 'info': return 'Информация';
      default: return type;
    }
  };

  const deleteNotification = (id: number) => { removeLocal(id); };
  const uiNotifications: UINotif[] = useMemo(() => (
    notifItems.map(n => ({
      id: n.id,
      message: n.body || n.title || '-',
      type: (n.severity || 'INFO').toString().toLowerCase() as UINotif['type'],
      createdAt: new Date(n.createdAt).toLocaleString('ru-RU'),
      isRead: !!n.readFlag,
    }))
  ), [notifItems]);

  const filteredNotifications = uiNotifications.filter(notif => {
    if (filter === 'read' && !notif.isRead) return false;
    if (filter === 'unread' && notif.isRead) return false;
    if (typeFilter !== 'all' && notif.type !== typeFilter) return false;
    return true;
  });

  

return (
  <div className="bg-white min-h-screen pt-24">
    <main className="container mx-auto px-6">
      <div className="pt-5">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      {selectedNotification && (
        <ModalDialog
          open={isModalOpen}
          onClose={(open) => {
            setIsModalOpen(open);
            if (!open) setSelectedNotification(null);
          }}
          notification={selectedNotification}
        />
      )}

        <h1 className="text-4xl font-bold pt-4">Уведомления</h1>

        
        {/* Фильтры и действия */}
<div className="flex flex-wrap items-center gap-4 mt-6">
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">Статус:</span>
    <button
      onClick={() => setFilter("all")}
      className={`px-3 py-1 rounded-md border ${filter === "all" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      Все
    </button>
    <button
      onClick={() => setFilter("read")}
      className={`px-3 py-1 rounded-md border ${filter === "read" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      Прочитанные
    </button>
    <button
      onClick={() => setFilter("unread")}
      className={`px-3 py-1 rounded-md border ${filter === "unread" ? "bg-black text-white" : "bg-white text-black"}`}
    >
      Непрочитанные
    </button>
  </div>

  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">Тип:</span>
    <select
      value={typeFilter}
      onChange={(e) => setTypeFilter(e.target.value as any)}
      className="px-2 py-1 rounded-md border"
    >
      <option value="all">Все</option>
      <option value="success">Успех</option>
      <option value="info">Информация</option>
      <option value="warning">Предупреждение</option>
      <option value="error">Ошибка</option>
    </select>
  </div>

  <div className="ml-auto flex items-center gap-2">
    <button
      onClick={() => markAll()}
      className="px-3 py-1.5 rounded-md border bg-white text-black hover:bg-gray-50"
    >
      Отметить все прочитанными
    </button>
    <button
      onClick={() => load(0)}
      className="px-3 py-1.5 rounded-md border bg-white text-black hover:bg-gray-50"
    >
      Обновить
    </button>
  </div>
</div>
        {/* Состояния загрузки / ошибки */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {/* Notifications Table */}
        <div className="mt-8">
          {isLoading ? (
            <div className="w-full flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-gray-600">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Загрузка уведомлений...</span>
              </div>
            </div>
          ) : (
          <FancyTable>
            <FancyTable.Colgroup>
              <FancyTable.Col className="w-[5%]" />
              <FancyTable.Col className="w-[55%]" />
              <FancyTable.Col className="w-[15%]" />
              <FancyTable.Col className="w-[15%]" />
              <FancyTable.Col className="w-[10%]" />
            </FancyTable.Colgroup>
            <FancyTable.Header>
              <FancyTable.Row>
                <FancyTable.Head>Прочитано</FancyTable.Head>
                <FancyTable.Head>Текст сообщения</FancyTable.Head>
                <FancyTable.Head>Тип сообщения</FancyTable.Head>
                <FancyTable.Head>Дата создания</FancyTable.Head>
                <FancyTable.Head>Действия</FancyTable.Head>
              </FancyTable.Row>
            </FancyTable.Header>
            <FancyTable.Body interactive striped>
              {filteredNotifications.length === 0 ? (
                <FancyTable.Row>
                  <FancyTable.Cell colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-14 text-gray-600">
                      <div className="mb-4 p-4 rounded-full bg-gray-100">
                        <PartyPopper className="w-10 h-10 text-gray-500" />
                      </div>
                      <div className="text-lg font-medium">Уведомлений нет</div>
                      <div className="text-sm text-gray-500 mt-1">Мы дадим знать, когда появится что-то важное</div>
                    </div>
                  </FancyTable.Cell>
                </FancyTable.Row>
              ) : (
                filteredNotifications.map((notification) => (
                  <FancyTable.Row key={notification.id}>
                    <FancyTable.Cell>
                      <button
                        onClick={() => toggleRead(notification.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          notification.isRead 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {notification.isRead && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </FancyTable.Cell>
                    <FancyTable.Cell>
                      <button
                        className={`w-full text-left ${!notification.isRead ? 'font-semibold' : ''} hover:underline cursor-pointer`}
                        onClick={() => openModal(notification)}
                      >
                        {notification.message}
                      </button>
                    </FancyTable.Cell>
                    <FancyTable.Cell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {getTypeLabel(notification.type)}
                      </span>
                    </FancyTable.Cell>
                    <FancyTable.Cell>{notification.createdAt}</FancyTable.Cell>
                    <FancyTable.Cell>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Удалить уведомление"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </FancyTable.Cell>
                  </FancyTable.Row>
                ))
              )}
            </FancyTable.Body>
          </FancyTable>
          )}
        </div>
      </main>
    </div>
  );
}

export default NotificationsPage;
