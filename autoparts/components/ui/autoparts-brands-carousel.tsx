"use client"

import React, { type SVGProps } from "react"
import { GradientHeading } from "@/components/ui/gradient-heading"
import { LogoCarousel } from "@/components/ui/logo-carousel"

// Automotive brand icons
function BMWIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="800px"
      height="800px"
      viewBox="0 0 498.503 498.503"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M249.251 498.503c66.577 0 129.168-25.928 176.247-73.005 47.077-47.078 73.005-109.67 73.005-176.247 0-66.576-25.928-129.168-73.005-176.246C378.42 25.927 315.828 0 249.251 0 111.813 0 0 111.813 0 249.251c0 66.577 25.927 129.169 73.005 176.247 47.078 47.077 109.67 73.005 176.246 73.005z" />
      <path
        d="M8.624 249.251c0-64.272 25.03-124.699 70.479-170.148 45.449-45.45 105.875-70.479 170.148-70.479s124.7 25.029 170.148 70.479c45.449 45.449 70.479 105.875 70.479 170.148 0 132.683-107.945 240.628-240.627 240.628-64.273 0-124.699-25.03-170.148-70.479C33.654 373.95 8.624 313.524 8.624 249.251z"
        fill="#fff"
      />
      <path d="M249.251 18.541c-127.416 0-230.71 103.294-230.71 230.71s103.294 230.711 230.71 230.711c127.416 0 230.71-103.295 230.71-230.711s-103.294-230.71-230.71-230.71z" />
      <path
        d="M249.251 396.621c-81.389 0-147.37-65.98-147.37-147.37 0-81.389 65.981-147.37 147.37-147.37 81.389 0 147.37 65.981 147.37 147.37 0 81.39-65.98 147.37-147.37 147.37z"
        fill="#fff"
      />
      <path d="M111.362 249.251h137.889V111.362c-76.153 0-137.889 61.737-137.889 137.889zm137.889 0v137.89c76.153 0 137.889-61.736 137.889-137.89H249.251z" />
    </svg>
  )
}

function MercedesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
        fill="currentColor"
      />
      <path
        d="M12 6l-4 8h2.5L12 12l1.5 2H16l-4-8z"
        fill="currentColor"
      />
    </svg>
  )
}

function AudiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g fill="currentColor">
        <circle cx="6" cy="12" r="3" strokeWidth="1" stroke="currentColor" fill="none" />
        <circle cx="10" cy="12" r="3" strokeWidth="1" stroke="currentColor" fill="none" />
        <circle cx="14" cy="12" r="3" strokeWidth="1" stroke="currentColor" fill="none" />
        <circle cx="18" cy="12" r="3" strokeWidth="1" stroke="currentColor" fill="none" />
      </g>
    </svg>
  )
}

function VolkswagenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M8 10l2 6 2-6 2 6 2-6"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ToyotaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <ellipse cx="12" cy="12" rx="6" ry="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <ellipse cx="12" cy="12" rx="3" ry="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function FordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <ellipse cx="12" cy="12" rx="10" ry="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M6 12h4m2 0h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 9v6m6-6v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HondaIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="3" y="8" width="18" height="8" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M7 12h2m6 0h2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NissanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
      <path
        d="M8 8l8 8M8 16l8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ChevroletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 2l10 8-10 4L2 10l10-8z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M12 6v8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function HyundaiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <ellipse cx="12" cy="12" rx="10" ry="6" stroke="currentColor" strokeWidth="2" fill="none" transform="rotate(45 12 12)" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

// Массив с автомобильными брендами для российского автопарка
const automotiveLogos = [
  { name: "BMW", id: 1, img: BMWIcon },
  { name: "Mercedes", id: 2, img: MercedesIcon },
  { name: "Audi", id: 3, img: AudiIcon },
  { name: "Volkswagen", id: 4, img: VolkswagenIcon },
  { name: "Toyota", id: 5, img: ToyotaIcon },
  { name: "Ford", id: 6, img: FordIcon },
  { name: "Honda", id: 7, img: HondaIcon },
  { name: "Nissan", id: 8, img: NissanIcon },
  { name: "Chevrolet", id: 9, img: ChevroletIcon },
  { name: "Hyundai", id: 10, img: HyundaiIcon },
]

export function AutoPartsBrandsCarousel() {
  return (
    <div className="space-y-8 py-12">
      <div className="mx-auto flex w-full max-w-screen-lg flex-col items-center space-y-8">
        <div className="text-center">
          <GradientHeading variant="secondary" size="sm">
            Популярные автомобильные бренды
          </GradientHeading>
          <GradientHeading size="lg">
            Детали для всех марок
          </GradientHeading>
        </div>

        <LogoCarousel columnCount={3} logos={automotiveLogos} />
      </div>
    </div>
  )
}
