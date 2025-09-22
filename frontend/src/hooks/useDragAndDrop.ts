import { useState, useCallback } from 'react'

export interface DragItem {
  id: string
  type: 'file' | 'folder'
  data: any
}

export interface DropZone {
  id: string
  type: 'folder' | 'root'
  accepts: ('file' | 'folder')[]
}

export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [dropZones, setDropZones] = useState<Map<string, DropZone>>(new Map())

  const startDrag = useCallback((item: DragItem) => {
    setDraggedItem(item)
  }, [])

  const endDrag = useCallback(() => {
    setDraggedItem(null)
  }, [])

  const registerDropZone = useCallback((zone: DropZone) => {
    setDropZones(prev => new Map(prev).set(zone.id, zone))
  }, [])

  const unregisterDropZone = useCallback((zoneId: string) => {
    setDropZones(prev => {
      const newMap = new Map(prev)
      newMap.delete(zoneId)
      return newMap
    })
  }, [])

  const canDrop = useCallback((zoneId: string): boolean => {
    if (!draggedItem) return false

    const zone = dropZones.get(zoneId)
    if (!zone) return false

    return zone.accepts.includes(draggedItem.type)
  }, [draggedItem, dropZones])

  return {
    draggedItem,
    startDrag,
    endDrag,
    registerDropZone,
    unregisterDropZone,
    canDrop,
    isDragging: !!draggedItem
  }
}

// Custom hooks for drag and drop event handlers
export const useDraggable = (
  item: DragItem,
  onDragStart?: () => void,
  onDragEnd?: () => void
) => {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('application/json', JSON.stringify(item))
      e.dataTransfer.effectAllowed = 'move'
      onDragStart?.()
    },
    onDragEnd: (e: React.DragEvent) => {
      onDragEnd?.()
    }
  }
}

export const useDroppable = (
  zoneId: string,
  accepts: ('file' | 'folder')[],
  onDrop?: (item: DragItem) => void,
  onDragOver?: () => void,
  onDragLeave?: () => void
) => {
  const [isDragOver, setIsDragOver] = useState(false)

  return {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (!isDragOver) {
        setIsDragOver(true)
        onDragOver?.()
      }
    },
    onDragLeave: (e: React.DragEvent) => {
      // Only trigger drag leave if we're actually leaving this element
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        setIsDragOver(false)
        onDragLeave?.()
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      try {
        const itemData = e.dataTransfer.getData('application/json')
        const item: DragItem = JSON.parse(itemData)

        if (accepts.includes(item.type)) {
          onDrop?.(item)
        }
      } catch (error) {
        console.error('Error parsing drop data:', error)
      }
    },
    isDragOver
  }
}