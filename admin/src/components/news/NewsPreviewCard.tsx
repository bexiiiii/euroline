import { cn } from "@/lib/utils";

interface NewsPreviewCardProps {
  title: string;
  description: string;
  coverImageUrl?: string;
  published: boolean;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1544077960-604201fe74bc?auto=format&fit=crop&w=1280&q=80";

const NewsPreviewCard: React.FC<NewsPreviewCardProps> = ({ title, description, coverImageUrl, published }) => {
  const imageSrc = coverImageUrl || FALLBACK_IMAGE;

  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div
        className="relative h-40 w-full overflow-hidden bg-center bg-cover"
        style={{ backgroundImage: `url(${imageSrc})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent" />
        <span
          className={cn(
            "absolute bottom-3 left-3 rounded-full px-3 py-1 text-xs font-semibold text-white backdrop-blur",
            published ? "bg-emerald-500/80" : "bg-yellow-500/80"
          )}
        >
          {published ? "Опубликовано" : "Черновик"}
        </span>
      </div>

      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">Предпросмотр карточки</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900 line-clamp-2">{title}</h3>
        <p className="mt-3 text-sm text-gray-600 line-clamp-3">{description}</p>
      </div>
    </article>
  );
};

export default NewsPreviewCard;
