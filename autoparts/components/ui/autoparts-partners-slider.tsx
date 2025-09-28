"use client";
import { motion } from "framer-motion";
import React from "react";
import { ImagesSlider } from "@/components/ui/images-slider";

export function AutoPartsPartnersSlider() {
  // Images related to automotive parts, warehouses, partnerships
  const images = [
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1914&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Auto parts warehouse
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Car parts
    "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Business handshake
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
