"use client"

import { useEffect } from "react"

export default function YandexMapShop() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU"
    script.type = "text/javascript"
    script.onload = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => {
          const map = new window.ymaps.Map("yandex-map", {
            center: [42.342638, 69.663736], // Центр на Карабулак
            zoom: 19,
            controls: ["zoomControl"],
          })

          const placemark = new window.ymaps.Placemark(
            [42.342638, 69.663736], // Метка там же
            {
              balloonContent: "📍 Кафе Райский Сад",
              hintContent: "г. Карабулак, Райский Сад",
            },
            {
              preset: "islands#blueHomeCircleIcon",
            }
          )

          map.geoObjects.add(placemark)
        })
      }
    }

    document.body.appendChild(script)
  }, [])

  return (
    <div className="w-full h-[400px] rounded-xl border" id="yandex-map" />
  )
}
