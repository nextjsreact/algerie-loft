"use client"

import { useState, useEffect } from 'react'
import { getOwnersForFilter } from '@/app/actions/availability'

interface Owner {
  value: string
  label: string
}

export function useOwners() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOwners() {
      try {
        setLoading(true)
        const ownersData = await getOwnersForFilter()
        setOwners(ownersData)
        setError(null)
      } catch (err) {
        console.error('Error fetching owners:', err)
        setError('Failed to fetch owners')
      } finally {
        setLoading(false)
      }
    }

    fetchOwners()
  }, [])

  return { owners, loading, error }
}