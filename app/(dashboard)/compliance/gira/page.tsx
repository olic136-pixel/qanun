'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEntity } from '@/lib/entity-context'

export default function GiraIndexPage() {
  const router = useRouter()
  const { selectedEntity, entities } = useEntity()

  useEffect(() => {
    const entity = selectedEntity ?? entities[0]
    if (entity?.id) {
      router.replace(`/compliance/gira/${entity.id}`)
    }
  }, [selectedEntity, entities, router])

  return (
    <div className="py-16 text-center text-sm text-gray-500">
      Loading application form…
    </div>
  )
}
