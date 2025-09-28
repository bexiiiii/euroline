'use client';

import React from 'react';
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ModalDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  notification: {
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    createdAt: string;
  };
}

export default function ModalDialog({ open, onClose, notification }: ModalDialogProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success': return 'Успех';
      case 'warning': return 'Предупреждение';
      case 'error': return 'Ошибка';
      case 'info': return 'Информация';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Modal open={open} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Детали уведомления</ModalTitle>
          <ModalDescription>
            <span className="mr-4">
              Тип: <span className={`font-medium ${getTypeColor(notification.type)}`}>
                {getTypeLabel(notification.type)}
              </span>
            </span>
            <span>
              Дата: <span className="font-medium">{notification.createdAt}</span>
            </span>
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <p className="text-base leading-relaxed">{notification.message}</p>
        </ModalBody>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="outline">Закрыть</Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
