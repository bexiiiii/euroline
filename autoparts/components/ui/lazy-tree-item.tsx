"use client"

import { useState, useCallback } from "react"
import { ChevronRight, Folder, File, Loader2 } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useVehicle } from "@/context/VehicleContext"
import { vehicleApi, DetailDto } from "@/lib/api/vehicle"
import { apiCache } from "@/lib/cache"
import { catalogTreeState } from "@/lib/catalogTreeState"

type TreeNode = {
  name: string
  nodes?: TreeNode[]
  id?: number | string
  type?: 'category' | 'unit' | 'detail' | 'quickgroup' | 'system'
  data?: any
  isLoaded?: boolean
}

interface LazyTreeItemProps {
  node: TreeNode
  animated?: boolean
  onNodeUpdate?: (nodeId: string, updatedNode: TreeNode) => void
  onQuickGroupSelected?: (groupId: number, groupName: string, details: DetailDto[]) => void
  onQuickGroupLoading?: (groupId: number, groupName: string) => void
  stateKey?: string | null
}

export function LazyTreeItem({
  node,
  animated = false,
  onNodeUpdate,
  onQuickGroupSelected,
  onQuickGroupLoading,
  stateKey = null,
}: LazyTreeItemProps) {
  const nodeKey = `${node.type}-${node.id}`
  // Раскрытие ветки переживает уход со страницы и «Назад»
  const [isOpen, setIsOpen] = useState(() => catalogTreeState.isOpen(stateKey, nodeKey))
  const [isLoading, setIsLoading] = useState(false)
  const { session } = useVehicle()

  // Отладка каждого узла при рендере
  console.log(`🎯 Rendering LazyTreeItem: "${node.name}" (${node.type})`, {
    id: node.id,
    link: node.data?.link,
    isLoaded: node.isLoaded,
    hasNodes: node.nodes?.length || 0
  })

  // Загружаем детали для узла
  const loadUnitDetails = useCallback(async (unitId: number) => {
    if (!session?.catalog || !session?.ssd) {
      console.warn('Нет данных сессии для загрузки деталей')
      return []
    }

    // Создаем ключ кеша
    const cacheKey = `unit-details-${session.catalog}-${unitId}-${session.ssd}`
    
    // Проверяем кеш
    const cachedDetails = apiCache.get(cacheKey)
    if (cachedDetails) {
      console.log('Детали узла', unitId, 'загружены из кеша')
      return cachedDetails
    }

    try {
      console.log('Загружаем детали для узла:', unitId)
      const details = await vehicleApi.getUnitDetails(session.catalog, unitId, session.ssd)
      
      const treeNodes = details.map(detail => ({
        name: detail.name,
        id: detail.id,
        type: 'detail' as const,
        data: detail,
        isLoaded: true
      }))

      // Сохраняем в кеш на 5 минут
      apiCache.set(cacheKey, treeNodes, 5 * 60 * 1000)
      
      return treeNodes
    } catch (error) {
      console.error('Ошибка загрузки деталей для узла', unitId, ':', error)
      return []
    }
  }, [session])

  // Детали группы: сначала sessionStorage, потом API (лимит запросов Laximo)
  const fetchGroupDetails = useCallback(async (groupId: number): Promise<DetailDto[]> => {
    const cached = catalogTreeState.getGroupDetails(stateKey, groupId)
    if (cached) return cached
    const details = await vehicleApi.getQuickDetails(
      session!.catalog,
      session!.vehicleId,
      session!.ssd,
      groupId
    )
    catalogTreeState.setGroupDetails(stateKey, groupId, details)
    return details
  }, [session, stateKey])

  // Загружаем детали QuickGroup (для узлов с link=true)
  const loadQuickGroupDetails = useCallback(async (groupId: number) => {
    if (!session?.catalog || !session?.ssd || !session?.vehicleId) {
      console.warn('Нет данных сессии для загрузки QuickGroup деталей')
      return []
    }

    // Создаем ключ кеша
    const cacheKey = `quickgroup-details-${session.catalog}-${groupId}-${session.vehicleId}-${session.ssd}`
    
    // Проверяем кеш
    const cachedDetails = apiCache.get(cacheKey)
    if (cachedDetails) {
      console.log('QuickGroup детали', groupId, 'загружены из кеша')
      return cachedDetails
    }

    try {
      console.log('Загружаем QuickGroup детали для группы:', groupId)
      const details = await vehicleApi.getQuickDetails(
        session.catalog, 
        session.vehicleId, 
        session.ssd, 
        groupId
      )
      
      const treeNodes = details.map(detail => ({
        name: `${detail.oem || 'N/A'} - ${detail.name}`,
        id: detail.id || `detail-${Math.random()}`,
        type: 'detail' as const,
        data: detail,
        isLoaded: true
      }))

      // Сохраняем в кеш на 5 минут
      apiCache.set(cacheKey, treeNodes, 5 * 60 * 1000)
      
      return treeNodes
    } catch (error) {
      console.error('Ошибка загрузки QuickGroup деталей для группы', groupId, ':', error)
      return []
    }
  }, [session])

  // Обработчик раскрытия узла с ленивой загрузкой
  const handleToggle = useCallback(async () => {
    console.log(`🚀 HANDLE TOGGLE CALLED for ${node.type}-${node.id} "${node.name}"`, {
      isOpen,
      isLoaded: node.isLoaded,
      hasChildren: !!node.nodes?.length,
      nodeData: node.data
    })

    // Специальная обработка для QuickGroup с link=true - только загружаем данные, не меняем состояние раскрытия
    if (node.type === 'quickgroup' && node.data?.link === true && node.data?.id) {
      const groupId = node.data.id
      if (groupId != null && groupId > 0 && !node.isLoaded) {
        console.log(`LazyTreeItem: Загружаем детали для QuickGroup ${groupId}`)
        setIsLoading(true)
        
        // Уведомляем о начале загрузки
        if (onQuickGroupLoading) {
          onQuickGroupLoading(groupId, node.name)
        }
        
        try {
          // Получаем детали из API и передаем их напрямую
          const apiDetails = await fetchGroupDetails(groupId)
          
          // Уведомляем о завершении загрузки с данными
          if (onQuickGroupSelected) {
            onQuickGroupSelected(groupId, node.name, apiDetails)
          }
          
          // Для QuickGroup НЕ обновляем дерево деталями - они отображаются только в правой части
          const updatedNode: TreeNode = {
            ...node,
            isLoaded: true,
            // НЕ добавляем nodes: details - детали показываются только в CatalogCardComponent
          }
          
          console.log('LazyTreeItem: Обновляем QuickGroup узел без деталей в дереве')
          
          // Уведомляем родительский компонент об обновлении
          if (onNodeUpdate) {
            onNodeUpdate(`${node.type}-${node.id}`, updatedNode)
          }
        } catch (error) {
          console.error(`LazyTreeItem: Ошибка загрузки деталей для QuickGroup ${groupId}:`, error)
        } finally {
          setIsLoading(false)
        }
      } else if (node.isLoaded) {
        // Если уже загружен, просто показываем данные снова
        console.log(`LazyTreeItem: QuickGroup ${groupId} уже загружен, показываем данные повторно`)
        if (onQuickGroupSelected && session) {
          try {
            const apiDetails = await fetchGroupDetails(groupId)
            onQuickGroupSelected(groupId, node.name, apiDetails)
          } catch (error) {
            console.error(`LazyTreeItem: Ошибка повторной загрузки деталей для QuickGroup ${groupId}:`, error)
          }
        }
      }
      
      // Для QuickGroup с link=true НЕ изменяем состояние isOpen - выходим из функции
      return
    }

    // Обычная логика для других типов узлов
    if (!isOpen) {
      // Раскрываем узел
      if (node.type === 'unit' && !node.isLoaded && node.id && typeof node.id === 'number') {
        console.log(`LazyTreeItem: Загружаем детали для узла ${node.id}`)
        setIsLoading(true)
        try {
          const details = await loadUnitDetails(node.id)
          console.log(`LazyTreeItem: Получено ${details.length} деталей для узла ${node.id}`)
          
          // Обновляем узел с загруженными деталями
          const updatedNode: TreeNode = {
            ...node,
            nodes: details,
            isLoaded: true
          }
          
          console.log('LazyTreeItem: Обновляем узел через onNodeUpdate')
          
          // Уведомляем родительский компонент об обновлении
          if (onNodeUpdate) {
            onNodeUpdate(`${node.type}-${node.id}`, updatedNode)
          }
        } catch (error) {
          console.error(`LazyTreeItem: Ошибка загрузки деталей для узла ${node.id}:`, error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    // Раскрываем/сворачиваем узел только если у него есть реальные дочерние элементы
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    catalogTreeState.setOpen(stateKey, nodeKey, nextOpen)
  }, [isOpen, node, nodeKey, stateKey, loadUnitDetails, fetchGroupDetails, onNodeUpdate, onQuickGroupSelected, onQuickGroupLoading, session])

  // Определяем, есть ли дочерние элементы
  const hasChildren = node.nodes && node.nodes.length > 0
  const canExpandQuickGroup = node.type === 'quickgroup' && node.data?.link === true && node.data?.id && node.data.id > 0 && !node.isLoaded
  // Для узлов QuickGroup с link=true НЕ показываем стрелочку раскрытия - они просто кликабельные
  const canExpand = hasChildren || 
                   (node.type === 'unit' && !node.isLoaded)
                   // Убираем canExpandQuickGroup - для link=true узлов нет стрелочки

  // Отладка для узлов с link=true
  if (node.type === 'quickgroup' && node.data?.link === true) {
    console.log(`🔗 QuickGroup with link=true: "${node.name}"`, {
      'data.id': node.data?.id,
      'data.link': node.data?.link,
      'isLoaded': node.isLoaded,
      'canExpandQuickGroup': canExpandQuickGroup,
      'canExpand': canExpand,
      'hasChildren': hasChildren
    })
  }

  // Общий контент для обоих вариантов
  const ChevronIcon = () => {
    if (isLoading) {
      return <Loader2 className="size-4 text-gray-500 animate-spin" />
    }

    return animated ? (
      <motion.span
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="flex"
      >
        <ChevronRight className="size-4 text-gray-500" />
      </motion.span>
    ) : (
      <ChevronRight
        className={`size-4 text-gray-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
      />
    )
  }

  const ChildrenList = () => {
    if (!hasChildren || !isOpen) return null

    const children = node.nodes?.map((childNode) => (
      <LazyTreeItem 
        node={childNode} 
        key={`${childNode.type}-${childNode.id}-${childNode.name}`} 
        animated={animated}
        onNodeUpdate={onNodeUpdate}
        onQuickGroupSelected={onQuickGroupSelected}
        onQuickGroupLoading={onQuickGroupLoading}
        stateKey={stateKey}
      />
    ))

    if (animated) {
      return (
        <AnimatePresence>
          <motion.ul
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="pl-6 overflow-hidden flex flex-col justify-end"
          >
            {children}
          </motion.ul>
        </AnimatePresence>
      )
    }

    return <ul className="pl-6">{children}</ul>
  }

  return (
    <li key={`${node.type}-${node.id}-${node.name}`}>
      <div className="flex items-center gap-1.5 py-1">
        {canExpand && (
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log(`🔘 BUTTON CLICKED for ${node.type}-${node.id} "${node.name}"`)
              handleToggle()
            }}
            className="p-1 -m-1 hover:bg-gray-100 rounded flex-shrink-0"
            disabled={isLoading}
            type="button"
          >
            <ChevronIcon />
          </button>
        )}

        {node.type === 'detail' ? (
          <File className="ml-[22px] size-6 text-gray-900 flex-shrink-0" />
        ) : (
          <Folder
            className={`size-6 text-orange-600 fill-orange-600 flex-shrink-0 ${
              !canExpand ? "ml-[22px]" : ""
            }`}
          />
        )}
        
        {/* Для QuickGroup с link=true делаем текст всегда кликабельным */}
        {node.type === 'quickgroup' && node.data?.link === true ? (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log(`🔗 TEXT CLICKED for ${node.type}-${node.id} "${node.name}"`)
              handleToggle()
            }}
            className="text-left hover:text-blue-600 hover:underline cursor-pointer text-gray-900 flex-1"
            disabled={isLoading}
            type="button"
          >
            {node.name}
          </button>
        ) : (
          <span className="select-none">{node.name}</span>
        )}
      </div>

      <ChildrenList />
    </li>
  )
}
