"use client";
import Breadcrumbs from "@/components/Breadcrumb";
import HelpTabs from "@/components/help-page";
import { ExpandableTabs, TabItem } from "@/components/ui/expandable-tabs-1";
import { Mail, Sparkles, User, Zap } from "lucide-react";

const items = [
  { label: "Главная", href: "/" },
  { label: "кабинет", href: "/cabinet" },
  { label: "Помощь", isCurrent: true },
];


function HelpPage() {
  return (
    <div className="bg-white min-h-screen pt-24">
      <main className="container mx-auto px-6">
        <div className="pt-5">
          <Breadcrumbs items={items} />
        </div>
        <h1 className="text-4xl font-bold pt-4">Помощь</h1>
        <HelpTabs />
      </main>
    </div>
  );
}

export default HelpPage;
