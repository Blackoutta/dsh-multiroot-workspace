// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { WorkspaceId } from '@deepseek-ai/dsh-client-runtime/client'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import { ProjectRowItem } from '../../src/client/upstream/rows/Rows.tsx'
import type { GroupNode } from '../../src/client/upstream/tree.ts'
import { zh } from '../../src/client/upstream/locales.ts'
import type { MultirootMetadata } from '../../src/client/multiroot/types.ts'

afterEach(cleanup)

const t = makeTranslate(zh, commonZh) as never

describe('multiroot Workspace presentation', () => {
  it('decorates only the stock project row and exposes management in its menu', () => {
    const manage = vi.fn()
    const group: GroupNode = {
      key: 'shadow-1',
      workspaceId: 'shadow-1' as WorkspaceId,
      cwd: '/repo/app',
      createdAt: 0,
      label: 'product',
      sessionCount: 1,
      expanded: true,
      containsCurrent: false,
      sessions: [],
    }
    const metadata: MultirootMetadata = {
      logical: {
        id: 'logical-1',
        title: 'product',
        roots: [
          { alias: 'app', path: '/repo/app', primary: true },
          { alias: 'docs', path: '/repo/docs', primary: false },
        ],
        shadowWorkspaceId: 'shadow-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      rootCount: 2,
      primaryAlias: 'app',
    }

    render(<ProjectRowItem
      group={group}
      onToggle={vi.fn()}
      onCreate={vi.fn()}
      actions={{ rename: vi.fn(), delete: vi.fn(), manage }}
      multiroot={metadata}
      t={t}
    />)

    expect(screen.getByText('2 个根 · 主根 app')).toBeTruthy()
    expect(document.body.textContent).not.toContain('🗂')
    fireEvent.click(screen.getByRole('button', { name: '工作区“product”的操作' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '管理多根工作区' }))
    expect(manage).toHaveBeenCalledOnce()
  })
})
