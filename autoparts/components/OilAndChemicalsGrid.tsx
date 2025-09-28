"use client";

import Image from "next/image";
import Link from "next/link";

type SubCategory = {
  title: string;
  image: string;
  href: string;
};

type OilAndChemicalsGridProps = {
  title: string;
  mainImage: string;
  subcategories?: SubCategory[];
  link?: string;
};

const OilAndChemicalsGrid = ({
  title,
  mainImage,
  subcategories = [],
  link,
}: OilAndChemicalsGridProps) => {
  return (
    <div className="bg-gray-100 rounded-md p-3 md:p-4 hover:border transition h-full flex flex-col">
      <h3 className="text-lg md:text-xl font-semibold text-gray-800 hover:text-orange-500 mb-3 md:mb-4">
        {link ? (
          <Link href={link}>
            <span className="hover:underline">{title}</span>
          </Link>
        ) : (
          title
        )}
      </h3>

    <div className="flex gap-2 md:gap-4 h-full">
      <div className="relative w-full h-48 sm:h-48 md:h-60 lg:h-64 flex-1 overflow-hidden">
        <Image
          src={mainImage}
          alt={title}
          fill
          className="object-cover   hover:scale-105 transition-transform"
        />
      </div>

      {/* Показываем подкатегории, если они есть */}
      {subcategories.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 md:gap-4 flex-1">
          {subcategories.map((item, i) => (
            <Link
              href={item.href}
              key={i}
              className="bg-white p-2 md:p-3 flex flex-col items-center text-center hover:shadow hover:border border-gray-400"
            >
              <Image
                src={item.image}
                alt={item.title}
                width={60}
                height={60}
                className="mb-1 md:mb-2 object-contain w-10 h-10 md:w-15 md:h-15"
              />
              <span className="text-xs md:text-sm font-medium text-gray-700 leading-tight break-words">{item.title}</span>
            </Link>
          ))}
        </div>
      ) : (
        // если нет подкатегорий, оставим пустой блок, чтобы сохранить выравнивание
        <div className="hidden md:block flex-1" />
      )}
    </div>
  </div>
);
}

export default OilAndChemicalsGrid;
