import { useCallback, useEffect, useState } from 'react'
import type {
  CreateMultirootWorkspace,
  MultirootWorkspaceRecord,
  UpdateMultirootWorkspace,
} from './types.ts'

const API_PREFIX = '/plugins/multiroot/api'

interface SuccessEnvelope<T> {
  ok: true
  value: T
}

interface ErrorEnvelope {
  ok: false
  error?: { message?: string }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEnvelope(value: unknown): value is SuccessEnvelope<unknown> | ErrorEnvelope {
  return isRecord(value) && typeof value.ok === 'boolean'
}

function errorMessage(payload: unknown, status: number): string {
  if (isEnvelope(payload) && payload.ok === false && isRecord(payload.error)
    && typeof payload.error.message === 'string') {
    return payload.error.message
  }
  return `multiroot request failed: ${status}`
}

/** Send one same-origin request to the multiroot Host API. */
export async function multirootRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, init)
  const payload: unknown = await response.json()
  if (!isEnvelope(payload) || payload.ok !== true) {
    throw new Error(errorMessage(payload, response.status))
  }
  return payload.value as T
}

function jsonRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  return multirootRequest<T>(path, {
    method,
    headers: { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

/** Typed mutations used by the multiroot dialogs. */
export const multirootApi = {
  list: (): Promise<MultirootWorkspaceRecord[]> => multirootRequest('/workspaces'),
  create: (input: CreateMultirootWorkspace): Promise<MultirootWorkspaceRecord> =>
    jsonRequest('/workspaces', 'POST', input),
  update: (id: string, input: UpdateMultirootWorkspace): Promise<MultirootWorkspaceRecord> =>
    jsonRequest(`/workspaces/${encodeURIComponent(id)}`, 'PATCH', input),
  setPrimary: (id: string, alias: string): Promise<MultirootWorkspaceRecord> =>
    jsonRequest(`/workspaces/${encodeURIComponent(id)}/primary`, 'PUT', { alias }),
  delete: (id: string): Promise<true> =>
    jsonRequest(`/workspaces/${encodeURIComponent(id)}`, 'DELETE'),
}

export interface MultirootQuery {
  phase: 'loading' | 'ready' | 'error'
  records: readonly MultirootWorkspaceRecord[]
  error: string | null
  refresh: () => Promise<void>
}

/** Load logical Workspace records while retaining the last ready snapshot after a failed refresh. */
export function useMultirootRecords(enabled = true): MultirootQuery {
  const [state, setState] = useState<Omit<MultirootQuery, 'refresh'>>({
    phase: enabled ? 'loading' : 'ready',
    records: [],
    error: null,
  })
  const refresh = useCallback(async () => {
    if (!enabled) return
    try {
      const records = await multirootApi.list()
      setState({ phase: 'ready', records, error: null })
    } catch (cause) {
      setState(previous => ({
        phase: 'error',
        records: previous.records,
        error: cause instanceof Error ? cause.message : String(cause),
      }))
      throw cause
    }
  }, [enabled])
  useEffect(() => { void refresh().catch(() => {}) }, [refresh])
  return { ...state, refresh }
}
