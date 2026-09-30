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
const componentDefaults = { sourceRunId: '', triangleRatio: .75, voxelSize: .003, samplePoints: 12000 }
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
function historicalNativeFit(job: DemoJob | undefined) {
  if (!job) return false
  if (job.kind === 'process') return job.result.component?.processingVersion === 'open3d-cpu-upstream-v1'
  if (job.kind !== 'fit') return false
  const versions: Record<string,string> = { 'blender-mpfb': 'mpfb-metre-z-up-v2', makehuman: 'makehuman-metre-z-up-v2', flame: 'flame-2023-open-neutral-rig-v4' }
  return !!versions[job.candidate] && job.result.fit?.basisVersion !== versions[job.candidate]
}
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
        (j) => (j.id === state.modelRunId || j.id === state.component?.sourceRunId) && j.status === 'cancelled',
      )
    ) {
      setState(undefined)
      setVersion(0)
      cache.invalidateQueries({ queryKey: ['demo-workspace', clientId] })
      cache.invalidateQueries({ queryKey: ['demo-options', clientId] })
    }
  }, [state?.modelRunId, state?.component?.sourceRunId, jobs.data, cache, clientId])
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
      j.id === state.modelRunId && (j.kind === 'fit' || j.kind === 'process') && j.status === 'completed',
  )
  const fitted = !!state.modelRunId
  const artifactURL = (jobId: string, kind: string, id: string) =>
    `/api${base}/demo-jobs/${jobId}/artifacts/${kind}/${id}`
  const headURL = fitted
    ? artifactURL(state.modelRunId, 'head', 'model')
    : library.headUrl
  const nativeSettings = state.native || nativeDefaults
  const fitRoute = ({
    'blender-mpfb': { settings: 'MPFB fitting settings', button: 'Fit head locally with MPFB', job: 'MPFB head fitting experiment' },
    makehuman: { settings: 'MakeHuman fitting settings', button: 'Fit head locally with MakeHuman', job: 'Standalone MakeHuman head fitting experiment' },
    flame: { settings: 'FLAME Open fitting settings', button: 'Fit head locally with FLAME Open', job: 'FLAME 2023 Open head fitting experiment' },
  } as Record<string, { settings: string; button: string; job: string }>)[candidate.id]
  const componentRoute = ({
    open3d: { settings: 'Open3D supporting processing settings', button: 'Process upstream head locally with Open3D', job: 'Open3D upstream head processing experiment', description: 'Process a retained native fitted head with Open3D CPU. Mesh cleanup, decimation, point filtering and synthetic rigid-transform recovery are evaluated against the upstream fitted geometry. Open3D does not reconstruct a head from these photos.' },
    meshlab: { settings: 'MeshLab supporting processing settings', button: 'Process upstream head locally with MeshLab', job: 'MeshLab upstream head processing experiment', description: 'Apply actual MeshLab cleanup, edge repair, simplification and conversion to an identified fitted head. Inspect native bidirectional distance samples and topology changes. MeshLab does not reconstruct a head from these photos.' },
  } as Record<string,{settings:string;button:string;job:string;description:string}>)[candidate.id]
  const componentSettings = state.component || componentDefaults
  const upstreamJobs = jobs.data?.filter((j) => (j.kind === 'fit' || j.kind === 'process') && j.status === 'completed' && j.result.head && (!j.result.targetBasisCheck || j.result.targetBasisCheck.passed)) || []
  const nativeFit = !!fitRoute
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
              change({ candidate: e.target.value, modelRunId: '', component: componentDefaults })
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
            nativeFit
              ? 'Local fitting experiment available'
              : componentRoute ? 'Local supporting processing available'
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
            componentRoute ? componentRoute.description
              : candidate.id === 'flame'
              ? 'Fit the exact FLAME 2023 Open identity basis locally with a neutral expression and rig. Shared styles are attached with an approximate radial cage. Hidden surfaces, texture likeness and professional assessment remain explicit limitations.'
              : candidate.id === 'makehuman'
              ? 'Run standalone MakeHuman target fitting and native hair refitting without Blender. The CPU renders and retained parameters show a fitted template, with inferred hidden surfaces and pending professional likeness review.'
              : candidate.id === 'blender-mpfb'
              ? 'Run the MPFB fitting experiment, inspect its retained evidence and select a completed fitted head. Hidden surfaces remain inferred and professional likeness review is pending.'
              : candidate.id === 'colmap'
                ? 'Run real SIFT extraction, exhaustive matching and three bounded mapping trials on the same six photos. Failed coverage and partial observations are retained. A mannequin does not count as a reconstructed head.'
              : 'This workspace currently runs shared input diagnostics and real mannequin asset inspection. These are not candidate reconstruction or fitting results.',
          )}
        </p>
        {(candidate.id === 'flame' || modelJob?.result.component?.upstream.candidate === 'flame') && <p className="notice">
          FLAME 2023 Open · Max Planck Institute for Intelligent Systems / Max-Planck-Gesellschaft ·{' '}
          <a href="https://flame.is.tue.mpg.de/modellicense.html" target="_blank" rel="noreferrer">{t('Model terms')}</a> ·{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC-BY-4.0</a> ·{' '}
          <a href="https://doi.org/10.1145/3130800.3130813" target="_blank" rel="noreferrer">Li, Bolkart, Black, Li &amp; Romero (2017)</a>.
          {' '}{t('Changes: bounded identity fitting, coordinate conversion, procedural eye materials, shared style attachment and export. Additional published model usage terms apply. Synthetic examples are labeled simulations.')}
        </p>}
        <label>
          {t('Authorized photo set')}
          <select
            value={state.photoSetId}
            onChange={(e) =>
              change({
                photoSetId: e.target.value,
                photoViews: {},
                modelRunId: '',
                component: { ...componentSettings, sourceRunId: '' },
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
        {nativeFit && (
          <fieldset className="demo-native-settings">
            <legend>{t(fitRoute.settings)}</legend>
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
                    'Local fitting queued. The retained experiment shows failures and inferred coverage.',
                  )
                })
              }
            >
              {t(fitRoute.button)}
            </button>
          </fieldset>
        )}
        {componentRoute && <fieldset className="demo-native-settings">
          <legend>{t(componentRoute.settings)}</legend>
          <label>{t('Upstream native head experiment')}
            <select value={componentSettings.sourceRunId} onChange={(e) => {
              const parent = upstreamJobs.find((j) => j.id === e.target.value)
              change({ component: { ...componentSettings, sourceRunId: e.target.value }, modelRunId: '', ...(parent ? { photoSetId: parent.photoSetId, photoViews: parent.photoViews, native: parent.settings.native || nativeDefaults } : {}) })
            }}>
              <option value="">{t('Select a completed native head')}</option>
              {upstreamJobs.map((j) => <option key={j.id} value={j.id}>{library.candidates.find((c) => c.id === j.candidate)?.name} · {dateLabel(j.createdAt, locale)} · {j.result.fit?.basisVersion || j.result.component?.processingVersion || ''} · {j.id}{historicalNativeFit(j) ? ' · '+t('Historical experiment with known limitations') : ''}</option>)}
            </select>
          </label>
          {historicalNativeFit(upstreamJobs.find((j) => j.id === componentSettings.sourceRunId)) && <p className="error">{t('Historical upstream experiment has known fitting or shading limitations. Supporting processing does not repair those limitations.')}</p>}
          <p>{t('The selected upstream experiment and its same six photos remain live dependencies. Removing its output cancels processing and removes all derived copies and saved options. Hair and beard assets retain the upstream adaptation and licenses.')}</p>
          {([
            ['triangleRatio', 'Retained triangle fraction', .25, 1, .05],
            ['voxelSize', 'Diagnostic voxel size (m)', .001, .01, .001],
            ['samplePoints', candidate.id === 'meshlab' ? 'Maximum vertex distance samples per direction' : 'Sampled diagnostic points', 2000, 50000, 1000],
          ] as const).filter(([key]) => candidate.id === 'open3d' || key !== 'voxelSize').map(([key,label,min,max,step]) => <label key={key}>{t(label)}<input type="number" min={min} max={max} step={step} value={componentSettings[key]} onChange={(e) => change({ component: { ...componentSettings, [key]: Number(e.target.value) } })}/></label>)}
          {candidate.id === 'meshlab' && <p>{t('Repair splits non-manifold edges without deleting faces. Simplification preserves topology, boundaries and normals; missing surfaces are not filled. Distance sampling uses up to the requested number of actual vertices in each direction.')}</p>}
          <button className="button primary" disabled={busy || !componentSettings.sourceRunId || !selectedSet || !!selectedSet.missing.length} onClick={() => action(async () => {
            await api(`${base}/demo-jobs`, json('POST', { candidate: state.candidate, kind: 'process', photoSetId: state.photoSetId, photoViews: state.photoViews || {}, minimumWidth: state.minimumWidth, native: nativeSettings, component: componentSettings }))
            await cache.invalidateQueries({ queryKey: ['demo-jobs', clientId] })
            setMessage('Local supporting processing queued. Inspect actual upstream geometry and processing evidence.')
          })}>{t(componentRoute.button)}</button>
        </fieldset>}
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
        {modelJob?.candidate === 'blender-mpfb' && modelJob.result.fit?.basisVersion !== 'mpfb-metre-z-up-v2' && (
          <p className="notice">{t('Historical MPFB fit: its optimization basis used incorrect target units and axes. Retained for history; use a corrected experiment for evaluation.')}</p>
        )}
        {modelJob?.candidate === 'flame' && modelJob.result.fit?.basisVersion !== 'flame-2023-open-neutral-rig-v4' && <p className="error" role="alert">{t('Historical FLAME experiment: earlier coordinate alignment or style attachment has known limitations. Retained for comparison; use the latest validated experiment for evaluation.')}</p>}
        {modelJob?.result.component?.processingVersion === 'open3d-cpu-upstream-v1' && <p className="error">{t('Historical Open3D result welded a neck-cap normal seam and has a known shading regression. Use a seam-preserving result for evaluation.')}</p>}
        <p className="notice">
          {t(
            fitted && componentRoute ? 'Processed upstream fitted head. Native mesh measurements do not verify likeness or measured surface coverage.'
              : fitted
              ? 'Head fitted to detected image landmarks. Entire surface is fitted or inferred; no measured 3D surface or verified likeness is claimed.'
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
                      j.kind === 'process' ? componentRoute?.job || 'Upstream head processing experiment'
                        : j.kind === 'fit'
                        ? fitRoute?.job || 'Head fitting experiment'
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
              {j.candidate === 'blender-mpfb' && j.result.fit && j.result.fit.basisVersion !== 'mpfb-metre-z-up-v2' && (
                <p className="notice">{t('Historical MPFB fit: its optimization basis used incorrect target units and axes. Retained for history; use a corrected experiment for evaluation.')}</p>
              )}
              {j.candidate === 'flame' && j.result.fit && j.result.fit.basisVersion !== 'flame-2023-open-neutral-rig-v4' && <p className="error">{t('Historical FLAME experiment: earlier coordinate alignment or style attachment has known limitations. Retained for comparison; use the latest validated experiment for evaluation.')}</p>}
              {j.result.targetBasisCheck && (
                <p>{t('Native target-basis validation')}: {j.result.targetBasisCheck.mappedVertices} {t('vertices')} · {t('Maximum prediction error')} {(j.result.targetBasisCheck.maximumErrorMetres * 1000000).toFixed(2)} µm · {t(j.result.targetBasisCheck.passed ? 'passed' : 'failed')}</p>
              )}
              {j.error && (
                <p role="alert" className="error">
                  {j.error}
                </p>
              )}
              {j.result.geometry && (
                <p className="notice">{t(j.result.geometry)}</p>
              )}
              {(j.kind === 'fit' || j.kind === 'reconstruct' || j.kind === 'process') && (
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
                          component: j.settings.component || componentDefaults,
                        })
                      }
                    >
                      {t(j.kind === 'process' ? 'Inspect this processed head' : 'Inspect this fitted head')}
                    </button>
                  )}
                  {j.result.failure?.error && (
                    <p className="error">{j.result.failure.error}</p>
                  )}
                  {j.result.component && <>
                    {j.result.component.processingVersion === 'open3d-cpu-upstream-v1' && <p className="error">{t('Historical Open3D result welded a neck-cap normal seam and has a known shading regression. Use a seam-preserving result for evaluation.')}</p>}
                    {historicalNativeFit(jobs.data?.find((source) => source.id === j.result.component?.upstream.runId)) && <p className="error">{t('Historical upstream experiment has known fitting or shading limitations. Supporting processing does not repair those limitations.')}</p>}
                    <p><strong>{candidate.name} {j.result.component.version}</strong> {j.result.component.engineVersion} · {t('Upstream route')}: {library.candidates.find((c) => c.id === j.result.component?.upstream.candidate)?.name} · <code>{j.result.component.upstream.runId}</code></p>
                    <p>{t('Triangles')}: {j.result.component.mesh.before.triangles} → {j.result.component.mesh.after.triangles} · {t('Vertices')}: {j.result.component.mesh.before.vertices} → {j.result.component.mesh.after.vertices}</p>
                    <p>{t('Deviation from upstream fitted surface')}: {t('mean')} {(j.result.component.mesh.deviation.upstreamVerticesToProcessedSurface.meanMetres*1000).toFixed(4)} mm · {t('maximum')} {(j.result.component.mesh.deviation.upstreamVerticesToProcessedSurface.maximumMetres*1000).toFixed(4)} mm</p>
                    {j.result.component.pointProcessing && <p>{t('Diagnostic points')}: {j.result.component.pointProcessing.sampled} → {j.result.component.pointProcessing.voxelized} → {j.result.component.pointProcessing.retainedAfterOutlierFilter}. {j.result.component.pointProcessing.role}</p>}
                    {j.result.component.alignment && <p>{j.result.component.alignment.input}</p>}
                    {j.result.component.processingVersion === 'open3d-cpu-upstream-v5' ? <p>{[['sampled-cloud','Sampled upstream cloud'],['filtered-cloud','Filtered diagnostic cloud'],['processed-skin','Processed skin mesh']].map(([id,label]) => <a style={{marginRight:'1rem'}} key={id} href={artifactURL(j.id,'geometry',id)}>{t(label)} (PLY)</a>)}</p> : j.result.component.processingVersion === 'meshlab-native-upstream-v1' ? <p><a href={artifactURL(j.id,'geometry','processed-skin')}>{t('Processed skin mesh')} (PLY)</a></p> : <p className="notice">{t('Historical PLY exports have not passed native-reader compatibility checks. Use the current verified processing version for downloads.')}</p>}
                    {j.result.component.alignment && <p>ICP {t('fitness')}: {j.result.component.alignment.fitness.toFixed(6)} · RMSE {(j.result.component.alignment.inlierRmseMetres*1000).toFixed(6)} mm · {t('Recovered-point maximum error')} {(j.result.component.alignment.recoveredPointMaximumErrorMetres*1000).toFixed(6)} mm · {j.result.component.alignment.actualIterations !== undefined ? `${j.result.component.alignment.actualIterations} / ` : ''}{j.result.component.alignment.maximumIterations} {t('actual / maximum iterations')}</p>}
                    {j.result.component.alignment?.iterations && <details><summary>{t('Actual registration iterations')}</summary>{j.result.component.alignment.iterations.map((i) => <p key={i.iteration}>{i.iteration+1}: {t('fitness')} {i.fitness.toFixed(6)} · RMSE {(i.inlierRmseMetres*1000).toFixed(6)} mm</p>)}</details>}
                    {j.result.component.filters && <details open><summary>{t('Actual MeshLab filters and topology changes')}</summary>{j.result.component.filters.map((f,i) => <p key={i}><code>{f.filter}</code>: {f.before.vertices} → {f.after.vertices} {t('Vertices')}, {f.before.triangles} → {f.after.triangles} {t('Triangles')} · {f.seconds}s · {JSON.stringify(f.parameters)}</p>)}<pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify({topology:j.result.component.topology,distanceSamples:j.result.component.measurements,conversion:j.result.component.conversion},null,2)}</pre></details>}
                    <figure><img style={{maxWidth:'100%'}} src={artifactURL(j.id,'evaluation','geometry')} alt={t('Actual supporting mesh processing evaluation')} loading="lazy"/><figcaption>{t('Measurements compare retained fitted geometry. No independent scan or real-client accuracy evidence.')}</figcaption></figure>
                    {j.result.component.limitations.map((l) => <p key={l}>{l}</p>)}
                    <details><summary>{t('Upstream license and change notices')}</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(j.result.component.provenance,null,2)}</pre></details>
                  </>}
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
