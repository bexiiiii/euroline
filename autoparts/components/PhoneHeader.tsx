"use client";

import React from 'react';
import { InteractiveMenu, InteractiveMenuItem } from "@/components/ui/modern-mobile-menu";
import { Home, Boxes, Tag, Phone, User } from 'lucide-react';

const lucideDemoMenuItems: InteractiveMenuItem[] = [
  { label: 'Главная', icon: Home, href: '/' },
  { label: 'Каталог', icon: Boxes, href: '/categories' },
  { label: 'Товар недели', icon: Tag, href: '/weekly-product' },
  { label: 'Контакты', icon: Phone, href: '/contacts' },
  { label: 'Новости', icon: User, href: '/news' },
];

const customAccentColor = '#FF5733'; // Example custom color

const Default = () => {
  return <InteractiveMenu />;
};

const Customized = () => {
  return <InteractiveMenu items={lucideDemoMenuItems} accentColor={customAccentColor} />;
};

export { Default, Customized };
export default Customized;
