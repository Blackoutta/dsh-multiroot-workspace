// @vitest-environment jsdom
import { expect, it } from 'vitest'
import { readWindowWidth } from '../fixtures/@deepseek-ai/dsh-client-window/lib/client.js'

it('preserves the real browser window in exported DSH bundle closures', () => {
  expect(readWindowWidth()).toBe(window.innerWidth)
})
