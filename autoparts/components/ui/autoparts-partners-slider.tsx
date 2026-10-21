"use client";
import { motion } from "framer-motion";
import React from "react";
import { ImagesSlider } from "@/components/ui/images-slider";

export function AutoPartsPartnersSlider() {
  const images = [
    "/images/site/partners-slider-warehouse.jpg",
    "/images/site/partners-slider-parts.jpg",
  ];
  
  return (
    <ImagesSlider className="h-[40rem]" images={images}>
      <motion.div
        initial={{
          opacity: 0,
          y: -80,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.6,
        }}
        className="z-50 flex flex-col justify-center items-center"
      >
        <motion.p className="font-bold text-xl md:text-6xl text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 py-4">
          Надежные партнеры <br /> для вашего бизнеса
        </motion.p>
        <motion.p className="font-normal text-base md:text-lg text-neutral-300 max-w-lg text-center px-4">
          Работаем с ведущими поставщиками автозапчастей, обеспечивая качество и оригинальность деталей для всех марок автомобилей
        </motion.p>
        <button className="px-6 py-3 backdrop-blur-sm border bg-blue-500/10 border-blue-500/20 text-white mx-auto text-center rounded-full relative mt-6 hover:bg-blue-500/20 transition-colors">
          <span>Стать партнером →</span>
          <div className="absolute inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-blue-500 to-transparent" />
        </button>
      </motion.div>
    </ImagesSlider>
  );
}
