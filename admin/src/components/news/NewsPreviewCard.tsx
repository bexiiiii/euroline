import React from "react";
import Badge from "@/components/ui/badge/Badge";

interface NewsPreviewCardProps {
  title: string;
  description: string;
  coverImageUrl?: string;
  published: boolean;
}

const NewsPreviewCard: React.FC<NewsPreviewCardProps> = ({ title, description, coverImageUrl, published }) => {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div
        className="relative h-36 w-full overflow-hidden bg-gray-100 bg-center bg-cover dark:bg-gray-800"
        style={coverImageUrl ? { backgroundImage: `url(${coverImageUrl})` } : undefined}
      >
        {!coverImageUrl && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Нет обложки
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <Badge size="sm" color={published ? "success" : "light"}>
          {published ? "Опубликована" : "Черновик"}
        </Badge>
        <h3 className="line-clamp-2 text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        <p className="line-clamp-3 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </article>
  );
};

export default NewsPreviewCard;
