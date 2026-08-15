// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { commonZh } from './common-locale.ts'
import type { DirectoryFlowOwnerProps } from '../../src/client/upstream/contract/slots.ts'
import { zh } from '../../src/client/upstream/locales.ts'
import { MultirootDialog } from '../../src/client/multiroot/Dialogs.tsx'
import type { MultirootWorkspaceRecord } from '../../src/client/multiroot/types.ts'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const t = makeTranslate(zh, commonZh) as never

describe('MultirootDialog', () => {
  it('shows complete root fields inside a named list', () => {
    const paths = [
      '/Users/yang/Desktop/projects/deepseek-harness',
      '/Users/yang/Desktop/projects/dify-log-consumer',
      '/Users/yang/Desktop/projects/dify-sandbox',
      '/Users/yang/Desktop/projects/deepseek-harness/website',
      '/Users/yang/Desktop/projects/deepseek-harness/tests/integration/fixtures/multiroot-workspace',
    ]
    const record: MultirootWorkspaceRecord = {
      id: 'logical-1',
      title: 'product',
      roots: paths.map((path, index) => ({
        alias: ['deepseek-harness', 'dify-log-consumer', 'dify-sandbox', 'website', 'integration-fixtures'][index]!,
        path,
        primary: index === 0,
      })),
      shadowWorkspaceId: 'shadow-1',
      createdAt: '2026-08-15T00:00:00.000Z',
      updatedAt: '2026-08-15T00:00:00.000Z',
    }

    render(<MultirootDialog
      open
      record={record}
      onClose={vi.fn()}
      refresh={vi.fn(async () => undefined)}
      renderDirectoryFlow={() => null}
      t={t}
    />)

    expect(screen.getByRole('region', { name: '根目录' })).toBeTruthy()
    for (const path of paths) expect(screen.getByText(path)).toBeTruthy()
    expect(screen.getByText('当前主根')).toBeTruthy()
    expect(screen.getByRole('button', { name: '设“dify-log-consumer”为主根' })).toBeTruthy()
  })

  it('derives the initial name and preserves the draft when creation fails', async () => {
    let flow: DirectoryFlowOwnerProps | undefined
    vi.stubGlobal('fetch', vi.fn(async () => ({
      status: 400,
      json: async () => ({ ok: false, error: { message: 'primary root is already owned' } }),
    })))
    render(<MultirootDialog
      open
      record={null}
      onClose={vi.fn()}
      refresh={vi.fn(async () => undefined)}
      renderDirectoryFlow={(owner) => { flow = owner; return null }}
      t={t}
    />)

    fireEvent.click(screen.getByRole('button', { name: '添加文件夹…' }))
    await act(async () => { flow?.onPicked('/repo/app') })
    expect(screen.getByLabelText('工作区名称')).toHaveProperty('value', 'app')
    fireEvent.click(screen.getByRole('button', { name: '添加文件夹…' }))
    await act(async () => { flow?.onPicked('/repo/docs') })
    fireEvent.click(screen.getByRole('button', { name: '设“docs”为主根' }))
    fireEvent.click(screen.getByRole('button', { name: '创建' }))

    expect(await screen.findByText('primary root is already owned')).toBeTruthy()
    expect(screen.getByLabelText('工作区名称')).toHaveProperty('value', 'app')
    await waitFor(() => { expect(screen.getByText('当前主根')).toBeTruthy() })
  })
})
