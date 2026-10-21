"use client";
import React, { useEffect, useRef, useState,useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  BellIcon,
  BoxCubeIcon,
  ChevronDownIcon,
  DocsIcon,
  DollarLineIcon,
  GridIcon,
  GroupIcon,
  LockIcon,
  PlugInIcon,
  ShootingStarIcon,
  TaskIcon,
  TimeIcon,
  UserCircleIcon,
} from "../icons/index";


type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Дашборд",
    subItems: [
      { name: "Статистика", path: "/" },
      { name: "Аналитика", path: "/analytics" },
    ],
  },
  {
    icon: <BellIcon />,
    name: "Уведомления",
    path: "/notifications",
  },
  {
    icon: <BoxCubeIcon />,
    name: "Товары",
    subItems: [
      { name: "Товары", path: "/products" },
      { name: "Категории и подкатегории", path: "/categories" },
    ],
  },
  {
    icon: <TaskIcon />,
    name: "Заказы",
    subItems: [
      { name: "Заказы", path: "/orders" },
      { name: "Корзины", path: "/carts" },
      { name: "Возвраты", path: "/returns" },
    ],
  },
  {
    icon: <GroupIcon />,
    name: "Клиенты",
    subItems: [
      { name: "Клиенты", path: "/customers" },
      { name: "История поиска", path: "/customer-search-history" },
    ],
  },
  {
    icon: <DollarLineIcon />,
    name: "Финансы и платежи",
    subItems: [
      { name: "Пополнение баланса", path: "/payment" },
      { name: "Запросы на возврат", path: "/return-requests" },
      { name: "История возвратов", path: "/return-history" },
      { name: "Остатки на счетах", path: "/account-balances" },
      { name: "Кредитные лимиты", path: "/payment/credit-settings" },
    ],
  },
  {
    icon: <ShootingStarIcon />,
    name: "Маркетинг",
    subItems: [{ name: "Рекламные баннеры", path: "/product-banners" }],
  },
  {
    icon: <DocsIcon />,
    name: "Новости",
    path: "/news",
  },
  {
    icon: <LockIcon />,
    name: "Пользователи",
    path: "/users",
  },
  {
    icon: <TimeIcon />,
    name: "Журнал событий",
    path: "/event-log",
  },
  {
    icon: <PlugInIcon />,
    name: "Технические настройки",
    subItems: [
      { name: "API", path: "/api-management" },
      { name: "Настройки сайта", path: "/site-settings" },
      { name: "Логи ошибок", path: "/error-logs" },
      { name: "Состояние системы", path: "/system-status" },
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Мой профиль",
    path: "/profile",
  },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-1">
      {navItems.map((nav, index) => (
        <li key={`${nav.name}-${index}`}>
          {nav.subItems ? (
            <button
              type="button"
              onClick={() => handleSubmenuToggle(index, menuType)}
              aria-expanded={openSubmenu?.type === menuType && openSubmenu?.index === index}
              aria-label={!isExpanded && !isHovered && !isMobileOpen ? nav.name : undefined}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                aria-label={!isExpanded && !isHovered && !isMobileOpen ? nav.name : undefined}
                aria-current={isActive(nav.path) ? "page" : undefined}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-1 mb-1 space-y-0.5 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      aria-current={isActive(subItem.path) ? "page" : undefined}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname,isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Euroline"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Euroline"
                width={150}
                height={40}
              />
            </>
          ) : (
            // Свёрнутый сайдбар: показываем только знак (левую часть логотипа)
            <span className="flex h-8 w-8 items-center overflow-hidden">
              <Image
                className="max-w-none dark:hidden"
                src="/images/logo/logo.svg"
                alt="Euroline"
                width={140}
                height={29}
              />
              <Image
                className="hidden max-w-none dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Euroline"
                width={140}
                height={29}
              />
            </span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6" aria-label="Основное меню">
          <div className="flex flex-col gap-4">
            <div>
              {renderMenuItems(navItems, "main")}
            </div>

            
          </div>
        </nav>
        
      </div>
    </aside>
  );
};

export default AppSidebar;
