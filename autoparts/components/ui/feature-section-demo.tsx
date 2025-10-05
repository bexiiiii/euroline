import { FeatureSteps } from "@/components/ui/feature-section"

const features = [
  { 
    step: 'Шаг 1', 
    title: 'Персональный менеджер',
    content: 'После регистрации у вас будет выделенный менеджер, который проконсультирует по вопросу открытия бизнеса, формирования ассортимента, расскажет о доступных сервисах и финансовых инструментах Euroline.',
    image: 'https://alatrade.kz/wp-content/uploads/2024/11/frame-178057022.png'
  },
  { 
    step: 'Шаг 2',
    title: 'Сервисы по подбору запчастей',
    content: 'Вы сможете самостоятельно подбирать запчасти онлайн используя оригинальные каталоги производителей и каталоги заменителей. Если возникнут сложности - персональный менеджер поможет найти и заказать нужные запчасти.',
    image: 'https://alatrade.kz/wp-content/uploads/2024/11/frame-178057022.png'
  },
  { 
    step: 'Шаг 3',
    title: 'Всегда на связи',
    content: 'Наш единый контакт-центр по Казахстану 7600 работает 7 дней в неделю и оказывает техническую и информационную поддержку. Мы также на связи в мессенджерах WhatsApp и Telegram.',
    image: 'https://alatrade.kz/wp-content/uploads/2024/11/frame-178057022.png'
  },
]

export function FeatureStepsDemo() {
  return (
      <FeatureSteps 
        features={features}
        title="Почему удобно работать с Euroline"
        autoPlayInterval={4000}
        imageHeight="h-[400px]"
      />
  )
}
