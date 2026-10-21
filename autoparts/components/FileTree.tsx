"use client"

import React, { useState, useCallback } from "react"
import { LazyTreeItem } from "@/components/ui/lazy-tree-item"
import { useVehicle } from "@/context/VehicleContext"
import { vehicleApi } from "@/lib/api/vehicle"
import { CategoryNodeDto, UnitDto, DetailDto, QuickGroupDto } from "@/lib/api/vehicle"
import { catalogTreeState, treeStateKey } from "@/lib/catalogTreeState"

// Конвертируем данные API в формат для FilesystemItem
type TreeNode = {
  name: string
  nodes?: TreeNode[]
  id?: number | string
  type?: 'category' | 'unit' | 'detail' | 'quickgroup' | 'system'
  data?: CategoryNodeDto | UnitDto | DetailDto | QuickGroupDto | { name: string, items: QuickGroupDto[] }
  isLoaded?: boolean  // Флаг для ленивой загрузки
}

interface FileTreeProps {
  className?: string
  onQuickGroupSelected?: (groupId: number, groupName: string, details: DetailDto[]) => void
  onQuickGroupLoading?: (groupId: number, groupName: string) => void
}

export default function FileTree({ className, onQuickGroupSelected, onQuickGroupLoading }: FileTreeProps) {
  const { session } = useVehicle()
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [showOnlyTO, setShowOnlyTO] = useState(true) // По умолчанию показываем только ТО
  const stateKey = treeStateKey(session?.catalog, session?.vehicleId)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Отладочная информация
  console.log('FileTree: Текущая сессия:', {
    hasSession: !!session,
    vehicleId: session?.vehicleId,
    catalog: session?.catalog,
    brand: session?.brand,
    name: session?.name,
    hasSsd: !!session?.ssd
  })

  // Обработчик обновления узла (для ленивой загрузки)
  const handleNodeUpdate = useCallback((nodeId: string, updatedNode: TreeNode) => {
    console.log(`FileTree: Обновляем узел ${nodeId}`, {
      nodeName: updatedNode.name,
      hasNodes: !!updatedNode.nodes?.length,
      nodesCount: updatedNode.nodes?.length || 0
    })
    
    setTreeData(prevData => {
      const updateNodeRecursive = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          const currentNodeId = `${node.type}-${node.id}`
          if (currentNodeId === nodeId) {
            console.log(`FileTree: Найден узел для обновления ${currentNodeId}`)
            return updatedNode
          }
          if (node.nodes) {
            return {
              ...node,
              nodes: updateNodeRecursive(node.nodes)
            }
          }
          return node
        })
      }
      const result = updateNodeRecursive(prevData)
      catalogTreeState.setTree(stateKey, result)
      return result
    })
  }, [stateKey])

  // Преобразуем CategoryNodeDto в TreeNode, с фильтрацией ТО групп
  const convertCategoryTree = useCallback((categories: CategoryNodeDto[], filterTO: boolean = true): TreeNode[] => {
    let filteredCategories = categories
    
    if (filterTO) {
      // Ищем категорию с названием "Общие сведения" которая содержит ТО
      filteredCategories = categories.filter(category => 
        category.name.includes('Общие сведения') ||
        category.name.includes('ТО') ||
        category.name.includes('Техническое обслуживание')
      )
      
      // Если нашли "Общие сведения", берем только её и развернём юниты как отдельные категории
      const generalCategory = categories.find(cat => cat.name.includes('Общие сведения'))
      
      if (generalCategory && generalCategory.units) {
        console.log('FileTree: Найдена категория "Общие сведения" с юнитами:', {
          category: generalCategory.name,
          unitsCount: generalCategory.units.length,
          units: generalCategory.units.map(u => u.name)
        })
        
        // Создаем отдельные категории для каждого ТО юнита
        const toUnits = generalCategory.units.filter(unit => 
          unit.name.includes('ТО') || unit.name.includes('Комплект для ТО')
        )
        
        if (toUnits.length > 0) {
          // Возвращаем юниты ТО как отдельные категории верхнего уровня
          return toUnits.map(unit => ({
            name: unit.name,
            id: unit.unitId || unit.id,
            type: 'unit' as const,
            data: unit,
            isLoaded: false,
            nodes: [] // Детали будут загружены позже
          }))
        }
      }
      
      console.log('FileTree: Фильтруем категории ТО:', {
        всего: categories.length,
        отфильтровано: filteredCategories.length,
        названия: filteredCategories.map(c => c.name)
      })
    }
    
    return filteredCategories.map(category => ({
      name: category.name,
      id: category.id,
      type: 'category' as const,
      data: category,
      nodes: category.units?.map(unit => ({
        name: unit.name,
        id: unit.unitId || unit.id, // Используем unitId из API
        type: 'unit' as const,
        data: unit,
        isLoaded: false, // Помечаем как неzагруженный для ленивой загрузки
        nodes: [] // Детали будут загружены позже
      })) || []
    }))
  }, [])

  // Преобразуем иерархические Quick Groups в TreeNode
  const convertQuickGroupsToTree = useCallback((quickGroups: QuickGroupDto[]): TreeNode[] => {
    const convertGroup = (group: QuickGroupDto): TreeNode => {
      const treeNode: TreeNode = {
        id: group.id.toString(),
        name: group.name,
        type: 'quickgroup' as const,
        data: group, // Передаем весь объект group, включая id и link
        isLoaded: group.link === true ? false : true, // Если link=true, то нужна ленивая загрузка
        nodes: group.children && group.link === false ? group.children.map(convertGroup) : []
      }
      
      // Логируем все создаваемые узлы
      console.log(`🌳 Converting group: "${group.name}"`, {
        'id': group.id,
        'link': group.link,
        'children.length': group.children?.length || 0,
        'isLoaded': treeNode.isLoaded,
        'nodes.length': treeNode.nodes?.length || 0
      })
      
      return treeNode
    }

    console.log('FileTree: Конвертируем Quick Groups в дерево:', quickGroups.length)
    
    return quickGroups.map(convertGroup)
  }, [])

  // Загружаем дерево категорий
  const loadCategoryTree = useCallback(async () => {
    if (!session?.vehicleId || !session?.ssd || !session?.catalog) {
      console.warn('FileTree: Нет данных для загрузки дерева категорий:', {
        vehicleId: session?.vehicleId,
        ssd: session?.ssd ? 'есть' : 'нет',
        catalog: session?.catalog
      })
      return
    }

    console.log('FileTree: Начинаем загрузку дерева категорий:', {
      catalog: session.catalog,
      vehicleId: session.vehicleId,
      ssd: session.ssd.substring(0, 20) + '...',
      showOnlyTO
    })

    // Дерево уже загружалось для этого авто — берём из sessionStorage без запросов
    const savedTree = catalogTreeState.getTree<TreeNode[]>(stateKey)
    if (savedTree && savedTree.length > 0) {
      setTreeData(savedTree)
      return
    }

    setLoading(true)
    try {
      if (showOnlyTO) {
        // Пытаемся загрузить Quick Groups для ТО
        try {
          const quickGroups = await vehicleApi.getQuickGroups(
            session.catalog, 
            session.vehicleId, 
            session.ssd
          )
          
          console.log('FileTree: Загружено Quick Groups:', quickGroups.length)
          
          if (quickGroups.length > 0) {
            const treeNodes = convertQuickGroupsToTree(quickGroups)
            setTreeData(treeNodes)
            catalogTreeState.setTree(stateKey, treeNodes)
            console.log('FileTree: Установлены Quick Groups узлы:', treeNodes.length, treeNodes.map(s => s.name))
            return
          } else {
            console.log('FileTree: Quick Groups пусты, загружаем обычное дерево')
          }
        } catch (quickGroupError) {
          console.error('FileTree: Ошибка загрузки Quick Groups, используем обычное дерево:', quickGroupError)
        }
      }
      
      // Fallback или обычная загрузка дерева
      const categories = await vehicleApi.getCategoryTree(
        session.catalog, 
        session.vehicleId, 
        session.ssd
      )
      
      console.log('FileTree: Получено категорий:', categories.length)
      const treeNodes = convertCategoryTree(categories, showOnlyTO)
      setTreeData(treeNodes)
      catalogTreeState.setTree(stateKey, treeNodes)
      
    } catch (error) {
      console.error('FileTree: Ошибка загрузки дерева категорий:', error)
    } finally {
      setLoading(false)
    }
  }, [session, convertCategoryTree, convertQuickGroupsToTree, showOnlyTO, stateKey])

  // Загружаем дерево при монтировании компонента или изменении session
  React.useEffect(() => {
    loadCategoryTree()
  }, [loadCategoryTree])

  // Восстанавливаем прокрутку дерева после возврата на страницу
  const hasTree = treeData.length > 0
  React.useEffect(() => {
    if (hasTree && scrollRef.current) {
      scrollRef.current.scrollTop = catalogTreeState.getScrollTop(stateKey)
    }
  }, [hasTree, stateKey])

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">Загрузка дерева категорий...</div>
      </div>
    )
  }

  if (!session?.vehicleId) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          Выберите автомобиль для отображения категорий
        </div>
      </div>
    )
  }

  if (treeData.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-center text-gray-500">
          Категории не найдены
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      onScroll={(e) => catalogTreeState.setScrollTop(stateKey, e.currentTarget.scrollTop)}
      className={`p-4 h-[600px] overflow-y-auto ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg text-gray-900">
          Категории запчастей
        </h3>
        
      </div>
      
      {showOnlyTO && treeData.length === 0 && !loading && (
        <div className="text-center text-amber-600 bg-amber-50 p-3 rounded mb-4">
          Детали ТО не найдены. <br />
          <button 
            onClick={() => setShowOnlyTO(false)}
            className="text-amber-700 underline hover:text-amber-800"
          >
            Показать все категории
          </button>
        </div>
      )}
      
      <ul>
        {treeData.map((node) => (
          <LazyTreeItem 
            node={node} 
            key={`${node.type}-${node.id}-${node.name}`} 
            animated 
            onNodeUpdate={handleNodeUpdate}
            onQuickGroupSelected={onQuickGroupSelected}
            onQuickGroupLoading={onQuickGroupLoading}
            stateKey={stateKey}
          />
        ))}
      </ul>
    </div>
  )
}
