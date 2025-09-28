import { FeatureSteps } from "@/components/ui/feature-section"

const features = [
  { 
    step: 'Шаг 1', 
    title: 'Персональный менеджер',
    content: 'После регистрации у вас будет выделенный менеджер, который проконсультирует по вопросу открытия бизнеса, формирования ассортимента, расскажет о доступных сервисах и финансовых инструментах ALATRADE.',
    image: 'https://images.unsplash.com/photo-1515168833906-d2a3b82b3029?auto=format&fit=crop&w=800&q=80'
  },
  { 
    step: 'Шаг 2',
    title: 'Сервисы по подбору запчастей',
    content: 'Вы сможете самостоятельно подбирать запчасти онлайн используя оригинальные каталоги производителей и каталоги заменителей. Если возникнут сложности - персональный менеджер поможет найти и заказать нужные запчасти.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
  },
  { 
    step: 'Шаг 3',
    title: 'Всегда на связи',
    content: 'Наш единый контакт-центр по Казахстану 7600 работает 7 дней в неделю и оказывает техническую и информационную поддержку. Мы также на связи в мессенджерах WhatsApp и Telegram.',
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=800&q=80'
  },
]

export function FeatureStepsDemo() {
  return (
      <FeatureSteps 
        features={features}
        title="Почему удобно работать с ALATRADE"
        autoPlayInterval={4000}
        imageHeight="h-[400px]"
      />
  )
}
