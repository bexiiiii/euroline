import Breadcrumbs from '@/components/Breadcrumb'
import { ProductDetailContent, type ProductDetailViewModel } from '@/components/ProductDetailContent'
import { getProductByIdentifier, resolveProductImageUrl } from '@/lib/api/products'
import { DEFAULT_PRODUCT_IMAGE } from '@/lib/constants'
import { searchProductsServer } from '@/lib/api/search-server'
import { notFound } from 'next/navigation'

const breadcrumbBase = [
  { label: 'Главная', href: '/' },
  { label: 'Товары недели', href: '/weekly-product' },
]

function fromProductResponse(product: Awaited<ReturnType<typeof getProductByIdentifier>>): ProductDetailViewModel {
  const resolvedImage = resolveProductImageUrl(product.imageUrl) || DEFAULT_PRODUCT_IMAGE

  const warehouses = (product.warehouses || []).map((warehouse) => ({
    name: warehouse?.name,
    quantity: warehouse?.quantity ?? 0,
  }))

  const stockFromWarehouses = warehouses.reduce((sum, warehouse) => sum + (warehouse.quantity ?? 0), 0)
  const stock = typeof product.stock === 'number' ? product.stock : stockFromWarehouses

  return {
    id: product.id,
    article: product.code,
    name: product.name,
    code: product.code,
    description: product.description,
    brand: product.brand,
    imageUrl: resolvedImage,
    price: product.price,
    stock,
    warehouses,
    properties: (product.properties || []).map((property) => ({
      propertyName: property.propertyName,
      propertyValue: property.propertyValue,
    })),
  }
}

async function fromSearchFallback(article: string): Promise<ProductDetailViewModel> {
  const response = await searchProductsServer(article)
  const lowerArticle = article.trim().toLowerCase()
  const match = response.results?.find((item) => item.oem?.trim().toLowerCase() === lowerArticle)
    ?? response.results?.[0]

  if (!match) {
    throw new Error('No search match')
  }

  const warehouses = (match.warehouses || []).map((warehouse) => ({
    name: warehouse.name,
    quantity: warehouse.qty,
  }))
  const stockFromWarehouses = warehouses.reduce((sum, warehouse) => sum + (warehouse.quantity ?? 0), 0)
  const stock = typeof match.quantity === 'number' ? match.quantity : stockFromWarehouses
  const resolvedImage = resolveProductImageUrl(match.imageUrl) || DEFAULT_PRODUCT_IMAGE

  return {
    article: match.oem,
    id: undefined,
    name: match.name || match.oem,
    code: match.oem,
    brand: match.brand,
    imageUrl: resolvedImage,
    price: match.price,
    stock,
    warehouses,
    properties: (match.vehicleHints || []).map((hint, index) => ({
      propertyName: `Применимость ${index + 1}`,
      propertyValue: hint,
    })),
  }
}

export default async function PartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params
  if (!raw || raw.trim().length === 0) {
    notFound()
  }
  const numericId = Number(raw)

  let product
  try {
    const identifier = Number.isFinite(numericId) && numericId > 0 ? numericId : raw
    const fetched = await getProductByIdentifier(identifier as string | number)
    product = fromProductResponse(fetched)
  } catch (error) {
    try {
      product = await fromSearchFallback(raw)
    } catch (fallbackError) {
      notFound()
    }
  }

  const breadcrumbItems = [
    ...breadcrumbBase,
    { label: product.name, href: `/parts/${raw}` },
  ]

  return (
    <div className="bg-gray-100 min-h-screen pt-20 md:pt-24">
      <main className="container mx-auto px-4 md:px-6">
        <div className="pt-3 md:pt-5">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <ProductDetailContent product={product} />
      </main>
    </div>
  )
}
