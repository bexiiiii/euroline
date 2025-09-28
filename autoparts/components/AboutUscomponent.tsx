import { About3 } from "@/components/ui/about-3";

const AboutUsComponent = () => {
  return (
    <About3
      title="О Компании"
      description="ALATRADE занимается продажей легковых запчастей оптом. Наш опыт и современные технологии позволяют предложить клиентам только лучшую продукцию и сервис."
      mainImage={{
        src: "https://shadcnblocks.com/images/block/placeholder-1.svg",
        alt: "placeholder",
      }}
      secondaryImage={{
        src: "https://shadcnblocks.com/images/block/placeholder-2.svg",
        alt: "placeholder",
      }}
      breakout={{
        src: "https://shadcnblocks.com/images/block/block-1.svg",
        alt: "logo",
        title: "Alatrade",
        description:
          "Мы предлагаем полный ассортимент запасных частей для легковых и грузовых автомобилей европейских, американских, японских, корейских и российских марок.",
        buttonText: "Узнать больше",
        buttonUrl: "/",
      }}
      companiesTitle="Нас ценят клиенты по всему миру"
      companies={[
        {
          src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-1.svg",
          alt: "Arc",
        },
        {
          src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-2.svg",
          alt: "Descript",
        },
        {
          src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-3.svg",
          alt: "Mercury",
        },
        {
          src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-4.svg",
          alt: "Ramp",
        },
        {
          src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-5.svg",
          alt: "Retool",
        },
        {
          src: "https://shadcnblocks.com/images/block/logos/company/fictional-company-logo-6.svg",
          alt: "Watershed",
        }
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
