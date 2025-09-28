// components/ImageGallery.tsx
'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import Image from "next/image";
import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";


const images = [
  {
    id: "img1",
    src: "https://images.unsplash.com/photo-1603787081269-23865b0e0c03?auto=format&fit=crop&w=800&q=80",
    alt: "Filter Part 1",
  },
  {
    id: "img2",
    src: "https://images.unsplash.com/photo-1602524813097-0f4b9f5e9e37?auto=format&fit=crop&w=800&q=80",
    alt: "Filter Part 2",
  },
  {
    id: "img3",
    src: "https://images.unsplash.com/photo-1581092334554-1273a6c8e52d?auto=format&fit=crop&w=800&q=80",
    alt: "Filter Part 3",
  },
  {
    id: "img4",
    src: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=800&q=80",
    alt: "Filter Part 4",
  },
  {
    id: "img5",
    src: "https://images.unsplash.com/photo-1581093448798-5e6a6c1a9fcf?auto=format&fit=crop&w=800&q=80",
    alt: "Filter Part 5",
  },
];


export default function ImageGallery() {
  const [activeTab, setActiveTab] = useState("img1");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex gap-6">
      {/* Left thumbnails */}
      <TabsList className="flex flex-col gap-2 h-fit bg-transparent p-0">
        {images.map((image) => (
          <TabsTrigger
            key={image.id}
            value={image.id}
            className="data-[state=active]:border-orange-500 border-2 rounded-md p-1"
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={64}
              height={64}
              className="object-contain rounded-sm"
            />
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Main image display */}
      <div className="flex-1">
        {images.map((image) => (
          <TabsContent key={image.id} value={image.id}>
            <AspectRatio ratio={4 / 3}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="rounded-md object-contain border"
              />
            </AspectRatio>
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
