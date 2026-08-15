import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('../../src/client/multiroot/Dialogs.module.css', import.meta.url)), 'utf8')

function declarations(selector: string): Map<string, string> | undefined {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
  for (const [, selectorList = '', body = ''] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectorList.split(',').map(value => value.trim()).includes(selector)) continue
    const found = new Map<string, string>()
    for (const part of body.split(';')) {
      const colon = part.indexOf(':')
      if (colon === -1) continue
      found.set(part.slice(0, colon).trim(), part.slice(colon + 1).trim().replace(/\s+/g, ' '))
    }
    return found
  }
  return undefined
}

describe('MultirootDialog layout CSS', () => {
  it('caps the dialog and scrolls only the complete root fields', () => {
    expect(declarations('.dialog')?.get('width')).toBe('min(760px, 100%)')
    expect(declarations('.dialog')?.get('max-height')).toBe('calc(100dvh - 48px)')
    expect(declarations('.rootScroller')?.get('overflow-y')).toBe('auto')
    expect(declarations('.rootScroller')?.get('overscroll-behavior')).toBe('contain')
    expect(declarations('.rootScroller')?.get('scrollbar-gutter')).toBe('stable')
    expect(declarations('.rootPath')?.get('overflow-wrap')).toBe('anywhere')
    expect(declarations('.rootPath')?.get('text-overflow')).toBeUndefined()
  })
})
