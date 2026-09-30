import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json, imageURL, dateLabel, type Client } from './api'
import { usePreferences } from './i18n'
import type { Permission } from './privacy'
import { DemoViewer } from './demo-viewer'
import type {
  DemoLibrary,
  DemoState,
  DemoStyle,
  DemoOption,
  DemoJob,
  DemoCamera,
} from './demo-types'

type PhotoSet = {
  id: string
  title: string
  views: Record<string, string>
  missing: string[]
}
const views = [
  'front',
  'left-three-quarter',
  'right-three-quarter',
  'left-profile',
  'right-profile',
  'back',
]
const angles = [
  { name: 'Front', azimuth: 0 },
  { name: 'Left three-quarter', azimuth: Math.PI / 4 },
  { name: 'Right three-quarter', azimuth: -Math.PI / 4 },
  { name: 'Left profile', azimuth: Math.PI / 2 },
  { name: 'Right profile', azimuth: -Math.PI / 2 },
  { name: 'Back', azimuth: Math.PI },
]
export function DemoWorkspace() {
  const { t } = usePreferences()
  const clients = useQuery({
    queryKey: ['clients'],
    queryFn: () => api<Client[]>('/clients'),
  })
  const library = useQuery({
    queryKey: ['demo-library'],
    queryFn: () => api<DemoLibrary>('/demo-library'),
  })
  const [client, setClient] = useState(
    new URLSearchParams(window.location.search).get('client') || '',
  )
  function selectClient(id: string) {
    setClient(id)
    const url = new URL(window.location.href)
    url.searchParams.set('client', id)
    window.history.replaceState(null, '', url)
  }
  return (
    <div className="page demo-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('LOCAL COMPARATIVE DEMOS')}</span>
          <h1>{t('Explore the eight routes')}</h1>
          <p>
            {t(
              'Shared inputs, independent style assets and retained experiments. Your professional review and route selection remain pending.',
            )}
          </p>
        </div>
      </div>
      <label>
        {t('Demo client')}
        <select value={client} onChange={(e) => selectClient(e.target.value)}>
          <option value="">{t('Select a client')}</option>
          {clients.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {clients.error && (
        <p className="error" role="alert">
          {clients.error.message}
        </p>
      )}
      {library.error && (
        <p className="error" role="alert">
          {library.error.message}
        </p>
      )}
      {library.isPending && <p>{t('Loading shared asset library…')}</p>}
      {client && library.data && (
        <DemoSession key={client} clientId={client} library={library.data} />
      )}
      {!client && (
        <p className="notice">
          {t(
            'Choose a fictional demo client or an explicitly authorized client to open the workspace.',
          )}
        </p>
      )}
    </div>
  )
}
function Catalog({
  kind,
  styles,
  value,
  onChange,
}: {
  kind: 'hair' | 'beard'
  styles: DemoStyle[]
  value: string
  onChange: (id: string) => void
}) {
  const { t } = usePreferences(),
    [texture, setTexture] = useState(''),
    [maintenance, setMaintenance] = useState(''),
    [length, setLength] = useState('')
  const styleLength = (s: DemoStyle) =>
    s.length ||
    (s.lengthMm <= 3 ? 'short' : s.lengthMm <= 15 ? 'medium' : 'long')
  const filtered = styles.filter(
    (s) =>
      (!texture || s.texture === texture) &&
      (!maintenance || s.maintenance === maintenance) &&
      (!length || styleLength(s) === length),
  )
  return (
    <section
      className="demo-catalog"
      aria-label={t(
        kind === 'hair' ? 'Hairstyle catalog' : 'Beardstyle catalog',
      )}
    >
      <h3>
        {t(kind === 'hair' ? 'Proposed hairstyle' : 'Proposed beardstyle')}
      </h3>
      <div className="demo-filters">
        <label>
          {t('Length')}
          <select value={length} onChange={(e) => setLength(e.target.value)}>
            <option value="">{t('All lengths')}</option>
            {['short', 'medium', 'long'].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('Texture')}
          <select value={texture} onChange={(e) => setTexture(e.target.value)}>
            <option value="">{t('All textures')}</option>
            {Array.from(new Set(styles.map((s) => s.texture))).map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('Maintenance')}
          <select
            value={maintenance}
            onChange={(e) => setMaintenance(e.target.value)}
          >
            <option value="">{t('All maintenance levels')}</option>
            {['low', 'moderate', 'high'].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="demo-choices">
        {[
          { id: 'keep-current', label: 'Keep current' },
          {
            id: kind === 'hair' ? 'none' : 'clean-shaven',
            label: kind === 'hair' ? 'No hairstyle asset' : 'Clean-shaven',
          },
        ].map((choice) => (
          <button
            type="button"
            className={`button ${value === choice.id ? 'primary' : 'secondary'}`}
            aria-pressed={value === choice.id}
            key={choice.id}
            onClick={() => onChange(choice.id)}
          >
            {t(choice.label)}
          </button>
        ))}
      </div>
      <div className="demo-style-grid">
        {filtered.map((s) => (
          <button
            type="button"
            className={`demo-style ${value === s.id ? 'selected' : ''}`}
            aria-pressed={value === s.id}
            aria-label={t(s.label)}
            key={s.id}
            onClick={() => onChange(s.id)}
          >
            <img src={s.renderUrl} loading="lazy" alt={t(s.label)} />
            <strong>{t(s.label)}</strong>
            <small>
              {t(styleLength(s))} · {t(s.texture)} · {t(s.maintenance)}
            </small>
          </button>
        ))}
      </div>
      {!filtered.length && <p>{t('No styles match these filters.')}</p>}
      <details>
        <summary>{t('Asset provenance and professional review')}</summary>
        <p>
          {t(
            'Reusable CC0 assets fitted to this shared mannequin. Professional acceptance and compatibility with each candidate head remain pending.',
          )}
        </p>
        {styles.map((s) => (
          <p key={s.id}>
            {s.label}: {s.creator} · {s.license} ·{' '}
            {(s.bytes / 1048576).toFixed(1)} MB ·{' '}
            {s.sourceUrl.startsWith('https://') ? (
              <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                {t('Primary source')}
              </a>
            ) : (
              t('Created by the retained local asset script')
            )}
          </p>
        ))}
      </details>
    </section>
  )
}
function DemoSession({
  clientId,
  library,
}: {
  clientId: string
  library: DemoLibrary
}) {
  const { t, locale } = usePreferences(),
    cache = useQueryClient(),
    base = `/clients/${clientId}`
  const permission = useQuery({
    queryKey: ['permission', clientId],
    queryFn: () => api<Permission>(`${base}/permission`),
    refetchInterval: 1000,
  })
  const authorized = !permission.error && permission.data?.status === 'active'
  const sets = useQuery({
    queryKey: ['photo-sets', clientId],
    queryFn: () => api<PhotoSet[]>(`${base}/photo-sets`),
    refetchInterval: 3000,
    enabled: authorized,
  })
  const workspace = useQuery({
    queryKey: ['demo-workspace', clientId],
    queryFn: () =>
      api<{ state: DemoState | null; version: number }>(
        `${base}/demo-workspace`,
      ),
    enabled: authorized,
  })
  const options = useQuery({
    queryKey: ['demo-options', clientId],
    queryFn: () => api<DemoOption[]>(`${base}/demo-options`),
    enabled: authorized,
    refetchInterval: 3000,
  })
  const jobs = useQuery({
    queryKey: ['demo-jobs', clientId],
    queryFn: () => api<DemoJob[]>(`${base}/demo-jobs`),
    enabled: authorized,
    refetchInterval: 1000,
  })
  const [state, setState] = useState<DemoState>(),
    [version, setVersion] = useState(0),
    [dirty, setDirty] = useState(false),
    [title, setTitle] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!authorized) {
      setState(undefined)
      setVersion(0)
      setDirty(false)
      setTitle('')
      cache.removeQueries({ queryKey: ['demo-workspace', clientId] })
      cache.removeQueries({ queryKey: ['demo-options', clientId] })
      cache.removeQueries({ queryKey: ['demo-jobs', clientId] })
    }
  }, [authorized, cache, clientId])
  useEffect(() => {
    if (!state && authorized && workspace.data && sets.data) {
      setState(
        workspace.data.state || {
          candidate: library.candidates[0].id,
          photoSetId:
            sets.data.find((s) => /baseline/i.test(s.title))?.id ||
            sets.data[0]?.id ||
            '',
          modelRunId: '',
          currentHairId: library.hair[0]?.id || 'none',
          currentBeardId: 'clean-shaven',
          hairId: 'keep-current',
          beardId: 'keep-current',
          camera: { azimuth: 0, elevation: 0.08, distance: 1.3 },
          minimumWidth: 512,
        },
      )
      setVersion(workspace.data.version)
    }
  }, [state, authorized, workspace.data, sets.data, library])
  function change(next: Partial<DemoState>) {
    setState((s) => (s ? { ...s, ...next } : s))
    setDirty(true)
    setMessage('')
  }
  async function action(fn: () => Promise<void>) {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function saveWorkspace() {
    if (!state) return
    await action(async () => {
      const result = await api<{ version: number; state: DemoState }>(
        `${base}/demo-workspace`,
        json('PUT', { state, version }),
      )
      setVersion(result.version)
      setState(result.state)
      setDirty(false)
      setMessage(
        'Workspace saved. Reload to reopen the same camera, inputs and independent style selections.',
      )
      await cache.invalidateQueries({ queryKey: ['demo-workspace', clientId] })
    })
  }
  function reopen(option: DemoOption) {
    setState(option.state)
    setDirty(true)
    setMessage(
      'Explored option reopened. Save the workspace to retain it as your current exploration.',
    )
  }
  if (!authorized)
    return (
      <div className="notice">
        {t(
          'Client acknowledgement is required to open personal demo inputs and saved work.',
        )}
        {permission.error && (
          <p className="error">{permission.error.message}</p>
        )}
      </div>
    )
  if (!state)
    return (
      <p>
        {t('Reopening demo workspace…')}
        {workspace.error?.message || sets.error?.message}
      </p>
    )
  const candidate = library.candidates.find((c) => c.id === state.candidate)!,
    liveSet = sets.data?.find((s) => s.id === state.photoSetId)
  const selectedSet =
    liveSet && state.photoViews && Object.keys(state.photoViews).length
      ? {
          ...liveSet,
          views: state.photoViews,
          missing: views.filter((v) => !state.photoViews?.[v]),
        }
      : liveSet
  const resolve = (styles: DemoStyle[], id: string, current: string) =>
    styles.find((s) => s.id === (id === 'keep-current' ? current : id))
      ?.modelUrl
  const currentURLs = [
    library.headUrl,
    resolve(library.hair, state.currentHairId, ''),
    resolve(library.beard, state.currentBeardId, ''),
  ].filter(Boolean) as string[]
  const proposedURLs = [
    library.headUrl,
    resolve(library.hair, state.hairId, state.currentHairId),
    resolve(library.beard, state.beardId, state.currentBeardId),
  ].filter(Boolean) as string[]
  const camera = (value: DemoCamera) => change({ camera: value })
  return (
    <div className="demo-session">
      <section className="card demo-inputs">
        <div className="section-toolbar">
          <div>
            <span className="eyebrow">{t('01 / CANDIDATE AND INPUTS')}</span>
            <h2>{t('Local experiment')}</h2>
          </div>
          <button
            type="button"
            className="button primary"
            disabled={busy}
            onClick={saveWorkspace}
          >
            {t('Save workspace')}
          </button>
        </div>
        <label>
          {t('Candidate')}
          <select
            value={state.candidate}
            onChange={(e) => change({ candidate: e.target.value })}
          >
            {library.candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <p>
          <strong>{candidate.name}</strong> · {t(candidate.role)} ·{' '}
          {t('Candidate processing pending')}
        </p>
        {candidate.dependency && (
          <p className="notice">{t(candidate.dependency)}</p>
        )}
        <p>
          {t(
            'This workspace currently runs shared input diagnostics and real mannequin asset inspection. These are not candidate reconstruction or fitting results.',
          )}
        </p>
        <label>
          {t('Authorized photo set')}
          <select
            value={state.photoSetId}
            onChange={(e) =>
              change({ photoSetId: e.target.value, photoViews: {} })
            }
          >
            <option value="">{t('Select a photo set')}</option>
            {sets.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} · {6 - s.missing.length}/6
              </option>
            ))}
          </select>
        </label>
        {selectedSet && (
          <>
            <p>
              {t(
                state.photoViews && Object.keys(state.photoViews).length
                  ? 'Retained photo assignments; later replacements do not rewrite this exploration.'
                  : 'Current photo assignments; saving snapshots these inputs.',
              )}
            </p>
            <div className="demo-photo-strip">
              {views.map((view) => (
                <figure key={view}>
                  {selectedSet.views[view] ? (
                    <img
                      src={imageURL(selectedSet.views[view])}
                      alt={t(view)}
                    />
                  ) : (
                    <div className="demo-missing">{t('Missing')}</div>
                  )}
                  <figcaption>{t(view)}</figcaption>
                </figure>
              ))}
            </div>
            {selectedSet.missing.length > 0 && (
              <p role="status" className="notice">
                {t('Incomplete required views')}:{' '}
                {selectedSet.missing.map(t).join(', ')}
              </p>
            )}
            <p>
              {t(
                'The standard comparison arm uses exactly these six views. Crown and under-chin details remain separate; no denser capture experiment is included.',
              )}
            </p>
          </>
        )}
        <div className="demo-actions">
          <label>
            {t('Minimum image width')}
            <input
              type="number"
              min={64}
              max={4096}
              value={state.minimumWidth}
              onChange={(e) => change({ minimumWidth: Number(e.target.value) })}
            />
          </label>
          <button
            className="button secondary"
            disabled={busy || !selectedSet || !!selectedSet.missing.length}
            onClick={() =>
              action(async () => {
                await api(
                  `${base}/demo-jobs`,
                  json('POST', {
                    candidate: state.candidate,
                    photoSetId: state.photoSetId,
                    photoViews: state.photoViews || {},
                    minimumWidth: state.minimumWidth,
                  }),
                )
                await cache.invalidateQueries({
                  queryKey: ['demo-jobs', clientId],
                })
                setMessage('Real local input check queued.')
              })
            }
          >
            {t('Check six inputs locally')}
          </button>
        </div>
        {dirty && <p className="notice">{t('Unsaved workspace changes')}</p>}
        {message && <p role="status">{t(message)}</p>}
        {error && (
          <p role="alert" className="error">
            {t(error)}
          </p>
        )}
      </section>
      <section className="card demo-comparison">
        <span className="eyebrow">{t('02 / SHARED ASSET INSPECTION')}</span>
        <h2>{t('Synchronized 3D comparison')}</h2>
        <p className="notice">
          {t(library.geometry)}.{' '}
          {t(
            'Current styles are manually chosen reference assets. Hidden surfaces are generic inferred mannequin geometry; no client likeness is claimed.',
          )}
        </p>
        <div className="demo-current">
          <label>
            {t('Current hairstyle reference')}
            <select
              value={state.currentHairId}
              onChange={(e) => change({ currentHairId: e.target.value })}
            >
              <option value="none">{t('No hairstyle asset')}</option>
              {library.hair.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(s.label)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Current beardstyle reference')}
            <select
              value={state.currentBeardId}
              onChange={(e) => change({ currentBeardId: e.target.value })}
            >
              <option value="clean-shaven">{t('Clean-shaven')}</option>
              {library.beard.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(s.label)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="demo-angle-controls">
          {angles.map((a) => (
            <button
              className="button ghost"
              type="button"
              key={a.name}
              onClick={() =>
                camera({ ...state.camera, azimuth: a.azimuth, elevation: 0.08 })
              }
            >
              {t(a.name)}
            </button>
          ))}
          <button
            className="button ghost"
            type="button"
            onClick={() =>
              camera({ azimuth: 0, elevation: 0.08, distance: 1.3 })
            }
          >
            {t('Reset view')}
          </button>
        </div>
        <p>
          {t(
            'Drag either view to rotate both. Scroll to zoom both, or use the shared controls.',
          )}
        </p>
        <label>
          {t('Shared rotation')}
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={(state.camera.azimuth * 180) / Math.PI}
            onChange={(e) =>
              camera({
                ...state.camera,
                azimuth: (Number(e.target.value) * Math.PI) / 180,
              })
            }
          />
        </label>
        <label>
          {t('Shared zoom')}
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.01}
            value={state.camera.distance}
            onChange={(e) =>
              camera({ ...state.camera, distance: Number(e.target.value) })
            }
          />
        </label>
        <div className="demo-view-pair">
          <DemoViewer
            title="Current reference assets"
            urls={currentURLs}
            camera={state.camera}
            onCamera={camera}
          />
          <DemoViewer
            title="Proposed reference assets"
            urls={proposedURLs}
            camera={state.camera}
            onCamera={camera}
          />
        </div>
        <div className="demo-catalog-pair">
          <Catalog
            kind="hair"
            styles={library.hair}
            value={state.hairId}
            onChange={(hairId) => change({ hairId })}
          />
          <Catalog
            kind="beard"
            styles={library.beard}
            value={state.beardId}
            onChange={(beardId) => change({ beardId })}
          />
        </div>
      </section>
      <section className="card demo-saved">
        <span className="eyebrow">{t('03 / RETAIN AND REOPEN')}</span>
        <h2>{t('Explored asset options')}</h2>
        <p>
          {t(
            'Save the selected meshes, shared camera, candidate and input set. These mannequin explorations are not selected client expected results.',
          )}
        </p>
        <form
          className="demo-actions"
          onSubmit={(e) => {
            e.preventDefault()
            action(async () => {
              const saved = await api<DemoOption>(
                `${base}/demo-options`,
                json('POST', { title, state }),
              )
              setState(saved.state)
              setTitle('')
              await cache.invalidateQueries({
                queryKey: ['demo-options', clientId],
              })
              setMessage('Explored asset option saved.')
            })
          }}
        >
          <label>
            {t('Option title')}
            <input
              minLength={2}
              maxLength={160}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <button className="button secondary" disabled={busy}>
            {t('Save explored option')}
          </button>
        </form>
        {options.data
          ?.filter((o) => o.candidate === state.candidate)
          .map((o) => (
            <article className="demo-option" key={o.id}>
              <div>
                <strong>{o.title}</strong>
                <p>
                  {t(o.geometry)} · {dateLabel(o.createdAt, locale)}
                </p>
                <small>
                  {o.state.hairId} + {o.state.beardId}
                </small>
              </div>
              <button
                className="button secondary"
                type="button"
                onClick={() => reopen(o)}
              >
                {t('Reopen option')}
              </button>
            </article>
          ))}
        {options.error && <p className="error">{options.error.message}</p>}
      </section>
      <section className="card demo-jobs">
        <span className="eyebrow">{t('04 / PROCESSING AND EVIDENCE')}</span>
        <h2>{t('Retained local experiments')}</h2>
        {jobs.data
          ?.filter((j) => j.candidate === state.candidate)
          .map((j) => (
            <article className="demo-job" key={j.id}>
              <div className="section-toolbar">
                <div>
                  <span className={`status ${j.status}`}>{t(j.status)}</span>{' '}
                  <strong>{t('Six-view input check')}</strong>
                  <p>
                    {dateLabel(j.createdAt, locale)} · {j.progress}% ·{' '}
                    {t('Minimum image width')}: {j.settings.minimumWidth}
                  </p>
                </div>
                {j.status !== 'cancelled' && (
                  <button
                    className="button ghost"
                    type="button"
                    onClick={() =>
                      action(async () => {
                        await api(`${base}/demo-jobs/${j.id}/cancel`, {
                          method: 'POST',
                        })
                        await cache.invalidateQueries({
                          queryKey: ['demo-jobs', clientId],
                        })
                      })
                    }
                  >
                    {t(
                      j.status === 'completed' || j.status === 'failed'
                        ? 'Remove experiment output'
                        : 'Cancel processing',
                    )}
                  </button>
                )}
              </div>
              {j.error && (
                <p role="alert" className="error">
                  {j.error}
                </p>
              )}
              {j.result.geometry && (
                <p className="notice">{t(j.result.geometry)}</p>
              )}
              {j.result.inputs && (
                <details open>
                  <summary>
                    {t('Actual verification results')} · {j.result.elapsedMs} ms
                  </summary>
                  <p>{t(j.result.scope || '')}</p>
                  <div className="demo-table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('View')}</th>
                          <th>{t('Dimensions')}</th>
                          <th>{t('Brightness')}</th>
                          <th>{t('Edge contrast')}</th>
                          <th>{t('Findings')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {j.result.inputs.map((i) => (
                          <tr key={i.view}>
                            <td>{t(i.view)}</td>
                            <td>
                              {i.width} × {i.height}
                            </td>
                            <td>{i.meanBrightness}</td>
                            <td>{i.edgeContrast}</td>
                            <td>
                              {i.warnings.map(t).join('; ') ||
                                t('No diagnostic warning')}
                              <details>
                                <summary>SHA-256</summary>
                                <code>{i.sha256}</code>
                              </details>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </article>
          ))}
        {!jobs.data?.some((j) => j.candidate === state.candidate) && (
          <p>{t('No experiments retained for this candidate yet.')}</p>
        )}
        {jobs.error && <p className="error">{jobs.error.message}</p>}
      </section>
    </div>
  )
}
