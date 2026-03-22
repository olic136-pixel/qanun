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
      console.log('[QANUN SSE] Connecting to:', url)

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        console.log('[QANUN SSE] Response:', res.status, res.ok, 'body:', !!res.body)

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => '')
          console.error('[QANUN SSE] Connection failed:', res.status, text)
          setState((s) => ({
            ...s,
            status: 'error',
            error: `Stream connection failed (${res.status})`,
          }))
          return
        }

        setState((s) => ({ ...s, status: 'running' }))
        console.log('[QANUN SSE] Stream connected, reading events...')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let eventType = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log('[QANUN SSE] Stream ended (done)')
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim()
              console.log('[QANUN SSE] Event type:', eventType)
            } else if (line.startsWith('data: ')) {
              const raw = line.slice(6)
              console.log('[QANUN SSE] Data for event:', eventType, '| raw:', raw.slice(0, 200))

              try {
                const data = JSON.parse(raw)

                if (eventType === 'agent_update') {
                  console.log('[QANUN SSE] Agent update:', data.agent_name, 'claims:', data.claims_count)
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
                  console.log('[QANUN SSE] Session complete:', data.claims_total, 'claims')
                  setState((s) => ({
                    ...s,
                    status: 'complete',
                    claimsTotal: data.claims_total ?? data.claims_count ?? s.claimsTotal,
                    compressedDigest: data.compressed_digest ?? data.digest ?? '',
                  }))
                } else if (eventType === 'session_error') {
                  console.error('[QANUN SSE] Session error:', data.error)
                  setState((s) => ({
                    ...s,
                    status: 'error',
                    error: data.error,
                  }))
                } else {
                  // Handle events without explicit event type (plain data-only SSE)
                  console.log('[QANUN SSE] Untyped/unknown event:', eventType || '(none)', data)
                  if (data.agent_name && data.output !== undefined) {
                    // Looks like an agent update
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
                  } else if (data.status === 'complete' || data.compressed_digest) {
                    setState((s) => ({
                      ...s,
                      status: 'complete',
                      claimsTotal: data.claims_total ?? data.claims_count ?? s.claimsTotal,
                      compressedDigest: data.compressed_digest ?? data.digest ?? '',
                    }))
                  }
                }
              } catch (e) {
                console.warn('[QANUN SSE] Parse error:', e, 'raw:', raw.slice(0, 100))
              }
              eventType = ''
            } else if (line.trim() === '') {
              // Empty line = end of event block, reset event type
              eventType = ''
            }
          }
        }

        // Stream ended naturally — if we haven't already set complete, do so
        setState((s) => {
          if (s.status === 'running') {
            console.log('[QANUN SSE] Stream ended naturally, marking complete')
            return { ...s, status: 'complete' }
          }
          return s
        })
      } catch (err) {
        if (controller.signal.aborted) {
          console.log('[QANUN SSE] Aborted (cleanup)')
          return
        }
        console.error('[QANUN SSE] Fetch error:', err)
        setState((s) => ({ ...s, status: 'error', error: String(err) }))
      }
    }

    fetchSSE()
  }, [sessionId, token])

  useEffect(() => {
    if (sessionId && token) {
      console.log('[QANUN SSE] Hook activated — sessionId:', sessionId, 'token:', token?.slice(0, 20) + '...')
      connect()
    } else {
      console.log('[QANUN SSE] Hook idle — sessionId:', sessionId, 'token:', token ? 'present' : 'null')
    }
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [sessionId, token, connect])

  return state
}
