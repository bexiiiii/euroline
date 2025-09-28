"use client"

import React, { useState } from "react"
import Image from "next/image"
import { DetailDto } from "@/lib/api/vehicle"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info, Eye, Package, Wrench } from "lucide-react"

interface PartCardProps {
  detail: DetailDto
  className?: string
}

export function PartCard({ detail, className = "" }: PartCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)

  const handleImageError = () => {
    setImageError(true)
  }

  const hasImage = detail.imageUrl && !imageError

  return (
    <Card className={`w-full hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {detail.name}
          </CardTitle>
          {detail.codeOnImage && (
            <Badge variant="secondary" className="ml-2">
              №{detail.codeOnImage}
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm text-gray-600">
          OEM: <span className="font-mono text-blue-600">{detail.oem}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Изображение */}
        {hasImage && (
          <div className="relative">
            <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
              <DialogTrigger asChild>
                <div className="relative cursor-pointer group">
                  <Image
                    src={detail.imageUrl}
                    alt={detail.name}
                    width={300}
                    height={200}
                    className="rounded-lg object-contain border hover:border-blue-500 transition-colors"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={24} />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{detail.name} - Схема</DialogTitle>
                </DialogHeader>
                <div className="flex justify-center">
                  <Image
                    src={detail.largeImageUrl || detail.imageUrl}
                    alt={detail.name}
                    width={800}
                    height={600}
                    className="rounded-lg object-contain"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Основная информация */}
        <div className="space-y-2">
          {detail.qty && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm">
                    <Package size={16} className="text-green-600" />
                    <span>Количество: <strong>{detail.qty}</strong></span>
                    <Info size={14} className="text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Количество деталей на автомобиле</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {detail.applicability && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Wrench size={16} />
              <span>{detail.applicability}</span>
            </div>
          )}

          {detail.note && (
            <div className="bg-blue-50 p-2 rounded text-sm text-blue-800">
              <strong>Характеристики:</strong> {detail.note}
            </div>
          )}

          {detail.replacedOem && (
            <div className="text-sm text-amber-700">
              <strong>Заменяет:</strong> <span className="font-mono">{detail.replacedOem}</span>
            </div>
          )}

          {detail.componentCode && (
            <Badge variant="outline">
              Код компонента: {detail.componentCode}
            </Badge>
          )}
        </div>

        {/* Footnote с тултипом */}
        {detail.footnote && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-gray-500 cursor-help">
                  <Info size={14} />
                  <span className="truncate">Дополнительная информация...</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-md">
                <p>{detail.footnote}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Контекстная информация */}
        <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
          <div>Узел: {detail.unitName}</div>
          <div>Категория: {detail.categoryName}</div>
        </div>
      </CardContent>
    </Card>
  )
}
