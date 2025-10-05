import Image from "next/image";
import React from "react";
import { Timeline } from "@/components/ui/timeline";

export function WorkWithUsComponent() {
  const data = [
    {
      title: "Персональный менеджер",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            После регистрации у вас будет выделенный менеджер, который проконсультирует по вопросу открытия бизнеса, формирования ассортимента, расскажет о доступных сервисах и финансовых инструментах ALATRADE.
          </p>
          <div className="grid  gap-4">
            <Image
              src="https://alatrade.kz/wp-content/uploads/2024/11/frame-1984014389.png"
              alt="startup template"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-90 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
           
          </div>
        </div>
      ),
    },
    {
      title: "Сервисы по подбору запчастей",
      content: (
        <div>
          <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
            Вы сможете самостоятельно подбирать запчасти онлайн используя оригинальные каталоги производителей и каталоги заменителей. Если возникнут сложности - персональный менеджер поможет найти и заказать нужные запчасти.
          </p>
          
          <div className="grid  gap-4">
            <Image
              src="https://alatrade.kz/wp-content/uploads/2024/11/frame-1984014389.png"
              alt="startup template"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-90 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
           
          </div>
        </div>
      ),
    },
      {
        title: "Выбор поставщика",
        content: (
          <div>
            <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-4">
             На сайте работает система, которая рассчитывает вероятности поставки для каждого поставщика. Если поставщик задерживает или срывает поставки, присылает брак или пересорт, вы узнаете об этом по его рейтингу и избежите невыгодной сделки.
            </p>
            
            <div className="grid  gap-4">
            <Image
              src="https://alatrade.kz/wp-content/uploads/2024/11/frame-1984014389.png"
              alt="startup template"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-90 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
           
          </div>
          </div>
        ),
      },
        {
        title: "Интеграция с вашими системами",
        content: (
          <div>
            <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-4">
             Вы можете интегрировать нашу систему в свою инфраструктуру, чтобы автоматически оформлять заказы и отслеживать информацию по ним. После регистрации менеджер пришлет инструкцию по подключению для разработчиков.
            </p>
           
            <div className="grid  gap-4">
            <Image
              src="https://alatrade.kz/wp-content/uploads/2024/11/frame-1984014389.png"
              alt="startup template"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-90 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
           
          </div>
          </div>
        ),
      },
       {
        title: "Всегда на связи",
        content: (
          <div>
            <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-4">
              Наш единый контакт-центр по Казахстану 7600 работает 7 дней в неделю и оказывает техническую и информационную поддержку. Мы также на связи в мессенджерах WhatsApp и Telegram.
            </p>
            
            <div className="grid  gap-4">
            <Image
              src="https://alatrade.kz/wp-content/uploads/2024/11/frame-1984014389.png"
              alt="startup template"
              width={500}
              height={500}
              className="rounded-lg object-cover h-20 md:h-44 lg:h-90 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]"
            />
           
          </div>
          </div>
        ),
      },
  ];
  return (
    <div className="max-w-none">
      <Timeline data={data} />
    </div>
  );
}
