'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export interface AgentUpdate {
  agent_name: string
  output: string
  claims_count: number
}

export interface QueryStreamState {
  status: 'idle' | 'connecting' | 'running' | 'complete' | 'error'
  agentUpdates: Record<string, AgentUpdate>
  agentsComplete: string[]
  claimsTotal: number
  compressedDigest: string
  error: string | null
}

export function useQueryStream(sessionId: string | null, token: string | null) {
  const [state, setState] = useState<QueryStreamState>({
    status: 'idle',
    agentUpdates: {},
    agentsComplete: [],
    claimsTotal: 0,
    compressedDigest: '',
    error: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  const connect = useCallback(() => {
    if (!sessionId || !token) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState((s) => ({ ...s, status: 'connecting' }))

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    const url = `${baseUrl}/api/query/${sessionId}/stream`

    const fetchSSE = async () => {
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          setState((s) => ({
            ...s,
            status: 'error',
            error: 'Stream connection failed',
          }))
          return
        }

        setState((s) => ({ ...s, status: 'running' }))

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          let eventType = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (eventType === 'agent_update') {
                  setState((s) => ({
                    ...s,
                    status: 'running',
                    agentUpdates: {
                      ...s.agentUpdates,
                      [data.agent_name]: data,
                    },
                    agentsComplete: [
                      ...new Set([...s.agentsComplete, data.agent_name]),
                    ],
                    claimsTotal: data.claims_count || s.claimsTotal,
                  }))
                } else if (eventType === 'session_complete') {
                  setState((s) => ({
                    ...s,
                    status: 'complete',
                    claimsTotal: data.claims_total,
                    compressedDigest: data.compressed_digest,
                  }))
                } else if (eventType === 'session_error') {
                  setState((s) => ({
                    ...s,
                    status: 'error',
                    error: data.error,
                  }))
                }
              } catch {
                /* ignore parse errors */
              }
              eventType = ''
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return
        setState((s) => ({ ...s, status: 'error', error: String(err) }))
      }
    }

    fetchSSE()
  }, [sessionId, token])

  useEffect(() => {
    if (sessionId && token) connect()
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [sessionId, token, connect])

  return state
}
