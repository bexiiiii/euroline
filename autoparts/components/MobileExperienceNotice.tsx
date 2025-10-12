'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

const STORAGE_KEY = 'mobile-desktop-preference';

export function MobileExperienceNotice() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;

    if (sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }

    const toastId = toast.info(
      'Для полного функционала интернет-магазина рекомендуем перейти на десктопную версию сайта.',
      {
        duration: 9000,
        action: {
          label: 'Хорошо',
          onClick: () => toast.dismiss(toastId),
        },
      }
    );

    sessionStorage.setItem(STORAGE_KEY, '1');

    return () => {
      toast.dismiss(toastId);
    };
  }, []);

  return null;
}
