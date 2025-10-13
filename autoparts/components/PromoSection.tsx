import { Logos3 } from "./blocks/logos3";

const PromoSection = () => {
 const demoData = {
  heading: "Выгодные предложения на запчасти от лучших производителей",
  logos: [
    {
      id: "logo-1",
      description: "logo-1",
      image: "/logos/logo_areol-1-1-1-1.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-2",
      description: "logo-2",
      image: "/logos/logo_areol-1-1-2.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-3",
      description: "logo-3",
      image: "/logos/logo_areol-1-1-3.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-4",
      description: "logo-4",
      image: "/logos/logo_areol-1-1-4.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-5",
      description: "logo-5",
      image: "/logos/logo_areol-1-2-1.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-6",
      description: "logo-6",
      image: "/logos/logo_areol-1-1-2.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-7",
      description: "logo-7",
      image: "/logos/logo_areol-1-1-3.svg",
      className: "h-4 w-auto",
    },
    {
      id: "logo-8",
      description: "logo-8",
      image: "/logos/logo_areol-1-1-4.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-9",
      description: "logo-9",
      image: "/logos/total-logo-2.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-10",
      description: "logo-10",
      image: "/logos/Denso_logo.svg.png",
      className: "h-7 w-auto",
    },
    {
      id: "logo-11",
      description: "logo-11",
      image: "/logos/Bosch-logo.svg.png",
      className: "h-7 w-auto",
    },
  ],
};


  return (
    <div className="container mx-auto px-4">
      <Logos3 {...demoData} />
    </div>
  );
};

export default PromoSection;


