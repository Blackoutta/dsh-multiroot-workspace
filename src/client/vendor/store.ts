import type {
  ActionsDecl, BakedActions, StoreHandle, StoreInstance, StoreSpec,
} from '@deepseek-ai/dsh-client-ui-slots'

export type { StoreSpec } from '@deepseek-ai/dsh-client-ui-slots'

/** Live observable store instance consumed structurally by DSH slots. */
export interface EngineStoreInstance<T, A extends ActionsDecl<T>> extends StoreInstance<T, A> {}

/** Store declaration handle consumed structurally by DSH slots. */
export interface EngineStoreHandle<T, A extends ActionsDecl<T>> extends StoreHandle<T, A> {
  create(scopeKey?: string): EngineStoreInstance<T, A>
}

function browserStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage
  } catch {
    return undefined
  }
}

/** Define a small copy-on-write store with optional localStorage persistence. */
export function defineStore<T, A extends ActionsDecl<T>>(
  spec: StoreSpec<T, A> & { actions: A & ActionsDecl<T> },
): EngineStoreHandle<T, A> {
  return {
    spec,
    create(scopeKey?: string): EngineStoreInstance<T, A> {
      const persistKey = spec.persist === undefined
        ? undefined
        : scopeKey === undefined ? spec.persist : `${spec.persist}.${scopeKey}`
      const storage = browserStorage()
      let state = spec.init()
      if (storage !== undefined && persistKey !== undefined) {
        try {
          const persisted = storage.getItem(persistKey)
          if (persisted !== null) state = JSON.parse(persisted) as T
        } catch {
          // Invalid data and unavailable storage both fall back to fresh state.
        }
      }

      const subscribers = new Set<() => void>()
      const actions = {} as Record<string, (...params: unknown[]) => void>
      for (const key of Object.keys(spec.actions)) {
        const mutate = spec.actions[key] as (draft: T, ...params: unknown[]) => void
        actions[key] = (...params: unknown[]) => {
          const draft = structuredClone(state)
          mutate(draft, ...params)
          state = draft
          if (storage !== undefined && persistKey !== undefined) {
            try {
              storage.setItem(persistKey, JSON.stringify(state))
            } catch {
              // Persistence failure must not break the live store.
            }
          }
          for (const subscriber of [...subscribers]) subscriber()
        }
      }

      return {
        actions: actions as BakedActions<T, A>,
        getSnapshot: () => state,
        subscribe: (fn) => {
          subscribers.add(fn)
          return () => { subscribers.delete(fn) }
        },
        clearPersisted: () => {
          if (storage === undefined || persistKey === undefined) return
          try {
            storage.removeItem(persistKey)
          } catch {
            // Cleanup has the same non-fatal storage boundary as persistence.
          }
        },
      }
    },
  }
}
