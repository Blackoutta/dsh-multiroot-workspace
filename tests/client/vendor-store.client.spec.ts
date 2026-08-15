import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineStore } from '../../src/client/vendor/store.ts'

const counterStore = () => defineStore({
  init: () => ({ count: 0 }),
  persist: 'test.counter',
  actions: {
    increment: (draft, amount: number) => { draft.count += amount },
  },
})

afterEach(() => { vi.unstubAllGlobals() })

describe('defineStore', () => {
  it('bakes actions that replace the snapshot after draft mutation', () => {
    vi.stubGlobal('localStorage', undefined)
    const store = counterStore().create()
    const before = store.getSnapshot()

    store.actions.increment(2)

    expect(store.getSnapshot()).toEqual({ count: 2 })
    expect(store.getSnapshot()).not.toBe(before)
    expect(before).toEqual({ count: 0 })
  })

  it('notifies a snapshot of subscribers synchronously after the action completes', () => {
    vi.stubGlobal('localStorage', undefined)
    const store = counterStore().create()
    const calls: string[] = []
    let unsubscribeSecond = () => {}
    store.subscribe(() => {
      calls.push(`first:${store.getSnapshot().count}`)
      unsubscribeSecond()
    })
    unsubscribeSecond = store.subscribe(() => { calls.push(`second:${store.getSnapshot().count}`) })

    store.actions.increment(1)
    calls.push('after')

    expect(calls).toEqual(['first:1', 'second:1', 'after'])
  })

  it('reloads valid persisted JSON', () => {
    const backing = new Map([['test.counter', JSON.stringify({ count: 4 })]])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => { backing.set(key, value) },
      removeItem: (key: string) => { backing.delete(key) },
    })

    expect(counterStore().create().getSnapshot()).toEqual({ count: 4 })
  })

  it('falls back to initial state when persisted JSON is malformed', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => '{broken',
      setItem: () => {},
      removeItem: () => {},
    })

    expect(counterStore().create().getSnapshot()).toEqual({ count: 0 })
  })

  it('suffixes persistence with the scope key', () => {
    const backing = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => { backing.set(key, value) },
      removeItem: (key: string) => { backing.delete(key) },
    })

    counterStore().create('session-a').actions.increment(3)

    expect(JSON.parse(backing.get('test.counter.session-a')!)).toEqual({ count: 3 })
    expect(backing.has('test.counter')).toBe(false)
  })

  it('tolerates storage read, write, and remove failures', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('read failed') },
      setItem: () => { throw new Error('write failed') },
      removeItem: () => { throw new Error('remove failed') },
    })

    const store = counterStore().create()
    expect(() => { store.actions.increment(1) }).not.toThrow()
    expect(store.getSnapshot()).toEqual({ count: 1 })
    expect(() => { store.clearPersisted() }).not.toThrow()
  })

  it('removes only its scoped persisted value', () => {
    const backing = new Map([
      ['test.counter.session-a', JSON.stringify({ count: 1 })],
      ['test.counter.session-b', JSON.stringify({ count: 2 })],
    ])
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => { backing.set(key, value) },
      removeItem: (key: string) => { backing.delete(key) },
    })

    counterStore().create('session-a').clearPersisted()

    expect(backing.has('test.counter.session-a')).toBe(false)
    expect(backing.has('test.counter.session-b')).toBe(true)
  })
})
