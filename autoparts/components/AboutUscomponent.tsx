import { About3 } from "@/components/ui/about-3";

const AboutUsComponent = () => {
  return (
    <About3
      title="О Компании"
      description="Euroline занимается продажей легковых запчастей оптом. Наш опыт и современные технологии позволяют предложить клиентам только лучшую продукцию и сервис."
      mainImage={{
        src: "/images/site/partners-slider-warehouse.jpg",
        alt: "Склад Euroline",
      }}
      secondaryImage={{
        src: "/images/site/benefit-manager.jpg",
        alt: "Менеджер Euroline",
      }}
      breakout={{
        src: "/euroline-logo.png",
        alt: "Euroline",
        title: "Euroline",
        description:
          "Мы предлагаем полный ассортимент запасных частей для легковых и грузовых автомобилей европейских, американских, японских, корейских и российских марок.",
        buttonText: "Узнать больше",
        buttonUrl: "/",
      }}
      companiesTitle="Работаем с проверенными брендами"
      companies={[
        { src: "/logos/Bosch-logo.svg.png", alt: "Bosch" },
        { src: "/logos/Denso_logo.svg.png", alt: "Denso" },
        { src: "/logos/Varta-Logo.svg.png", alt: "Varta" },
        { src: "/logos/total-logo-2.svg", alt: "Total" },
      ]}
      achievementsTitle="Наши достижения в цифрах"
      achievementsDescription="Мы предлагаем полный ассортимент запасных частей для легковых и грузовых автомобилей европейских, американских, японских, корейских и российских марок."
      achievements={
        [
          { label: "Поддерживаемые компании", value: "300+" },
          { label: "Завершенные проекты", value: "800+" },
          { label: "Счастливые клиенты", value: "99%" },
          { label: "Признанные награды", value: "10+" },
        ]
      }
    />
  );
};

export { AboutUsComponent };
