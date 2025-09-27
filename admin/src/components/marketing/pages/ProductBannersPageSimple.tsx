"use client";
import React, { useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import MarketingStats from "../MarketingStats";
import MarketingToolbar from "../MarketingToolbar";
import ProductBannersTable from "../ProductBannersTable";

const ProductBannersPageSimple = () => {
  const toolbarActions = [
    {
      label: "Создать баннер",
      variant: "primary" as const,
      onClick: () => {
        console.log("Create banner");
      },
    },
    {
      label: "Экспорт",
      variant: "outline" as const,
      onClick: () => {
        console.log("Экспорт данных баннеров");
      },
    },
  ];

  const handleEditBanner = (banner: any) => {
    console.log("Edit banner:", banner);
  };

  const handleViewBanner = (banner: any) => {
    console.log("View banner:", banner);
  };

  const handlePreviewBanner = (banner: any) => {
    console.log("Preview banner:", banner);
  };

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
          },
          {
            title: "Общие показы",
            value: "45.2K",
            change: "+12%",
            changeType: "increase" as const,
            description: "за последний месяц"
          },
          {
            title: "Общие клики",
            value: "2.1K",
            change: "+8%",
            changeType: "increase" as const,
            description: "переходов пользователей"
          },
          {
            title: "Средний CTR",
            value: "4.7%",
            change: "-0.2%",
            changeType: "decrease" as const,
            description: "кликабельность баннеров"
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
        <ProductBannersTable
          onEdit={handleEditBanner}
          onView={handleViewBanner}
          onPreview={handlePreviewBanner}
        />
      </ComponentCard>
    </div>
  );
};

export default ProductBannersPageSimple;
