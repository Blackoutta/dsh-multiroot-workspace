import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Modal } from '../vendor/primitives/index.ts'
import type { WorkspaceBrowserProps, DirectoryFlowOwnerProps } from '../upstream/contract/slots.ts'
import { multirootApi } from './api.ts'
import type { MultirootWorkspaceRecord, RootSpec } from './types.ts'
import css from './Dialogs.module.css'

function basename(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path
}

function uniqueAlias(path: string, roots: readonly RootSpec[]): string {
  const base = basename(path) || 'root'
  let alias = base
  let suffix = 2
  const used = new Set(roots.map(root => root.alias.toLowerCase()))
  while (used.has(alias.toLowerCase())) alias = `${base}-${suffix++}`
  return alias
}

export function MultirootDialog({ open, record, onClose, refresh, renderDirectoryFlow, t }: {
  open: boolean
  record: MultirootWorkspaceRecord | null
  onClose: () => void
  refresh: () => Promise<void>
  renderDirectoryFlow: (owner: DirectoryFlowOwnerProps) => ReactNode
  t: WorkspaceBrowserProps['t']
}) {
  const [title, setTitle] = useState('')
  const [roots, setRoots] = useState<RootSpec[]>([])
  const [picking, setPicking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!open) return
    setTitle(record?.title ?? '')
    setRoots(record?.roots.map(root => ({ ...root })) ?? [])
    setPicking(false)
    setSaving(false)
    setError(null)
  }, [open, record])
  const appendRoot = (path: string): void => {
    setRoots(current => {
      if (current.some(root => root.path === path)) return current
      const alias = uniqueAlias(path, current)
      if (current.length === 0 && title.trim() === '') setTitle(alias)
      return [...current, { alias, path, primary: current.length === 0 }]
    })
    setPicking(false)
  }
  const save = async (): Promise<void> => {
    if (saving || title.trim() === '' || roots.length === 0) return
    setSaving(true)
    setError(null)
    try {
      if (record === null) {
        await multirootApi.create({ title: title.trim(), roots })
      } else {
        const oldPrimary = record.roots.find(root => root.primary)?.alias
        const nextPrimary = roots.find(root => root.primary)?.alias
        const rootsWithOldPrimary = roots.map(root => ({
          ...root,
          primary: root.alias.toLowerCase() === oldPrimary?.toLowerCase(),
        }))
        await multirootApi.update(record.id, { title: title.trim(), roots: rootsWithOldPrimary })
        if (nextPrimary !== undefined && nextPrimary.toLowerCase() !== oldPrimary?.toLowerCase()) {
          await multirootApi.setPrimary(record.id, nextPrimary)
        }
      }
      await refresh()
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSaving(false)
    }
  }
  const remove = (index: number): void => {
    setRoots(current => {
      const next = current.filter((_, candidate) => candidate !== index)
      if (next.length > 0 && !next.some(root => root.primary)) next[0] = { ...next[0]!, primary: true }
      return next
    })
  }
  return (
    <>
      <Modal
        open={open}
        onClose={() => { if (!saving) onClose() }}
        closeLabel={t('close')}
        title={record === null ? t('multiroot.add') : t('multiroot.manage.title')}
        className={css.dialog!}
        contentClassName={css.dialogContent!}
        footer={(
          <>
            {record !== null && (
              <Button variant="outline" disabled={saving} onClick={() => {
                setSaving(true)
                void multirootApi.delete(record.id).then(refresh).then(onClose).catch((cause: unknown) => {
                  setError(cause instanceof Error ? cause.message : String(cause))
                  setSaving(false)
                })
              }}>{t('multiroot.delete')}</Button>
            )}
            <Button variant="outline" disabled={saving} onClick={onClose}>{t('cancel')}</Button>
            <Button variant="primary" disabled={saving || title.trim() === '' || roots.length === 0} onClick={() => { void save() }}>
              {record === null ? t('multiroot.create') : t('save')}
            </Button>
          </>
        )}
      >
        <div className={css.form}>
          <label className={css.field}>
            {t('field.workspaceName')}
            <input className={css.input} aria-label={t('field.workspaceName')} value={title}
              onChange={event => { setTitle(event.target.value) }} />
          </label>
          <div className={css.rootList}>
            <div className={css.rootListHeader}>
              <span>{t('multiroot.roots')}</span>
              <span>{t('multiroot.rootCount', { count: roots.length })}</span>
            </div>
            <div className={css.rootScroller} role="region" aria-label={t('multiroot.roots')}>
              {roots.map((root, index) => (
                <div className={css.rootRow} key={`${root.path}:${index}`}>
                  <div className={css.rootFields}>
                    <label className={css.field}>
                      {t('multiroot.directoryName')}
                      <input className={css.input} aria-label={t('multiroot.alias', { n: index + 1 })}
                        value={root.alias} onChange={event => {
                          const alias = event.target.value
                          setRoots(current => current.map((item, candidate) => candidate === index ? { ...item, alias } : item))
                        }} />
                    </label>
                    <div className={css.field}>
                      {t('multiroot.directoryPath')}
                      <span className={css.rootPath} title={root.path}>{root.path}</span>
                    </div>
                  </div>
                  <div className={css.rootActions}>
                    {root.primary
                      ? <span className={css.primary}><span className={css.radioSelected} aria-hidden="true" />{t('multiroot.currentPrimary')}</span>
                      : <Button variant="ghost" size="sm" disabled={saving} onClick={() => {
                        setRoots(current => current.map((item, candidate) => ({ ...item, primary: candidate === index })))
                      }}><span className={css.makePrimary}><span className={css.radio} aria-hidden="true" />{t('multiroot.makePrimary', { name: root.alias })}</span></Button>}
                    <Button className={css.removeButton} variant="ghost" size="sm" disabled={saving || roots.length === 1} onClick={() => { remove(index) }}>
                      {t('multiroot.remove')}
                    </Button>
                  </div>
                </div>
              ))}
              {roots.length === 0 && <span className={css.hint}>{t('multiroot.empty')}</span>}
            </div>
          </div>
          <Button variant="outline" disabled={saving || picking} onClick={() => { setPicking(true) }}>
            {t('multiroot.addFolder')}
          </Button>
          {error !== null && <div className={css.error}>{error}</div>}
        </div>
      </Modal>
      {renderDirectoryFlow({
        open: open && picking,
        busy: saving,
        onPicked: appendRoot,
        onCancel: () => { setPicking(false) },
        onError: message => { setPicking(false); setError(message) },
      })}
    </>
  )
}
