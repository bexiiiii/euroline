'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import Link from 'next/link';

export function ProfileDropDown() {
  const { user, logout, loading } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Link 
        href="/signin" 
        className="text-sm font-medium text-gray-700 hover:text-brand-600 dark:text-gray-300 dark:hover:text-brand-400"
      >
        Войти
      </Link>
    );
  }

  const initials = user.name
    ? `${user.name.charAt(0)}${user.surname ? user.surname.charAt(0) : ''}`
    : user.email.substring(0, 2).toUpperCase();

  const fullNameParts = [user.surname, user.name].filter(Boolean);
  const fullName = fullNameParts.length > 0 ? fullNameParts.join(' ') : user.clientName;
  const displayName = fullName || user.name || user.clientName || user.email;
  const roleLabel = user.role === 'ADMIN' ? 'Системный администратор' : 'Пользователь системы';

  return (
    <div className="relative">
      <button 
        className="flex items-center gap-2 outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {roleLabel}
          </p>
        </div>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700">
              <p className="font-medium text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{roleLabel}</p>
            </div>
            
            <Link 
              href="/profile" 
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Редактировать профиль
            </Link>
            
            <Link 
              href="/settings" 
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Настройки аккаунта
            </Link>

            <Link
              href="/support"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Поддержка
            </Link>
            
            <div className="border-t border-gray-100 dark:border-gray-700"></div>
            
            <button
              type="button"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
