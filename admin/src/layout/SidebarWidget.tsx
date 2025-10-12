import React from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { BellIcon } from "@/icons";

const SidebarWidget: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 xl:sticky xl:top-24">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            <BellIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Центр уведомлений</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Быстрый доступ к отправке сообщений и истории рассылок.
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            Создавайте системные уведомления для пользователей и отслеживайте историю отправок на отдельной странице.
          </p>
          <Button asChild className="w-full">
            <Link href="/notifications">Открыть центр уведомлений</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SidebarWidget;
