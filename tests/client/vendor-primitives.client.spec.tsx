// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Menu } from '../../src/client/vendor/primitives/index.ts'

afterEach(cleanup)

describe('vendored client primitives', () => {
  it('renders danger menu entries and selects them by id', () => {
    const onSelect = vi.fn()
    render(
      <Menu
        open
        anchor={<button type="button">Actions</button>}
        items={[
          { id: 'rename', label: 'Rename' },
          { id: 'delete', label: 'Delete', danger: true },
        ]}
        onSelect={onSelect}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('menu').className).not.toBe('')
    expect(screen.getByRole('menuitem', { name: 'Delete' }).className).toMatch(/danger/)
    expect(screen.getByRole('menuitem', { name: 'Rename' }).className).not.toMatch(/danger/)

    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith('delete')
  })
})
