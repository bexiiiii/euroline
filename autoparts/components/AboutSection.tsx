import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"



const AboutSection = () => (
  <section className="py-16 bg-gray-50">
    <div className="container mx-auto px-6">
      <div className="max-w-6xl">
        <p className="text-xl leading-relaxed text-gray-700 mb-6">
          Компания занимается оптовой продажей автозапчастей для легковых и грузовых автомобилей в Казахстане.
        </p>
        <p className="text-xl leading-relaxed text-gray-700 mb-6">
          Мы предоставляем широкий ассортимент качественных запчастей по выгодным ценам, ориентируясь на потребности автосервисов и магазинов. В нашем каталоге можно найти запчасти от ведущих брендов, таких как Bosch, Varta, Masuma, Comma и Total, для различных марок и моделей автомобилей, включая фильтры, детали подвески, рулевого управления, трансмиссии, тормозной системы и многое другое.
        </p>
        <p className="text-xl leading-relaxed text-gray-700 mb-6">
          Alatrade обеспечивает своевременные поставки и доставку запчастей по всему Казахстану, что делает сотрудничество с нами удобным и выгодным. Мы работаем только с проверенными поставщиками, гарантируя качество продукции.
        </p>
        
        <Accordion type="single" collapsible className="w-full"
      defaultValue="item-1">
  <AccordionItem value="item-1">
    <AccordionTrigger className="text-xl leading-relaxed text-orange-500 mb-6">Показать полностю</AccordionTrigger>
    <AccordionContent>
      <p className="text-xl leading-relaxed text-gray-700 mb-6">
      Мы готовы предложить выгодные условия для постоянных клиентов и обеспечить высокий уровень сервиса.
      </p>

    </AccordionContent>
  </AccordionItem>
</Accordion>
      </div>
    </div>
  </section>
);
export default AboutSection;