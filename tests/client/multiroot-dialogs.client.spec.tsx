// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { zh as commonZh } from '@deepseek-ai/dsh-client-locale/src/locales/zh.ts'
import type { DirectoryFlowOwnerProps } from '../../src/client/upstream/contract/slots.ts'
import { zh } from '../../src/client/upstream/locales.ts'
import { MultirootDialog } from '../../src/client/multiroot/Dialogs.tsx'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const t = makeTranslate(zh, commonZh) as never

describe('MultirootDialog', () => {
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
    await waitFor(() => { expect(screen.getByText('主根')).toBeTruthy() })
  })
})
