import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider, useNavigate } from '@tanstack/react-router'
import { api, json, imageURL, dateLabel, type User, type Client, type Milestone, type Asset, type Run, type AdminUser, type AuditEvent } from './api'
import { PreferencesProvider, usePreferences } from './i18n'
import './style.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 20_000, retry: false } } })

function useAction() {
  const cache = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run<T>(fn: () => Promise<T>, after?: (result: T) => void) {
    setBusy(true); setError('')
    try { const result = await fn(); await cache.invalidateQueries(); after?.(result); return result }
    catch (e) { setError((e as Error).message); return undefined }
    finally { setBusy(false) }
  }
  return { busy, error, run, setError }
}

function Banner({ text }: { text?: string }) { const { t } = usePreferences(); return text ? <div className="error" role="alert">{t(text)}</div> : null }
function Empty({ title, text }: { title: string; text: string }) { return <div className="empty"><div className="empty-mark">✳</div><h3>{title}</h3><p>{text}</p></div> }
function Loading() { const { t } = usePreferences(); return <div className="loading">{t("Loading workspace…")}</div> }

function PreferencesControls() {
  const { locale, setLocale, theme, setTheme, t } = usePreferences()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return <div className="preferences">
    <select aria-label={t('Language')} value={locale} onChange={e => setLocale(e.target.value as 'pt-BR' | 'en')}>
      <option value="pt-BR">Português (Brasil)</option><option value="en">English</option>
    </select>
    <button type="button" className="theme-toggle" aria-label={t(nextTheme === 'dark' ? 'Switch to dark theme' : 'Switch to light theme')} aria-pressed={theme === 'dark'} title={t(nextTheme === 'dark' ? 'Dark theme' : 'Light theme')} onClick={() => setTheme(nextTheme)}>
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span><span>{t(nextTheme === 'dark' ? 'Dark theme' : 'Light theme')}</span>
    </button>
  </div>
}

function Login() {
  const { t } = usePreferences()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const action = useAction()
  const nav = useNavigate()
  const cache = useQueryClient()
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await action.run(() => api('/login', json('POST', { email, password })), async () => { await cache.invalidateQueries({ queryKey: ['me'] }); nav({ to: '/clients' }) })
  }
  return <div className="login-page"><div className="login-art"><div className="brand brand-light"><span className="brand-mark">T</span><span>trama</span></div><div className="login-art-copy"><span className="eyebrow">{t("A space for possibility")}</span><h1>{t("Shape a look.")}<br/>{t("Explore new looks.")}</h1><p>{t("A considered workspace for visagism professionals and the people behind every transformation.")}</p></div><div className="art-lines" /></div><div className="login-panel"><div className="login-preferences"><PreferencesControls /></div><div className="login-card"><div className="mobile-brand brand"><span className="brand-mark">T</span><span>trama</span></div><span className="eyebrow">{t("Welcome back")}</span><h2>{t("Sign in to your studio")}</h2><p>{t("Continue working with your clients and their looks.")}</p><form onSubmit={submit}><label>{t("Email address")}<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>{t("Password")}<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label><Banner text={action.error} /><button className="button primary full" disabled={action.busy}>{t(action.busy ? 'Signing in…' : 'Sign in')}</button></form></div></div></div>
}

function Root() {
  const { t } = usePreferences()
  const { data: user, isPending } = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/me') })
  const cache = useQueryClient()
  if (isPending) return <Loading />
  if (!user) return <Login />
  return <div className="shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">T</span><span>trama</span></div><div className="sidebar-section">{t("WORKSPACE")}</div><nav><Link to="/clients" activeProps={{ className: 'active' }} className="nav-link"><span>◫</span> {t(" Clients")}</Link>{user.role === 'admin' && <Link to="/admin" activeProps={{ className: 'active' }} className="nav-link"><span>⚙</span> {t(" Administration")}</Link>}</nav><PreferencesControls /><div className="sidebar-bottom"><div className="avatar">{user.name.charAt(0).toUpperCase()}</div><div className="account"><strong>{user.name}</strong><small>{t(user.role)}</small></div><button className="icon-button" title={t("Sign out")} onClick={async () => { await api('/logout', { method: 'POST' }); cache.clear(); window.location.href = '/' }}>↗</button></div></aside><main className="main"><div className="mobile-top"><div className="brand"><span className="brand-mark">T</span><span>trama</span></div><div><Link to="/clients">{t("Clients")}</Link>{user.role === 'admin' && <Link to="/admin">{t("Admin")}</Link>}</div><PreferencesControls /></div><Outlet /></main></div>
}

const rootRoute = createRootRoute({ component: Root })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => { const nav = useNavigate(); useEffect(() => { nav({ to: '/clients' }) }, [nav]); return <Loading /> } })
const clientsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/clients', component: ClientsPage })
const clientRoute = createRoute({ getParentRoute: () => rootRoute, path: '/clients/$clientId', component: ClientPage })
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminPage })
const routeTree = rootRoute.addChildren([indexRoute, clientsRoute, clientRoute, adminRoute])
const router = createRouter({ routeTree })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }

function ClientsPage() {
  const { t, locale } = usePreferences()
  const clients = useQuery({ queryKey: ['clients'], queryFn: () => api<Client[]>('/clients') })
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const action = useAction()
  const nav = useNavigate()
  const filtered = clients.data?.filter(c => `${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase())) ?? []
  async function add(e: React.FormEvent) { e.preventDefault(); await action.run(() => api<Client>('/clients', json('POST', { name, email, notes })), c => { if (c) nav({ to: '/clients/$clientId', params: { clientId: c.id } }) }) }
  return <div className="page"><div className="page-heading"><div><span className="eyebrow">{t("YOUR STUDIO")}</span><h1>{t("Clients")}</h1><p>{t("Every person, every possibility, all in one place.")}</p></div><button className="button primary" onClick={() => setShowForm(v => !v)}>{t("+ New client")}</button></div>{showForm && <section className="card form-card"><h2>{t("Add a client")}</h2><form onSubmit={add} className="form-grid"><label>{t("Name")}<input value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={160} /></label><label>{t("Email (optional)")}<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label className="wide">{t("Private notes")}<textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></label><Banner text={action.error} /><div className="form-actions"><button type="button" className="button ghost" onClick={() => setShowForm(false)}>{t("Cancel")}</button><button className="button primary" disabled={action.busy}>{t("Create client")}</button></div></form></section>}<div className="section-toolbar"><h2>{t("Client directory ")}<span className="count">{clients.data?.length ?? 0}</span></h2><input className="search" placeholder={t("Search clients")} value={search} onChange={e => setSearch(e.target.value)} /></div>{clients.isPending ? <Loading /> : clients.error ? <Banner text={clients.error.message} /> : filtered.length ? <div className="client-grid">{filtered.map(c => <Link key={c.id} to="/clients/$clientId" params={{ clientId: c.id }} className="client-card"><div className="client-avatar">{c.name.charAt(0).toUpperCase()}</div><div><h3>{c.name}</h3><p>{c.email || t('No email added')}</p><small>{t("Added ")}{dateLabel(c.createdAt, locale)}</small></div><span className="arrow">↗</span></Link>)}</div> : <Empty title={t(search ? 'No matching clients' : 'Your first client starts here')} text={t(search ? 'Try another name or email.' : 'Create a client to begin exploring looks.')} />}</div>
}

function ClientPage() {
  const { t, locale } = usePreferences()
  const { clientId } = clientRoute.useParams()
  const client = useQuery({ queryKey: ['client', clientId], queryFn: () => api<Client>(`/clients/${clientId}`) })
  const assets = useQuery({ queryKey: ['assets', clientId], queryFn: () => api<Asset[]>(`/clients/${clientId}/assets`), refetchInterval: 8000 })
  const milestones = useQuery({ queryKey: ['milestones', clientId], queryFn: () => api<Milestone[]>(`/clients/${clientId}/milestones`) })
  const runs = useQuery({ queryKey: ['runs', clientId], queryFn: () => api<Run[]>(`/clients/${clientId}/runs`), refetchInterval: query => query.state.data?.some(r => r.status === 'queued' || r.status === 'running') ? 3000 : false })
  const models = useQuery({ queryKey: ['models'], queryFn: () => api<{ enabled: boolean; models: { id: string; name: string }[] }>('/models') })
  const [tab, setTab] = useState<'gallery' | 'timeline'>('gallery')
  const [sourceAssetId, setSourceAssetId] = useState('')
  const [prompt, setPrompt] = useState('')
  const [quantity, setQuantity] = useState(2)
  const [milestoneName, setMilestoneName] = useState('')
  const upload = useAction(), generation = useAction(), progress = useAction(), place = useAction()
  const sourceImages = assets.data?.filter(a => a.kind === 'source') ?? []
  useEffect(() => { if (!sourceAssetId && sourceImages.length) setSourceAssetId(sourceImages[0].id) }, [sourceAssetId, sourceImages])
  async function uploadImage(file?: File) { if (!file) return; const form = new FormData(); form.append('image', file); await upload.run(() => api(`/clients/${clientId}/assets`, { method: 'POST', body: form })) }
	async function generate(e: React.FormEvent) { e.preventDefault(); await generation.run(() => api(`/clients/${clientId}/runs`, json('POST', { sourceAssetId, prompt, quantity, modelId: models.data?.models[0]?.id ?? '' })), () => setPrompt('')) }
  async function addMilestone(e: React.FormEvent) { e.preventDefault(); await progress.run(() => api(`/clients/${clientId}/milestones`, json('POST', { title: milestoneName })), () => setMilestoneName('')) }
  async function placeAsset(assetId: string, milestoneId: string) { await place.run(() => api(`/assets/${assetId}/place`, json('POST', { milestoneId }))) }
  return <div className="page"><Link to="/clients" className="back">{t("← All clients")}</Link>{client.isPending ? <Loading /> : client.error ? <Banner text={client.error.message} /> : <><div className="page-heading"><div><span className="eyebrow">{t("CLIENT WORKSPACE")}</span><h1>{client.data.name}</h1><p>{client.data.email || t('A private space to explore this client’s looks.')}</p></div></div>{client.data.notes && <div className="note"><strong>{t("Private notes")}</strong><p>{client.data.notes}</p></div>}<div className="workspace-grid"><div className="workspace-main"><div className="tabs"><button className={tab === 'gallery' ? 'selected' : ''} onClick={() => setTab('gallery')}>{t("Image gallery")}</button><button className={tab === 'timeline' ? 'selected' : ''} onClick={() => setTab('timeline')}>{t("Progression")}</button></div>{tab === 'gallery' ? <><div className="section-toolbar"><h2>{t("Images ")}<span className="count">{assets.data?.length ?? 0}</span></h2></div>{assets.data?.length ? <div className="image-grid">{assets.data.map(asset => <div key={asset.id} className="image-card"><img src={imageURL(asset.id)} alt={t(asset.kind === 'source' ? 'Client source portrait' : 'Generated look')} /><div className="image-meta"><span className={`tag ${asset.kind}`}>{t(asset.kind === 'source' ? 'Original' : 'Generated')}</span><small>{dateLabel(asset.createdAt, locale)}</small></div><select aria-label={t("Place image in milestone")} value={asset.milestoneId} onChange={e => placeAsset(asset.id, e.target.value)}><option value="">{t("Not in progression")}</option>{milestones.data?.map(m => <option key={m.id} value={m.id}>{m.position}. {m.title}</option>)}</select></div>)}</div> : <Empty title={t("No images yet")} text={t("Upload a portrait to begin exploring looks.")} />}<Banner text={place.error} /></> : <><div className="section-toolbar"><h2>{t("Progression")}</h2></div>{milestones.data?.length ? <div className="timeline">{milestones.data.map(m => { const chosen = assets.data?.filter(a => a.milestoneId === m.id) ?? []; return <div className="milestone" key={m.id}><div className="milestone-index">{m.position}</div><div className="milestone-content"><h3>{m.title}</h3><small>{dateLabel(m.createdAt, locale)}</small>{chosen.length ? <div className="milestone-images">{chosen.map(a => <img src={imageURL(a.id)} alt={`${m.title} ${t('look')}`} key={a.id} />)}</div> : <p>{t("No images selected yet. Use the gallery to add one.")}</p>}</div></div> })}</div> : <Empty title={t("Build the progression")} text={t("Add milestones and choose which images tell this client’s story.")} />}</>}{runs.data?.length ? <section className="runs"><h2>{t("Generation activity")}</h2>{runs.data.map(run => <div className="run" key={run.id}><span className={`status ${run.status}`}>{t(run.status)}</span><span>{run.prompt}</span><small>{dateLabel(run.createdAt, locale)}</small>{run.error && <p className="run-error">{run.error}</p>}</div>)}</section> : null}</div><div className="workspace-side"><section className="card tool-card"><span className="eyebrow">{t("01 / SOURCE")}</span><h2>{t("Add a portrait")}</h2><p>{t("Upload a clear image to use as the starting point for new looks.")}</p><label className="upload-box"><span>↑</span><strong>{t("Choose an image")}</strong><small>{t("JPEG, PNG, or WebP · 10 MB max")}</small><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { uploadImage(e.target.files?.[0]); e.target.value = '' }} disabled={upload.busy} /></label><Banner text={upload.error} /></section><section className="card tool-card"><span className="eyebrow">{t("02 / EXPLORE")}</span><h2>{t("Generate looks")}</h2><p>{t("Describe a hairstyle, color, or visual direction to explore.")}</p><form onSubmit={generate}><label>{t("Source portrait")}<select value={sourceAssetId} onChange={e => setSourceAssetId(e.target.value)} required><option value="">{t("Select an image")}</option>{sourceImages.map((a, i) => <option key={a.id} value={a.id}>{t("Portrait ")}{sourceImages.length - i}</option>)}</select></label><label>{t("Creative direction")}<textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t("Try a shoulder-length bob with warm chestnut highlights. Keep facial features, expression, and pose unchanged.")} rows={5} minLength={10} maxLength={1500} required /></label><label>{t("Variations")}<select value={quantity} onChange={e => setQuantity(Number(e.target.value))}>{[1,2,3,4].map(n => <option key={n} value={n}>{n} {t(n === 1 ? 'image' : 'images')}</option>)}</select></label><Banner text={generation.error} />{models.data && !models.data.enabled && <div className="notice">{t("Generation will be available when model, storage, and worker credentials are configured.")}</div>}<button className="button primary full" disabled={generation.busy || !sourceAssetId || !models.data?.enabled}>{t(generation.busy ? 'Starting…' : 'Generate images')}</button></form></section><section className="card tool-card"><span className="eyebrow">{t("03 / CURATE")}</span><h2>{t("Add a milestone")}</h2><p>{t("Mark a step in the client’s progression, then select images from the gallery.")}</p><form onSubmit={addMilestone}><label>{t("Milestone name")}<input value={milestoneName} onChange={e => setMilestoneName(e.target.value)} placeholder={t("First consultation")} minLength={2} required /></label><Banner text={progress.error} /><button className="button secondary full" disabled={progress.busy}>{t("Add milestone")}</button></form></section></div></div></>}</div>
}

function AdminPage() {
  const { t, locale } = usePreferences()
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/me') })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api<AdminUser[]>('/admin/users'), enabled: me.data?.role === 'admin' })
  const audit = useQuery({ queryKey: ['audit'], queryFn: () => api<AuditEvent[]>('/admin/audit'), enabled: me.data?.role === 'admin' })
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [role, setRole] = useState('professional')
  const action = useAction(), passwordAction = useAction()
  const [current, setCurrent] = useState(''), [next, setNext] = useState('')
  async function add(e: React.FormEvent) { e.preventDefault(); await action.run(() => api('/admin/users', json('POST', { name, email, password, role })), () => { setName(''); setEmail(''); setPassword('') }) }
  async function change(e: React.FormEvent) { e.preventDefault(); await passwordAction.run(() => api('/password', json('POST', { current, next })), () => { window.location.href = '/' }) }
  if (me.data && me.data.role !== 'admin') return <div className="page"><Banner text={t("Admin access required")} /></div>
  return <div className="page"><div className="page-heading"><div><span className="eyebrow">{t("STUDIO SETTINGS")}</span><h1>{t("Administration")}</h1><p>{t("Manage your team and review workspace activity.")}</p></div></div><div className="admin-grid"><section className="card form-card"><h2>{t("Invite a team member")}</h2><p>{t("Create an account and share its initial password directly with the person.")}</p><form onSubmit={add} className="stack-form"><label>{t("Full name")}<input value={name} onChange={e => setName(e.target.value)} required /></label><label>{t("Email")}<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>{t("Initial password")}<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={12} required /></label><label>{t("Role")}<select value={role} onChange={e => setRole(e.target.value)}><option value="professional">{t("Professional")}</option><option value="admin">{t("Administrator")}</option></select></label><Banner text={action.error} /><button className="button primary" disabled={action.busy}>{t("Create account")}</button></form></section><section className="card form-card"><h2>{t("Change your password")}</h2><form onSubmit={change} className="stack-form"><label>{t("Current password")}<input type="password" value={current} onChange={e => setCurrent(e.target.value)} required /></label><label>{t("New password")}<input type="password" value={next} onChange={e => setNext(e.target.value)} minLength={12} required /></label><Banner text={passwordAction.error} /><button className="button secondary" disabled={passwordAction.busy}>{t("Update password")}</button></form></section></div><div className="section-toolbar"><h2>{t("Team members ")}<span className="count">{users.data?.length ?? 0}</span></h2></div>{users.data?.length ? <div className="table-wrap"><table><thead><tr><th>{t("Member")}</th><th>{t("Role")}</th><th>{t("Status")}</th><th>{t("Added")}</th></tr></thead><tbody>{users.data.map(u => <tr key={u.id}><td><strong>{u.name}</strong><small>{u.email}</small></td><td>{t(u.role)}</td><td><span className={`status ${u.active ? 'completed' : 'failed'}`}>{t(u.active ? 'Active' : 'Inactive')}</span></td><td>{dateLabel(u.createdAt, locale)}</td></tr>)}</tbody></table></div> : <Loading />}<div className="section-toolbar"><h2>{t("Recent activity")}</h2></div><div className="activity-list">{audit.data?.map(e => <div key={e.id}><span className="activity-dot" /><strong>{e.actorName}</strong><span>{t(({ create: 'created', update: 'updated', upload: 'uploaded', place: 'placed' } as Record<string, string>)[e.action] ?? e.action)} {t(e.subjectType)}</span><small>{dateLabel(e.createdAt, locale)}</small></div>) ?? <Loading />}</div></div>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><PreferencesProvider><QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider></PreferencesProvider></React.StrictMode>)
