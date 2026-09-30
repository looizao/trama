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
const nativeDefaults = {
  focalLength: 70,
  cameraDistance: 1.6,
  cameraHeight: 0.04,
  fitRounds: 4,
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
  fitted = false,
}: {
  kind: 'hair' | 'beard'
  styles: DemoStyle[]
  value: string
  onChange: (id: string) => void
  fitted?: boolean
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
          native: nativeDefaults,
        },
      )
      setVersion(workspace.data.version)
    }
  }, [state, authorized, workspace.data, sets.data, library])
  useEffect(() => {
    if (
      state?.modelRunId &&
      jobs.data?.some(
        (j) => j.id === state.modelRunId && j.status === 'cancelled',
      )
    ) {
      setState(undefined)
      setVersion(0)
      cache.invalidateQueries({ queryKey: ['demo-workspace', clientId] })
      cache.invalidateQueries({ queryKey: ['demo-options', clientId] })
    }
  }, [state?.modelRunId, jobs.data, cache, clientId])
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
    setState({
      ...option.state,
      native: option.state.native?.focalLength
        ? option.state.native
        : nativeDefaults,
    })
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
  const modelJob = jobs.data?.find(
    (j) =>
      j.id === state.modelRunId && j.kind === 'fit' && j.status === 'completed',
  )
  const fitted = !!state.modelRunId
  const artifactURL = (jobId: string, kind: string, id: string) =>
    `/api${base}/demo-jobs/${jobId}/artifacts/${kind}/${id}`
  const headURL = fitted
    ? artifactURL(state.modelRunId, 'head', 'model')
    : library.headUrl
  const nativeSettings = state.native || nativeDefaults
  const resolve = (styles: DemoStyle[], id: string, current: string) => {
    const chosen = id === 'keep-current' ? current : id
    return styles.find((s) => s.id === chosen)
      ? fitted
        ? artifactURL(
            state.modelRunId,
            styles === library.hair ? 'hair' : 'beard',
            chosen,
          )
        : styles.find((s) => s.id === chosen)?.modelUrl
      : undefined
  }
  const currentURLs = [
    headURL,
    resolve(library.hair, state.currentHairId, ''),
    resolve(library.beard, state.currentBeardId, ''),
  ].filter(Boolean) as string[]
  const proposedURLs = [
    headURL,
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
            onChange={(e) =>
              change({ candidate: e.target.value, modelRunId: '' })
            }
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
          {t(
            candidate.id === 'blender-mpfb'
              ? 'Local fitting experiment available'
              : candidate.id === 'colmap'
                ? 'Local reconstruction experiment available'
              : 'Candidate processing pending',
          )}
        </p>
        {candidate.dependency && (
          <p className="notice">{t(candidate.dependency)}</p>
        )}
        <p>
          {t(
            candidate.id === 'blender-mpfb'
              ? 'Run the MPFB fitting experiment, inspect its retained evidence and select a completed fitted head. Hidden surfaces remain inferred and professional likeness review is pending.'
              : candidate.id === 'colmap'
                ? 'Run real SIFT extraction, exhaustive matching and three bounded mapping trials on the same six photos. Failed coverage and partial observations are retained. A mannequin does not count as a reconstructed head.'
              : 'This workspace currently runs shared input diagnostics and real mannequin asset inspection. These are not candidate reconstruction or fitting results.',
          )}
        </p>
        <label>
          {t('Authorized photo set')}
          <select
            value={state.photoSetId}
            onChange={(e) =>
              change({
                photoSetId: e.target.value,
                photoViews: {},
                modelRunId: '',
              })
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
        {candidate.id === 'blender-mpfb' && (
          <fieldset className="demo-native-settings">
            <legend>{t('MPFB fitting settings')}</legend>
            <p>
              {t(
                'Assumed capture cameras: six labeled yaw angles, 36 mm sensor and shared focal length, distance and height. These values are not measured calibration. Inspect and adjust them for each capture.',
              )}
            </p>
            {(
              [
                ['focalLength', 'Focal length (mm)', 20, 200, 1],
                ['cameraDistance', 'Capture distance (m)', 0.5, 3, 0.05],
                [
                  'cameraHeight',
                  'Camera height above head center (m)',
                  -0.2,
                  0.3,
                  0.01,
                ],
                ['fitRounds', 'Fitting rounds', 1, 6, 1],
              ] as const
            ).map(([key, label, min, max, step]) => (
              <label key={key}>
                {t(label)}
                <input
                  type="number"
                  min={min}
                  max={max}
                  step={step}
                  value={nativeSettings[key]}
                  onChange={(e) =>
                    change({
                      native: {
                        ...nativeSettings,
                        [key]: Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            ))}
            <button
              className="button primary"
              disabled={busy || !selectedSet || !!selectedSet.missing.length}
              onClick={() =>
                action(async () => {
                  await api(
                    `${base}/demo-jobs`,
                    json('POST', {
                      candidate: state.candidate,
                      kind: 'fit',
                      photoSetId: state.photoSetId,
                      photoViews: state.photoViews || {},
                      minimumWidth: state.minimumWidth,
                      native: nativeSettings,
                    }),
                  )
                  await cache.invalidateQueries({
                    queryKey: ['demo-jobs', clientId],
                  })
                  setMessage(
                    'Local MPFB fitting queued. The retained experiment shows failures and inferred coverage.',
                  )
                })
              }
            >
              {t('Fit head locally with MPFB')}
            </button>
          </fieldset>
        )}
        {candidate.id === 'colmap' && (
          <fieldset className="demo-native-settings">
            <legend>{t('COLMAP reconstruction settings')}</legend>
            <label>
              {t('Reconstruction preset')}
              <select value={state.colmapPreset || 'standard'} onChange={(e) => change({ colmapPreset: e.target.value })}>
                <option value="standard">{t('Standard SIFT / unknown calibration')}</option>
                <option value="sensitive-calibrated">{t('Sensitive affine SIFT / declared calibration')}</option>
              </select>
            </label>
            <p>{t('CPU processing, 8192 feature limit, exhaustive 15 image pairs, three mapping trials with progressively relaxed initialization. Six images remain the entire capture.')}</p>
            {state.colmapPreset === 'sensitive-calibrated' && (
              <label>{t('Focal length (mm)')}
                <input type="number" min={20} max={200} value={nativeSettings.focalLength} onChange={(e) => change({ native: { ...nativeSettings, focalLength: Number(e.target.value) } })} />
                <span>{t('Declared 36 mm sensor, square pixels and zero distortion. This is an assumption, not measured calibration.')}</span>
              </label>
            )}
            <button className="button primary" disabled={busy || !selectedSet || !!selectedSet.missing.length} onClick={() => action(async () => {
              await api(`${base}/demo-jobs`, json('POST', { candidate: 'colmap', kind: 'reconstruct', photoSetId: state.photoSetId, photoViews: state.photoViews || {}, minimumWidth: state.minimumWidth, native: nativeSettings, colmapPreset: state.colmapPreset || 'standard' }))
              await cache.invalidateQueries({ queryKey: ['demo-jobs', clientId] })
              setMessage('Local COLMAP reconstruction queued. Inspect actual matching and mapping evidence.')
            })}>{t('Reconstruct six views locally with COLMAP')}</button>
          </fieldset>
        )}
        {dirty && <p className="notice">{t('Unsaved workspace changes')}</p>}
        {message && <p role="status">{t(message)}</p>}
        {error && (
          <p role="alert" className="error">
            {t(error)}
          </p>
        )}
      </section>
      <section className="card demo-comparison">
        <span className="eyebrow">
          {t(
            fitted
              ? '02 / FITTED HEAD INSPECTION'
              : '02 / SHARED ASSET INSPECTION',
          )}
        </span>
        <h2>{t('Synchronized 3D comparison')}</h2>
        <p className="notice">
          {t(
            fitted
              ? 'MPFB head fitted to detected image landmarks. Entire surface is fitted or inferred; no measured 3D surface or verified likeness is claimed.'
              : library.geometry,
          )}
          {fitted ? ' ' : '. '}
          {t(
            fitted
              ? 'Hair and beard assets are refitted independently to this head. Current styles remain manually chosen references. Inspect clipping and missing likeness.'
              : 'Current styles are manually chosen reference assets. Hidden surfaces are generic inferred mannequin geometry; no client likeness is claimed.',
          )}
        </p>
        <button
          className="button ghost"
          disabled={!fitted}
          onClick={() => change({ modelRunId: '' })}
        >
          {t('Inspect shared mannequin')}
        </button>
        {fitted && !modelJob && (
          <p role="status">
            {t(
              'Selected fitted result is loading or unavailable. Reopen a retained model before saving.',
            )}
          </p>
        )}
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
            fitted={fitted}
            kind="hair"
            styles={library.hair}
            value={state.hairId}
            onChange={(hairId) => change({ hairId })}
          />
          <Catalog
            fitted={fitted}
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
                  <strong>
                    {t(
                      j.kind === 'fit'
                        ? 'MPFB head fitting experiment'
                        : j.kind === 'reconstruct'
                          ? 'COLMAP six-view reconstruction experiment'
                        : 'Six-view input check',
                    )}
                  </strong>
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
                        if (state.modelRunId === j.id) {
                          setState(undefined)
                          setVersion(0)
                          await cache.invalidateQueries({
                            queryKey: ['demo-workspace', clientId],
                          })
                          await cache.invalidateQueries({
                            queryKey: ['demo-options', clientId],
                          })
                        }
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
              {(j.kind === 'fit' || j.kind === 'reconstruct') && (
                <>
                  <p>{t(j.result.scope || '')}</p>
                  {j.status === 'completed' && j.result.head && (
                    <button
                      className="button primary"
                      onClick={() =>
                        change({
                          modelRunId: j.id,
                          photoSetId: j.photoSetId,
                          photoViews: j.photoViews || {},
                          native: j.settings.native || nativeDefaults,
                        })
                      }
                    >
                      {t('Inspect this fitted head')}
                    </button>
                  )}
                  {j.result.failure?.error && (
                    <p className="error">{j.result.failure.error}</p>
                  )}
                  {j.result.reconstruction && (
                    <>
                      <p>PyCOLMAP {j.result.reconstruction.version} · {j.settings.colmapPreset} · {j.result.reconstruction.elapsedMs} ms · {(j.result.reconstruction.retainedBytes / 1048576).toFixed(1)} MiB</p>
                      <p className="notice">{j.result.reconstruction.denseStatus}</p>
                      <div className="demo-table-scroll"><table>
                        <thead><tr><th>{t('View')}</th><th>{t('Detected features')}</th></tr></thead>
                        <tbody>{j.result.reconstruction.features.map((f) => <tr key={f.view}><td>{t(f.view)}</td><td>{f.features}</td></tr>)}</tbody>
                      </table></div>
                      <figure><img style={{ maxWidth: '100%' }} src={artifactURL(j.id, 'evaluation', 'matches')} alt={t('Actual COLMAP verified-match graph')} loading="lazy" /><figcaption>{t('Verified feature matches do not establish head coverage or likeness.')}</figcaption></figure>
                      <details><summary>{t('Matching and mapping trials')}</summary>
                        {j.result.reconstruction.pairs.map((pair) => <p key={pair.first + pair.second}>{t(pair.first)} / {t(pair.second)}: {pair.verifiedMatches}</p>)}
                        {j.result.reconstruction.trials.map((trial) => <p key={trial.index}>{t('Trial')} {trial.index + 1}: {trial.initialMinimumInliers} {t('minimum inliers')}, {trial.initialMinimumAngleDegrees}° · {trial.models.length} {t('retained sparse models')}{trial.models.map((model) => <span key={model.model}> · {model.points3D} {t('observed points')} / {model.registeredViews.map(t).join(', ')} / {model.meanReprojectionErrorPixels.toFixed(2)} px</span>)}</p>)}
                      </details>
                      <details open><summary>{t('Unmet reconstruction requirements')}</summary>{j.result.reconstruction.unmetRequirements.map((requirement) => <p key={requirement}>{requirement}</p>)}</details>
                      {j.result.reconstruction.limitations.map((limitation) => <p key={limitation}>{limitation}</p>)}
                      <details><summary>{t('Processing resources')}</summary><p>{j.result.reconstruction.resourceMeasurement}</p>{j.result.reconstruction.resources.map((r) => <p key={r.stage}>{r.stage}: {r.seconds}s · {r.cpuSeconds} CPU s · {(r.peakRssKiB / 1024).toFixed(1)} MiB</p>)}</details>
                    </>
                  )}
                  {j.result.fit && (
                    <>
                      <p>
                        {t('Paired image landmarks')}:{' '}
                        {j.result.fit.pairedLandmarks} ·{' '}
                        {t(
                          'Mean landmark error after framing alignment (pixels)',
                        )}
                        : {j.result.fit.meanLandmarkErrorPixels.toFixed(2)} ·{' '}
                        {t('Evaluations')}: {j.result.fit.evaluations}.{' '}
                        {t('Landmark agreement does not verify likeness.')}
                      </p>
                      <div className="demo-table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>{t('View')}</th>
                              <th>{t('Paired landmarks')}</th>
                              <th>{t('Findings')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {j.result.fit.views.map((v) => (
                              <tr key={v.view}>
                                <td>{t(v.view)}</td>
                                <td>{v.matchedLandmarks}</td>
                                <td>
                                  {v.limitation ||
                                    t(
                                      'Detected 2D landmarks; model depth excluded',
                                    )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <details>
                        <summary>
                          {t('Fitting iterations and limitations')}
                        </summary>
                        {j.result.fit.iterations.map((i) => (
                          <p key={i.iteration}>
                            {i.iteration}: {i.loss.toExponential(5)}
                          </p>
                        ))}
                        {j.result.fit.limitations.map((l) => (
                          <p key={l}>{l}</p>
                        ))}
                      </details>
                      <div className="demo-photo-strip">
                        {j.result.fit.views.map((v) => (
                          <figure key={v.view}>
                            <img
                              src={artifactURL(j.id, 'landmarks', v.view)}
                              alt={`${t(v.view)} / ${t('Detected image landmarks')}`}
                              loading="lazy"
                            />
                            <figcaption>
                              {t(v.view)} · {v.matchedLandmarks}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                      <details>
                        <summary>{t('Fitted head renders')}</summary>
                        <div className="demo-photo-strip">
                          {views.map((v) => (
                            <figure key={v}>
                              <img
                                src={artifactURL(j.id, 'render', v)}
                                alt={`${t(v)} / ${t('Fitted head')}`}
                                loading="lazy"
                              />
                              <figcaption>{t(v)}</figcaption>
                            </figure>
                          ))}
                        </div>
                      </details>
                    </>
                  )}
                  {j.result.resources && (
                    <div className="demo-table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>{t('Stage')}</th>
                            <th>{t('Seconds')}</th>
                            <th>{t('CPU seconds')}</th>
                            <th>{t('Peak child memory so far (MiB)')}</th>
                            <th>{t('Exit code')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {j.result.resources.map((r) => (
                            <tr key={r.stage}>
                              <td>{r.stage}</td>
                              <td>{r.seconds}</td>
                              <td>{r.cpuSeconds}</td>
                              <td>{(r.peakRssKiB / 1024).toFixed(1)}</td>
                              <td>{r.exitCode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!!j.result.retainedBytes && (
                    <p>
                      {t('Retained output')}:{' '}
                      {(j.result.retainedBytes / 1048576).toFixed(1)} MiB ·{' '}
                      {j.result.elapsedMs} ms
                    </p>
                  )}
                  {(j.status === 'completed' || j.status === 'failed') && (
                    <details>
                      <summary>{t('Retained processing diagnostics')}</summary>
                      {(j.result.diagnostics || []).map((k) => (
                        <p key={k}>
                          <a
                            href={artifactURL(j.id, 'diagnostic', k)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {k}
                          </a>
                        </p>
                      ))}
                    </details>
                  )}
                </>
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
