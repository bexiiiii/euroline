import React from "react";
import { NewsItem } from "@/lib/api/news";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  DeleteIcon,
  EditIcon,
  RowAction,
  rowClass,
  tableWrapClass,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
} from "@/components/finance/tableUi";

interface NewsTableProps {
  newsItems: NewsItem[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onEdit: (news: NewsItem) => void;
  onDelete: (id: number) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "numeric",
  });
};

const NewsTable: React.FC<NewsTableProps> = ({ newsItems, isLoading, error, onRetry, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8" role="status" aria-label="Загрузка новостей">
        <div className="size-6 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
      >
        <span>{error}</span>
        {onRetry && (
          <Button size="xs" variant="outline" onClick={onRetry}>
            Повторить
          </Button>
        )}
      </div>
    );
  }

  if (newsItems.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Новостей пока нет</p>
    );
  }

  return (
    <div className={tableWrapClass}>
      <table className="w-full min-w-[720px]">
        <thead className={theadClass}>
          <tr>
            <th className={thClass}>Заголовок</th>
            <th className={thClass}>Статус</th>
            <th className={thClass}>Создана</th>
            <th className={`${thClass} text-right`}>Действия</th>
          </tr>
        </thead>
        <tbody className={tbodyClass}>
          {newsItems.map((news) => (
            <tr key={news.id} className={rowClass}>
              <td className={tdClass}>
                <div className="font-medium text-gray-800 dark:text-white/90">{news.title}</div>
                {news.description && (
                  <div className="line-clamp-1 max-w-xl text-xs text-gray-500 dark:text-gray-400">{news.description}</div>
                )}
              </td>
              <td className={tdClass}>
                <Badge size="sm" color={news.published ? "success" : "light"}>
                  {news.published ? "Опубликована" : "Черновик"}
                </Badge>
              </td>
              <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{formatDate(news.createdAt)}</td>
              <td className={tdClass}>
                <div className="flex items-center justify-end gap-1">
                  <RowAction label={`Редактировать новость «${news.title}»`} onClick={() => onEdit(news)}>
                    <EditIcon />
                  </RowAction>
                  <RowAction label={`Удалить новость «${news.title}»`} onClick={() => onDelete(news.id)} destructive>
                    <DeleteIcon />
                  </RowAction>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NewsTable;
