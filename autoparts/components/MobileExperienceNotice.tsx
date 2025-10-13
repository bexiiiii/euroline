'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'mobile-desktop-preference';

export function MobileExperienceNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;

    if (sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(STORAGE_KEY, '1');
    }, 400);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm text-left">
        <DialogHeader className="space-y-2">
          <DialogTitle>Попробуйте мобильную версию</DialogTitle>
          <DialogDescription>
            Мы заметили, что вы заходите с телефона. Для удобства пользуйтесь десктопным интерфейсом —
            все основные функции работают здесь полностью.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3 pt-0 text-sm text-gray-600">
          <p>Если что-то выглядит некорректно, обновите страницу или переключитесь на десктопную версию сайта.</p>
        </DialogBody>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Продолжить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
