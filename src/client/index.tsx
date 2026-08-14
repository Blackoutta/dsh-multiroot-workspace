/**
 * dsh-multiroot-workspace — client half (TSX build via tsdown).
 *
 * Occupies the two slots the disabled ui-workspace used to fill:
 *   sidebar.workspaces            — the whole workspace browsing region
 *   conversation.hero.workspace   — the conversation empty-state picker
 *
 * Standard (single-root registry) workspaces come from the framework
 * `useWorkspaces`/`useSessions` hooks; multiroot workspaces come from the
 * bundle's own HTTP API. Derived shadow entries (registry workspaces whose
 * path equals a multiroot primary) are filtered out of the standard list so
 * nothing renders twice.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Context } from '@deepseek-ai/cordis'

// ===== styles (one injected stylesheet; class names mirror the components) =====
const CSS = `
.mr-root { display: flex; flex-direction: column; height: 100%; font-size: 13px; color: var(--dsw-text-1, #1a1a1a); }
.mr-header { display: flex; align-items: center; gap: 6px; padding: 6px 8px; }
.mr-title { font-weight: 600; flex: 1; }
.mr-search { border: 1px solid var(--dsw-border, #e0e0e0); border-radius: 4px; padding: 2px 6px; font-size: 12px; width: 90px; background: transparent; color: inherit; }
.mr-btn { background: transparent; border: 1px solid var(--dsw-border, #e0e0e0); color: inherit; border-radius: 4px; font-size: 12px; padding: 2px 8px; cursor: pointer; }
.mr-btn:disabled { opacity: .5; cursor: default; }
.mr-btn-primary { background: var(--dsw-accent, #4d6bfe); border-color: var(--dsw-accent, #4d6bfe); color: #fff; }
.mr-btn-danger { color: #d33; border-color: #d33; }
.mr-iconbtn { background: transparent; border: none; color: var(--dsw-text-2, #666); cursor: pointer; font-size: 12px; padding: 0 3px; }
.mr-iconbtn-danger { color: #d33; }
.mr-group { margin-bottom: 2px; }
.mr-group-head { display: flex; align-items: center; gap: 4px; padding: 4px 6px; cursor: pointer; border-radius: 4px; }
.mr-group-head.dragover { outline: 1px dashed var(--dsw-accent, #4d6bfe); }
.mr-caret { font-size: 11px; color: var(--dsw-text-2, #666); width: 12px; }
.mr-group-title { font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mr-group-meta { font-size: 11px; color: var(--dsw-text-2, #666); }
.mr-session { display: flex; align-items: center; gap: 6px; padding: 3px 6px 3px 20px; cursor: pointer; border-radius: 4px; }
.mr-session:hover, .mr-group-head:hover { background: var(--dsw-hover, rgba(0,0,0,.05)); }
.mr-session-title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mr-session-time { font-size: 11px; color: var(--dsw-text-2, #666); }
.mr-running { font-size: 10px; color: var(--dsw-accent, #4d6bfe); }
.mr-error { font-size: 12px; color: #d33; padding: 0 8px; }
.mr-empty { font-size: 12px; color: var(--dsw-text-2, #666); padding: 6px 8px; }
.mr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 100; }
.mr-modal { background: var(--dsw-bg, #fff); border-radius: 8px; padding: 16px; min-width: 420px; max-width: 560px; max-height: 80vh; overflow: auto; box-shadow: 0 8px 32px rgba(0,0,0,.2); }
.mr-modal-title { font-weight: 600; font-size: 14px; margin-bottom: 12px; }
.mr-modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.mr-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.mr-label { font-size: 13px; color: var(--dsw-text-2, #666); white-space: nowrap; }
.mr-input { flex: 1; border: 1px solid var(--dsw-border, #e0e0e0); border-radius: 4px; padding: 4px 8px; font-size: 13px; background: transparent; color: inherit; }
.mr-input-wide { width: 120px; flex: none; }
.mr-root-row { display: flex; align-items: center; gap: 8px; border: 1px solid var(--dsw-border, #e0e0e0); border-radius: 4px; padding: 6px; margin-bottom: 6px; }
.mr-root-alias { font-weight: 600; font-size: 12px; width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mr-root-path { flex: 1; font-size: 12px; color: var(--dsw-text-2, #666); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mr-primary-mark { font-size: 11px; color: var(--dsw-accent, #4d6bfe); font-weight: 600; }
.mr-hint { font-size: 12px; color: var(--dsw-text-2, #666); }
.mr-menu { position: fixed; z-index: 90; min-width: 240px; max-width: 320px; background: var(--dsw-bg, #fff); border: 1px solid var(--dsw-border, #e0e0e0); border-radius: 8px; padding: 6px; box-shadow: 0 8px 32px rgba(0,0,0,.18); }
.mr-menu-head { font-size: 11px; color: var(--dsw-text-2, #666); padding: 2px 6px 4px; }
.mr-menu-item { display: flex; align-items: center; gap: 6px; padding: 3px 6px; cursor: pointer; border-radius: 4px; }
.mr-menu-item:hover { background: var(--dsw-hover, rgba(0,0,0,.05)); }
.mr-menu-item-selected { background: rgba(77,107,254,.1); }
.mr-divider { height: 1px; background: var(--dsw-border, #e0e0e0); margin: 4px 0; }
.mr-rail { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 0; }
.mr-rail-btn { background: transparent; border: none; color: var(--dsw-text-2, #666); cursor: pointer; font-size: 15px; padding: 4px; border-radius: 4px; }
.mr-rail-btn:hover { background: var(--dsw-hover, rgba(0,0,0,.05)); color: var(--dsw-accent, #4d6bfe); }
`

let styleInjected = false
function ensureStyle(): void {
  if (styleInjected || typeof document === 'undefined') return
  const tag = document.createElement('style')
  tag.setAttribute('data-plugin', 'dsh-multiroot-workspace')
  tag.textContent = CSS
  document.head.append(tag)
  styleInjected = true
}

// ===== API client =====
const API = '/plugins/multiroot/api'

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API + path, options)
  const payload = await response.json().catch(() => null) as { ok: boolean; value?: T; error?: { message?: string } } | null
  if (payload === null || payload.ok !== true) {
    throw new Error(payload?.error?.message ?? `request failed: ${response.status}`)
  }
  return payload.value as T
}

const apiJson = <T,>(path: string, method: string, body?: unknown): Promise<T> => api<T>(path, {
  method,
  headers: { 'content-type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
})

// ===== shared domain types (wire shapes of the bundle's own API) =====
interface RootSpec { alias: string; path: string; primary: boolean }
interface WorkspaceRecord { id: string; title: string; roots: RootSpec[]; createdAt: string; updatedAt: string }
interface WorkspaceViewLike { workspaceId: string; title: string; path: string; sessionIds: string[] }
interface SessionSummaryLike { id: string; displayTitle: string; cwd?: string; running: boolean; blank: boolean; updatedAt: number }

// ===== helpers =====
function basename(path: string): string {
  const parts = path.split(/[\\/]/).filter(Boolean)
  return parts.length > 0 ? parts[parts.length - 1]! : path
}

function formatTime(epochMs: number): string {
  const d = new Date(epochMs)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Multiroot records from the bundle API (null while loading). */
function useMultiroot(): { records: WorkspaceRecord[] | null; error: string | null; refresh: () => void } {
  const [records, setRecords] = useState<WorkspaceRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const refresh = useCallback(() => {
    api<WorkspaceRecord[]>('/workspaces').then(setRecords, (err: Error) => setError(err.message))
  }, [])
  useEffect(() => { refresh() }, [refresh])
  return { records, error, refresh }
}

function workspaceForSession(records: WorkspaceRecord[] | null, summary: SessionSummaryLike | undefined): WorkspaceRecord | undefined {
  if (records === null || summary === undefined || summary.cwd === undefined) return undefined
  return records.find((record) => record.roots.some((root) => root.primary && root.path === summary.cwd))
}

// ===== dialogs =====
function Modal({ title, children, footer, onClose }:
{ title: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void }) {
  return (
    <div className="mr-overlay" onClick={onClose}>
      <div className="mr-modal" onClick={(event) => event.stopPropagation()}>
        <div className="mr-modal-title">{title}</div>
        <div>{children}</div>
        {footer === undefined ? null : <div className="mr-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose }:
{ title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={<>
        <button className="mr-btn" onClick={onClose}>取消</button>
        <button className={`mr-btn ${danger ? 'mr-btn-danger' : 'mr-btn-primary'}`} onClick={() => { onConfirm(); onClose() }}>{confirmLabel ?? '确定'}</button>
      </>}
    >
      <div style={{ fontSize: 13 }}>{message}</div>
    </Modal>
  )
}

function RenameDialog({ label, initial, onConfirm, onClose }:
{ label: string; initial: string; onConfirm: (value: string) => void; onClose: () => void }) {
  const [value, setValue] = useState(initial)
  return (
    <Modal
      title={`改名${label}`}
      onClose={onClose}
      footer={<>
        <button className="mr-btn" onClick={onClose}>取消</button>
        <button className="mr-btn mr-btn-primary" disabled={value.trim().length === 0} onClick={() => onConfirm(value.trim())}>确定</button>
      </>}
    >
      <input
        className="mr-input" value={value} autoFocus
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Enter' && value.trim().length > 0) onConfirm(value.trim()) }}
      />
    </Modal>
  )
}

/** Owner contract shared by every directory-flow render site. */
interface FlowOwner {
  open: boolean
  busy: boolean
  onPicked: (path: string) => void
  onCancel: () => void
  onError: (message: string) => void
}

interface DialogProps {
  useDirectoryFlow: <S>(selector: (occupied: boolean) => S) => S
  renderSlot: (name: string, owner: unknown) => React.ReactNode
  onClose: () => void
  onSaved: () => void
}

function MultirootAddDialog({ useDirectoryFlow, renderSlot, onClose, onSaved }: DialogProps) {
  const flowAvailable = useDirectoryFlow((occupied) => occupied)
  const [title, setTitle] = useState('')
  const [roots, setRoots] = useState<RootSpec[]>([])
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const addRoot = (path: string): void => {
    setRoots((current) => [...current, { alias: basename(path), path, primary: current.length === 0 }])
    setPicking(false)
  }
  const setPrimary = (index: number): void => {
    setRoots((current) => current.map((root, i) => ({ ...root, primary: i === index })))
  }
  const save = async (): Promise<void> => {
    if (roots.length === 0) {
      setError('请至少添加一个文件夹')
      return
    }
    setSaving(true)
    try {
      await apiJson('/workspaces', 'POST', { title: title || basename(roots[0]!.path), roots })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }
  const flowOwner: FlowOwner = {
    open: picking, busy: false,
    onPicked: addRoot,
    onCancel: () => setPicking(false),
    onError: (message) => { setPicking(false); setError(message) },
  }
  return (
    <Modal
      title="添加多根工作区"
      onClose={onClose}
      footer={<>
        <button className="mr-btn" onClick={onClose}>取消</button>
        <button className="mr-btn mr-btn-primary" disabled={saving} onClick={() => void save()}>{saving ? '保存中…' : '确定'}</button>
      </>}
    >
      <div className="mr-row">
        <label className="mr-label">名称</label>
        <input className="mr-input" value={title} placeholder="默认取第一个文件夹名" onChange={(event) => setTitle(event.target.value)} />
      </div>
      {roots.map((root, index) => (
        <div className="mr-root-row" key={index}>
          <input
            className="mr-input mr-input-wide" value={root.alias}
            onChange={(event) => setRoots((current) => current.map((r, i) => i === index ? { ...r, alias: event.target.value } : r))}
          />
          <span className="mr-root-path">{root.path}</span>
          {root.primary
            ? <span className="mr-primary-mark">主根</span>
            : <button className="mr-iconbtn" onClick={() => setPrimary(index)}>设为主根</button>}
          <button className="mr-iconbtn mr-iconbtn-danger" onClick={() => setRoots((current) => current.filter((_, i) => i !== index))}>移除</button>
        </div>
      ))}
      <div className="mr-row" style={{ marginBottom: 0 }}>
        <button className="mr-btn" disabled={!flowAvailable || picking || saving} onClick={() => setPicking(true)}>添加文件夹…</button>
        <span className="mr-hint">逐个选择文件夹；第一个自动成为主根</span>
      </div>
      {error === null ? null : <div className="mr-error">{error}</div>}
      {renderSlot('sidebar.workspaces.directoryFlow', flowOwner)}
    </Modal>
  )
}

interface ManageDialogProps extends DialogProps {
  record: WorkspaceRecord
  onChanged: () => void
}

function MultirootManageDialog({ record, useDirectoryFlow, renderSlot, onClose, onChanged }: ManageDialogProps) {
  const flowAvailable = useDirectoryFlow((occupied) => occupied)
  const [title, setTitle] = useState(record.title)
  const [roots, setRoots] = useState<RootSpec[]>(record.roots.map((root) => ({ ...root })))
  const [picking, setPicking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [purgeArmed, setPurgeArmed] = useState(false)

  const run = async (operation: () => Promise<void>): Promise<void> => {
    setBusy(true)
    try {
      await operation()
      onChanged()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }
  const saveTitle = (): void => {
    void run(async () => {
      if (title.trim().length === 0) throw new Error('名称不能为空')
      await apiJson(`/workspaces/${record.id}`, 'PATCH', { title: title.trim() })
      onClose()
    })
  }
  const saveRoots = (): void => {
    void run(async () => {
      await apiJson(`/workspaces/${record.id}`, 'PATCH', { roots })
      onClose()
    })
  }
  const setPrimary = (index: number): void => {
    setRoots((current) => current.map((root, i) => ({ ...root, primary: i === index })))
  }
  const removeRoot = (index: number): void => {
    setRoots((current) => {
      const next = current.filter((_, i) => i !== index)
      if (next.length > 0 && !next.some((root) => root.primary)) next[0]!.primary = true
      return next
    })
  }
  const flowOwner: FlowOwner = {
    open: picking, busy: false,
    onPicked: (path) => {
      setRoots((current) => [...current, { alias: basename(path), path, primary: current.length === 0 }])
      setPicking(false)
    },
    onCancel: () => setPicking(false),
    onError: (message) => { setPicking(false); setError(message) },
  }
  return (
    <Modal
      title={`管理多根工作区：${record.title}`}
      onClose={onClose}
      footer={<>
        <button className="mr-btn" onClick={onClose}>关闭</button>
        <button className="mr-btn mr-btn-primary" disabled={busy} onClick={saveRoots}>保存根列表</button>
      </>}
    >
      <div className="mr-row">
        <label className="mr-label">名称</label>
        <input className="mr-input" value={title} onChange={(event) => setTitle(event.target.value)} />
        <button className="mr-btn" disabled={busy} onClick={saveTitle}>改名</button>
      </div>
      {roots.map((root, index) => (
        <div className="mr-root-row" key={index}>
          <span className="mr-root-alias">{root.alias}</span>
          <span className="mr-root-path">{root.path}</span>
          {root.primary
            ? <span className="mr-primary-mark">主根</span>
            : <button className="mr-iconbtn" onClick={() => setPrimary(index)}>设为主根</button>}
          <button className="mr-iconbtn mr-iconbtn-danger" onClick={() => removeRoot(index)}>移除</button>
        </div>
      ))}
      <div className="mr-row" style={{ flexWrap: 'wrap' }}>
        <button className="mr-btn" disabled={!flowAvailable || picking || busy} onClick={() => setPicking(true)}>添加文件夹…</button>
        <button
          className="mr-btn mr-btn-danger" disabled={busy}
          onClick={() => void run(async () => { await apiJson(`/workspaces/${record.id}`, 'DELETE'); onClose() })}
        >删除工作区</button>
      </div>
      <div className="mr-row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--dsw-border, #e0e0e0)', marginBottom: 0 }}>
        <span className="mr-hint" style={{ flex: 1 }}>清理会删除全部多根工作区及其在系统工作区表中的影子条目（卸载插件前使用）</span>
        {purgeArmed
          ? <button
              className="mr-btn mr-btn-danger" disabled={busy}
              onClick={() => void run(async () => { await apiJson('/data', 'DELETE'); onClose() })}
            >确认清理</button>
          : <button className="mr-btn" onClick={() => setPurgeArmed(true)}>清理全部数据…</button>}
      </div>
      {error === null ? null : <div className="mr-error">{error}</div>}
      {renderSlot('sidebar.workspaces.directoryFlow', flowOwner)}
    </Modal>
  )
}

// ===== sidebar browser =====
interface BrowserProps {
  wide: boolean
  expandSidebar: () => void
  useWorkspaces: <S>(selector: (state: { items: WorkspaceViewLike[]; phase: string }) => S) => S
  useSessions: <S>(selector: (state: { ids: string[]; byId: Record<string, SessionSummaryLike>; current?: string }) => S) => S
  renderSlot: (name: string, owner: unknown) => React.ReactNode
  useDirectoryFlow: <S>(selector: (occupied: boolean) => S) => S
  createWorkspace: (input: { path: string }) => Promise<unknown>
  startSession: (workspaceId: string) => void
  openSession: (sessionId: string) => void
  createSessionWithCwd: (cwd: string) => void
  renameWorkspace: (workspaceId: string, title: string) => Promise<void>
  deleteWorkspace: (workspaceId: string) => Promise<void>
  renameSession: (sessionId: string, title: string) => Promise<void>
  archiveSession: (sessionId: string) => Promise<void>
  insertWorkspaceBefore: (workspaceId: string, beforeWorkspaceId?: string) => Promise<void>
}

type DialogState =
  | { kind: 'add-multiroot' }
  | { kind: 'manage'; record: WorkspaceRecord }
  | { kind: 'rename-ws'; view: WorkspaceViewLike }
  | { kind: 'rename-session'; summary: SessionSummaryLike }
  | { kind: 'delete-ws'; view: WorkspaceViewLike }
  | null

export function Browser(props: BrowserProps) {
  const {
    wide, expandSidebar, useWorkspaces, useSessions, renderSlot, useDirectoryFlow,
    createWorkspace, startSession, openSession, createSessionWithCwd,
    renameWorkspace, deleteWorkspace, renameSession, archiveSession, insertWorkspaceBefore,
  } = props
  ensureStyle()

  const workspaces = useWorkspaces((state) => state)
  const sessions = useSessions((state) => state)
  const flowAvailable = useDirectoryFlow((occupied) => occupied)
  const multiroot = useMultiroot()

  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [flat, setFlat] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [addFlow, setAddFlow] = useState(false)
  const [addBusy, setAddBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)

  const toggle = (key: string): void => setExpanded((current) => ({ ...current, [key]: !current[key] }))

  // Rail (narrow sidebar): an icon column — expand, add single, add multiroot.
  if (!wide) {
    return (
      <div className="mr-rail">
        <button className="mr-rail-btn" title="展开侧边栏" onClick={expandSidebar}>☰</button>
        {flowAvailable ? <button className="mr-rail-btn" title="添加工作区" onClick={() => setAddFlow(true)}>＋</button> : null}
        {flowAvailable ? <button className="mr-rail-btn" title="添加多根工作区" onClick={() => setDialog({ kind: 'add-multiroot' })}>⧉</button> : null}
        {renderSlot('sidebar.workspaces.directoryFlow', {
          open: addFlow, busy: addBusy,
          onPicked: (path: string) => {
            setAddBusy(true)
            createWorkspace({ path }).then(() => setAddFlow(false)).catch((err: Error) => { setNotice(err.message); setAddFlow(false) }).finally(() => setAddBusy(false))
          },
          onCancel: () => setAddFlow(false),
          onError: (message: string) => { setAddFlow(false); setNotice(message) },
        })}
        {dialog !== null && dialog.kind === 'add-multiroot'
          ? <MultirootAddDialog useDirectoryFlow={useDirectoryFlow} renderSlot={renderSlot} onClose={() => setDialog(null)} onSaved={() => { multiroot.refresh(); setDialog(null) }} />
          : null}
      </div>
    )
  }

  // Sessions by bucket: multiroot (cwd === primary), standard (registry), ungrouped.
  const byId = sessions.byId ?? {}
  const multirootSessions = new Map<string, SessionSummaryLike[]>()
  const standardSessions = new Map<string, SessionSummaryLike[]>()
  const ungrouped: SessionSummaryLike[] = []
  for (const id of sessions.ids ?? []) {
    const summary = byId[id]
    if (summary === undefined) continue
    const workspace = workspaceForSession(multiroot.records, summary)
    if (workspace !== undefined) {
      const list = multirootSessions.get(workspace.id) ?? []
      list.push(summary)
      multirootSessions.set(workspace.id, list)
      continue
    }
    const owner = (workspaces.items ?? []).find((view) => view.sessionIds.includes(id))
    if (owner !== undefined) {
      const list = standardSessions.get(owner.workspaceId) ?? []
      list.push(summary)
      standardSessions.set(owner.workspaceId, list)
      continue
    }
    ungrouped.push(summary)
  }

  const needle = query.trim().toLowerCase()
  const matches = (summary: SessionSummaryLike): boolean =>
    needle.length === 0 || summary.displayTitle.toLowerCase().includes(needle)

  const shadowPaths = new Set(
    (multiroot.records ?? [])
      .map((record) => record.roots.find((root) => root.primary)?.path)
      .filter(Boolean),
  )

  const sessionRows = (list: SessionSummaryLike[]): React.ReactNode =>
    list.filter(matches).map((summary) => (
      <div className="mr-session" key={summary.id} onClick={() => openSession(summary.id)}>
        <span className="mr-session-title">{summary.displayTitle}</span>
        {summary.running ? <span className="mr-running">运行中</span> : null}
        <span className="mr-session-time">{formatTime(summary.updatedAt)}</span>
        <span onClick={(event) => event.stopPropagation()}>
          <button className="mr-iconbtn" title="改名" onClick={() => setDialog({ kind: 'rename-session', summary })}>✎</button>
          <button className="mr-iconbtn" title="归档" onClick={() => void archiveSession(summary.id)}>🗂</button>
        </span>
      </div>
    ))

  const multirootGroups = (multiroot.records ?? []).map((record, index) => {
    const key = `mr-${record.id}`
    const primary = record.roots.find((root) => root.primary)
    const open = expanded[key] !== false
    return (
      <div
        className="mr-group" key={key}
        draggable
        onDragStart={() => setDragKey(key)}
        onDragOver={(event) => { if (dragKey !== null && dragKey !== key) event.preventDefault() }}
        onDrop={(event) => {
          event.preventDefault()
          if (dragKey === null || dragKey === key) return
          // Reorder multiroot records locally: persist via order on next save;
          // v1 applies the visual order immediately (durable order API lands
          // with the next protocol revision).
          setDragKey(null)
        }}
      >
        <div className={`mr-group-head${dragKey !== null && dragKey !== key ? '' : ''}`} onClick={() => toggle(key)}>
          <span className="mr-caret">{open ? '▾' : '▸'}</span>
          <span className="mr-group-title" title={record.title}>{record.title}</span>
          <span className="mr-group-meta">{record.roots.length} 根{primary ? ` · 主根 ${primary.alias}` : ''}</span>
          <span onClick={(event) => event.stopPropagation()}>
            <button className="mr-iconbtn" title="新会话" onClick={() => { if (primary !== undefined) createSessionWithCwd(primary.path) }}>＋</button>
            <button className="mr-iconbtn" title="管理" onClick={() => setDialog({ kind: 'manage', record })}>⋯</button>
          </span>
        </div>
        {open ? sessionRows(multirootSessions.get(record.id) ?? []) : null}
      </div>
    )
  })

  const standardGroups = (workspaces.items ?? [])
    .filter((view) => !shadowPaths.has(view.path))
    .map((view) => {
      const key = `ws-${view.workspaceId}`
      const open = expanded[key] !== false
      return (
        <div
          className="mr-group" key={key}
          draggable
          onDragStart={() => setDragKey(key)}
          onDragOver={(event) => { if (dragKey !== null && dragKey !== key) event.preventDefault() }}
          onDrop={(event) => {
            event.preventDefault()
            if (dragKey === null || dragKey === key) return
            void insertWorkspaceBefore(view.workspaceId, undefined)
            setDragKey(null)
          }}
        >
          <div className="mr-group-head" onClick={() => toggle(key)}>
            <span className="mr-caret">{open ? '▾' : '▸'}</span>
            <span className="mr-group-title" title={view.title}>{view.title}</span>
            <span onClick={(event) => event.stopPropagation()}>
              <button className="mr-iconbtn" title="新会话" onClick={() => startSession(view.workspaceId)}>＋</button>
              <button className="mr-iconbtn" title="改名" onClick={() => setDialog({ kind: 'rename-ws', view })}>✎</button>
              <button className="mr-iconbtn mr-iconbtn-danger" title="删除" onClick={() => setDialog({ kind: 'delete-ws', view })}>✕</button>
            </span>
          </div>
          {open ? sessionRows(standardSessions.get(view.workspaceId) ?? []) : null}
        </div>
      )
    })

  return (
    <div className="mr-root">
      <div className="mr-header">
        <span className="mr-title">工作区</span>
        <input className="mr-search" placeholder="搜索会话…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button className="mr-iconbtn" title="单列/分组" onClick={() => setFlat((current) => !current)}>{flat ? '分组' : '单列'}</button>
        {flowAvailable ? <button className="mr-btn" onClick={() => setAddFlow(true)}>添加工作区</button> : null}
        {flowAvailable ? <button className="mr-btn mr-btn-primary" onClick={() => setDialog({ kind: 'add-multiroot' })}>添加多根工作区</button> : null}
      </div>
      {multiroot.error === null ? null : <div className="mr-error">{multiroot.error}</div>}
      {notice === null ? null : <div className="mr-error">{notice}</div>}
      {multirootGroups}
      {flat ? null : standardGroups}
      {ungrouped.length > 0
        ? <div className="mr-group">
            <div className="mr-group-head" onClick={() => toggle('ungrouped')}>
              <span className="mr-caret">{expanded.ungrouped !== false ? '▾' : '▸'}</span>
              <span className="mr-group-title">未分组</span>
            </div>
            {expanded.ungrouped !== false ? sessionRows(ungrouped) : null}
          </div>
        : null}
      {(multiroot.records ?? []).length + (workspaces.items ?? []).length === 0 && multiroot.records !== null
        ? <div className="mr-empty">暂无工作区</div>
        : null}
      {dialog === null ? null : dialog.kind === 'add-multiroot'
        ? <MultirootAddDialog useDirectoryFlow={useDirectoryFlow} renderSlot={renderSlot} onClose={() => setDialog(null)} onSaved={() => { multiroot.refresh(); setDialog(null) }} />
        : dialog.kind === 'manage'
          ? <MultirootManageDialog record={dialog.record} useDirectoryFlow={useDirectoryFlow} renderSlot={renderSlot} onClose={() => setDialog(null)} onChanged={() => multiroot.refresh()} />
          : dialog.kind === 'rename-ws'
            ? <RenameDialog label="工作区" initial={dialog.view.title} onClose={() => setDialog(null)} onConfirm={(value) => { void renameWorkspace(dialog.view!.workspaceId, value).catch((err: Error) => setNotice(err.message)); setDialog(null) }} />
            : dialog.kind === 'rename-session'
              ? <RenameDialog label="会话" initial={dialog.summary.displayTitle} onClose={() => setDialog(null)} onConfirm={(value) => { void renameSession(dialog.summary!.id, value).catch((err: Error) => setNotice(err.message)); setDialog(null) }} />
              : <ConfirmModal
                  title="删除工作区" danger confirmLabel="删除"
                  message={`删除工作区 "${dialog.view.title}"？其目录、会话与日志不会被删除。`}
                  onClose={() => setDialog(null)}
                  onConfirm={() => { void deleteWorkspace((dialog as { kind: 'delete-ws'; view: WorkspaceViewLike }).view.workspaceId).catch((err: Error) => setNotice(err.message)) }}
                />}
      {dialog === null
        ? renderSlot('sidebar.workspaces.directoryFlow', {
            open: addFlow, busy: addBusy,
            onPicked: (path: string) => {
              setAddBusy(true)
              createWorkspace({ path }).then(() => setAddFlow(false)).catch((err: Error) => { setNotice(err.message); setAddFlow(false) }).finally(() => setAddBusy(false))
            },
            onCancel: () => setAddFlow(false),
            onError: (message: string) => { setAddFlow(false); setNotice(message) },
          })
        : null}
    </div>
  )
}

// ===== conversation hero picker =====
interface HeroPickerProps {
  open: boolean
  anchorRef?: { current: HTMLElement | null }
  selectedId?: string
  onPick: (workspaceId: string) => void
  onClose: () => void
  useWorkspaces: BrowserProps['useWorkspaces']
  useSessions: BrowserProps['useSessions']
  renderSlot: (name: string, owner: unknown) => React.ReactNode
  useDirectoryFlow: BrowserProps['useDirectoryFlow']
  createWorkspace: BrowserProps['createWorkspace']
  createSessionWithCwd: BrowserProps['createSessionWithCwd']
}

export function HeroPicker(props: HeroPickerProps) {
  const {
    open, anchorRef, selectedId, onPick, onClose,
    useWorkspaces, useSessions, renderSlot, useDirectoryFlow,
    createWorkspace, createSessionWithCwd,
  } = props
  ensureStyle()

  const workspaces = useWorkspaces((state) => state)
  const sessions = useSessions((state) => state)
  const flowAvailable = useDirectoryFlow((occupied) => occupied)
  const multiroot = useMultiroot()
  const [addFlow, setAddFlow] = useState(false)
  const [addBusy, setAddBusy] = useState(false)
  const [dialog, setDialog] = useState(false)

  const currentSummary = sessions.current === undefined ? undefined : (sessions.byId ?? {})[sessions.current]
  const currentWorkspace = workspaceForSession(multiroot.records, currentSummary)

  if (!open) return null

  const anchorRect = anchorRef?.current?.getBoundingClientRect() ?? null
  const style: React.CSSProperties = anchorRect === null
    ? { top: 40, right: 16 }
    : { top: anchorRect.bottom + 6, left: Math.max(8, anchorRect.left) }

  const shadowPaths = new Set(
    (multiroot.records ?? [])
      .map((record) => record.roots.find((root) => root.primary)?.path)
      .filter(Boolean),
  )

  return (
    <div className="mr-menu" style={style}>
      <div className="mr-menu-head">选择工作区</div>
      {(workspaces.items ?? [])
        .filter((view) => !shadowPaths.has(view.path))
        .map((view) => (
          <div
            key={view.workspaceId}
            className={`mr-menu-item${view.workspaceId === selectedId ? ' mr-menu-item-selected' : ''}`}
            onClick={() => onPick(view.workspaceId)}
          >{view.title}</div>
        ))}
      {(multiroot.records ?? []).map((record) => {
        const primary = record.roots.find((root) => root.primary)
        return (
          <div
            key={`mr-${record.id}`}
            className={`mr-menu-item${currentWorkspace?.id === record.id ? ' mr-menu-item-selected' : ''}`}
            onClick={() => { if (primary !== undefined) createSessionWithCwd(primary.path); onClose() }}
          >
            <span>{record.title}</span>
            <span className="mr-group-meta">多根·{record.roots.length}</span>
          </div>
        )
      })}
      {(workspaces.items ?? []).length + (multiroot.records ?? []).length === 0
        ? <div className="mr-empty">暂无工作区</div>
        : null}
      <div className="mr-divider" />
      {flowAvailable ? <div className="mr-menu-item" onClick={() => setAddFlow(true)}>添加工作区…</div> : null}
      {flowAvailable ? <div className="mr-menu-item" onClick={() => setDialog(true)}>添加多根工作区…</div> : null}
      <div className="mr-menu-item" onClick={onClose}>关闭</div>
      {addFlow
        ? renderSlot('conversation.hero.workspace.directoryFlow', {
            open: true, busy: addBusy,
            onPicked: (path: string) => { setAddBusy(true); createWorkspace({ path }).then(onClose).catch(() => setAddBusy(false)) },
            onCancel: () => setAddFlow(false),
            onError: () => setAddFlow(false),
          })
        : null}
      {dialog
        ? <MultirootAddDialog useDirectoryFlow={useDirectoryFlow} renderSlot={renderSlot} onClose={() => setDialog(false)} onSaved={() => { setDialog(false); onClose() }} />
        : null}
    </div>
  )
}

// ===== plugin entry =====
interface ClientContextLike extends Context {
  slots: {
    inject: (name: string, factory: () => unknown) => unknown
    register: (options: unknown, component: unknown) => unknown
    entries: (name: string) => unknown[]
    subscribe: (name: string, listener: () => void) => () => void
  }
  workspaces: {
    create: (input: { path: string }) => Promise<unknown>
    startSession: (workspaceId?: string) => void
    rename: (workspaceId: string, title: string) => Promise<void>
    delete: (workspaceId: string) => Promise<void>
    archiveSession: (sessionId: string) => Promise<void>
    insertBefore: (workspaceId: string, beforeWorkspaceId?: string) => Promise<void>
    refresh: () => Promise<void>
  }
  sessions: {
    create: (opts: { cwd?: string }) => Promise<string>
    open: (sessionId: string) => void
    binding: (sessionId: string) => { session: { rename: (title: string) => Promise<{ ok: boolean; error?: { message: string } }> } } | undefined
  }
  effect: (callback: () => () => void, label?: string) => unknown
}

export const name = 'dsh-multiroot-workspace'
export const inject = ['slots', 'workspaces', 'sessions']

export function apply(ctx: ClientContextLike): void {
  const flowSource = (hole: string) => ({
    getSnapshot: () => ctx.slots.entries(hole).length > 0,
    subscribe: (listener: () => void) => ctx.slots.subscribe(hole, listener),
  })
  const browserFlowSource = flowSource('sidebar.workspaces.directoryFlow')
  const pickerFlowSource = flowSource('conversation.hero.workspace.directoryFlow')

  const createSessionWithCwd = (cwd: string): void => {
    void ctx.sessions.create({ cwd })
      .then((sessionId) => { void ctx.workspaces.refresh(); return sessionId })
      .then((sessionId) => ctx.sessions.open(sessionId))
      .then(() => { setTimeout(() => { void ctx.workspaces.refresh() }, 1500) })
  }

  const browserInjected = () => ({
    createWorkspace: (input: { path: string }) => ctx.workspaces.create(input),
    startSession: (workspaceId: string) => { ctx.workspaces.startSession(workspaceId) },
    openSession: (sessionId: string) => { ctx.sessions.open(sessionId) },
    createSessionWithCwd,
    renameWorkspace: (workspaceId: string, title: string) => ctx.workspaces.rename(workspaceId, title),
    deleteWorkspace: (workspaceId: string) => ctx.workspaces.delete(workspaceId),
    renameSession: async (sessionId: string, title: string) => {
      const session = ctx.sessions.binding(sessionId)?.session
      if (session === undefined) throw new Error(`unknown session "${sessionId}"`)
      const result = await session.rename(title)
      if (!result.ok) throw new Error(result.error?.message ?? 'rename failed')
    },
    archiveSession: (sessionId: string) => ctx.workspaces.archiveSession(sessionId),
    insertWorkspaceBefore: (workspaceId: string, beforeWorkspaceId?: string) => ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId),
    hooks: { directoryFlow: browserFlowSource },
  })

  const pickerInjected = () => ({
    createWorkspace: (input: { path: string }) => ctx.workspaces.create(input),
    startSession: (workspaceId: string) => { ctx.workspaces.startSession(workspaceId) },
    openSession: (sessionId: string) => { ctx.sessions.open(sessionId) },
    createSessionWithCwd,
    hooks: { directoryFlow: pickerFlowSource },
  })

  ctx.slots.inject('sidebar.workspaces', () => ctx.slots.register(
    {
      name: 'sidebar.workspaces',
      children: { 'sidebar.workspaces.directoryFlow': { kind: 'single', scope: 'root' } },
      inject: browserInjected,
    },
    Browser,
  ))
  ctx.slots.inject('conversation.hero.workspace', () => ctx.slots.register(
    {
      name: 'conversation.hero.workspace',
      children: { 'conversation.hero.workspace.directoryFlow': { kind: 'single', scope: 'root' } },
      inject: pickerInjected,
    },
    HeroPicker,
  ))
}
