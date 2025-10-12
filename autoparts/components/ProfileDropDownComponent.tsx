'use client';

import { useCallback, useState } from 'react';
import {
  CreditCard,
  HelpCircle,
  LogOut,
  Mail,
  RotateCcw,
  Search,
  User,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/radix-dropdown-menu';
import AvatarComponent from './AvatarComponent';
import { useAuthStore } from '@/lib/stores/authStore';
import { useNotificationsStore } from '@/lib/stores/notificationsStore';
import { useRouter } from 'next/navigation';
 
export const RadixDropdownMenu = () => {
  const { logout, user } = useAuthStore();
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const handleLogout = useCallback(() => {
    setOpen(false);
    logout();
    router.push('/');
  }, [logout, router]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Меню пользователя"
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          <AvatarComponent className="h-10 w-10" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end">
        <DropdownMenuLabel>
          {user?.name ? `${user.name} ${user.surname || ''}`.trim() : 'Мой аккаунт'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              navigate('/profile');
            }}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Профиль</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              navigate('/cabinet');
            }}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Личный кабинет</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              navigate('/finances');
            }}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Финансы</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Заказы</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    navigate('/order-history');
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Мои заказы</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    navigate('/order-returns');
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  <span>Оформление возврата</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              navigate('/notifications');
            }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                <span>Уведомления</span>
              </span>
              {unreadCount > 0 && (
                <span className="relative inline-flex items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-70"></span>
                  <span className="relative inline-flex min-w-[24px] justify-center rounded-full bg-orange-500 px-2 text-xs font-semibold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                </span>
              )}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              navigate('/search-history');
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>История поиска</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              navigate('/help');
            }}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Помощь</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
