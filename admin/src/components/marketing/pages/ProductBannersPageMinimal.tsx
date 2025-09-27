"use client";
import React from "react";
import ComponentCard from "@/components/common/ComponentCard";
import MarketingStats from "../MarketingStats";
import MarketingToolbar from "../MarketingToolbar";

const ProductBannersPageMinimal = () => {
  const toolbarActions = [
    {
      label: "Создать баннер",
      variant: "primary" as const,
      onClick: () => {
        console.log("Create banner");
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <MarketingStats
        title="Статистика баннеров"
        stats={[
          {
            title: "Активных баннеров",
            value: "12",
            change: "+2",
            changeType: "increase" as const,
            description: "баннеров активно"
          }
        ]}
      />

      {/* Main Content */}
      <ComponentCard
        title="Рекламные баннеры"
        description="Управление рекламными баннерами на сайте"
        action={
          <MarketingToolbar
            title="Баннеры"
            actions={toolbarActions}
          />
        }
      >
        <div className="p-6">
          <p>Таблица баннеров будет здесь</p>
        </div>
      </ComponentCard>
    </div>
  );
};

export default ProductBannersPageMinimal;
