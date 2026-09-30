import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json, imageURL, type Asset } from './api'
import type { DemoStyle } from './demo-types'
import { usePreferences } from './i18n'

type Reference = { id: string; clientId: string; assetId: string; kind: string; styleId: string; title: string; notes: string; creator: string; license: string; sourceUrl: string; createdAt: string }

export function StyleReferences({ clientId, hair, beard, choose }: { clientId: string; hair: DemoStyle[]; beard: DemoStyle[]; choose: (kind: 'hair'|'beard', id: string) => void }) {
  const { t } = usePreferences()
  const cache = useQueryClient()
  const references = useQuery({ queryKey: ['style-references', clientId], queryFn: () => api<Reference[]>(`/clients/${clientId}/style-references`) })
  const assets = useQuery({ queryKey: ['assets', clientId], queryFn: () => api<Asset[]>(`/clients/${clientId}/assets`) })
  const [kind, setKind] = useState<'hair'|'beard'>('hair')
  const [styleId, setStyle] = useState('')
  const [assetId, setAsset] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [creator, setCreator] = useState('')
  const [license, setLicense] = useState('professional-owned')
  const [sourceUrl, setSource] = useState('')
  const [rights, setRights] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const styles = kind === 'hair' ? hair : beard
  async function upload(file?: File) {
    if (!file) return
    setBusy(true); setError(''); setMessage('')
    try {
      const data = new FormData(); data.append('image', file)
      const asset = await api<Asset>(`/clients/${clientId}/assets`, { method: 'POST', body: data })
      await cache.invalidateQueries({ queryKey: ['assets', clientId] })
      setAsset(asset.id)
      setMessage(t('Reference image uploaded to authorized client media. Add its reference details below.'))
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function save() {
    setBusy(true); setError(''); setMessage('')
    try {
      await api(`/clients/${clientId}/style-references`, json('POST', { kind, styleId, assetId, title, notes, creator, license, sourceUrl, rightsConfirmed: rights }))
      await cache.invalidateQueries({ queryKey: ['style-references'] })
      setTitle(''); setNotes(''); setRights(false)
      setMessage(t('Private professional reference retained.'))
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  async function remove(id: string) {
    setBusy(true); setError('')
    try { await api(`/style-references/${id}`, { method: 'DELETE' }); await cache.invalidateQueries({ queryKey: ['style-references'] }); setMessage(t('Reference association removed. Its source remains in client media.')) }
    catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }
  return <section className="card" aria-label={t('Private professional references')}>
    <h2>{t('Private professional references')}</h2>
    <p>{t('Add an authorized image as inspiration for an existing reusable 3D style. References stay private in this client journey. They do not reconstruct geometry or replace the chosen asset. Deleting the source image or withdrawing its client permission removes dependent references.')}</p>
    <details><summary>{t('Add a professional reference')}</summary>
      <div className="form-grid">
        <label>{t('Reference category')}<select value={kind} onChange={e => { setKind(e.target.value as 'hair'|'beard'); setStyle('') }}><option value="hair">{t('Hair')}</option><option value="beard">{t('Beard')}</option></select></label>
        <label>{t('Compatible 3D style')}<select value={styleId} onChange={e => setStyle(e.target.value)}><option value="">{t('Choose a style')}</option>{styles.filter(s => !s.deprecated || styles.every(other => other.deprecated)).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        <label>{t('Reference title')}<input value={title} maxLength={160} onChange={e => setTitle(e.target.value)} /></label>
        <label>{t('Reference creator')}<input value={creator} maxLength={160} onChange={e => setCreator(e.target.value)} /></label>
        <label>{t('Reference rights')}<select value={license} onChange={e => setLicense(e.target.value)}><option value="professional-owned">{t('Professional owns reuse rights')}</option><option value="CC0-1.0">CC0 1.0</option><option value="CC-BY-4.0">CC BY 4.0</option></select></label>
        <label>{t('Public source URL')}<input value={sourceUrl} maxLength={1000} type="url" onChange={e => setSource(e.target.value)} /></label>
        <label>{t('Existing authorized image')}<select value={assetId} onChange={e => setAsset(e.target.value)}><option value="">{t('Choose an image')}</option>{assets.data?.map(a => <option key={a.id} value={a.id}>{a.kind} / {a.id.slice(0, 8)}</option>)}</select></label>
        <label>{t('Upload authorized reference image')}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = '' }} /></label>
        <label>{t('Reference observations')}<textarea value={notes} maxLength={2000} onChange={e => setNotes(e.target.value)} /></label>
      </div>
      {assetId && <img className="style-reference-picture" src={imageURL(assetId)} alt={t('Chosen authorized reference image')} />}
      <label className="check-label"><input type="checkbox" checked={rights} onChange={e => setRights(e.target.checked)} />{t('I verified commercial reuse rights and attribution, and the image has active client permission. Public availability alone is insufficient.')}</label>
      <button disabled={busy || !rights || !assetId || !styleId || title.trim().length < 2 || creator.trim().length < 2 || (license !== 'professional-owned' && !sourceUrl)} onClick={() => void save()}>{t('Retain professional reference')}</button>
    </details>
    {(error || references.error || assets.error) && <p role="alert" className="error">{error || references.error?.message || assets.error?.message}</p>}
    {message && <p role="status">{message}</p>}
    <div className="style-reference-grid">{references.data?.map(ref => {
      const style = (ref.kind === 'hair' ? hair : beard).find(s => s.id === ref.styleId)
      return <article key={ref.id}><img className="style-reference-picture" loading="lazy" src={imageURL(ref.assetId)} alt={ref.title} /><h3>{ref.title}</h3><p>{ref.notes}</p><p>{ref.creator} / {ref.license}</p>{ref.sourceUrl && <a href={ref.sourceUrl} target="_blank" rel="noreferrer">{t('Reference source')}</a>}<p>{style?.label || ref.styleId}</p><button disabled={!style || busy} onClick={() => choose(ref.kind as 'hair'|'beard', ref.styleId)}>{t('Inspect associated 3D style')}</button><button disabled={busy} onClick={() => void remove(ref.id)}>{t('Remove reference association')}</button></article>
    })}</div>
    {references.data?.length === 0 && <p>{t('No private professional references yet.')}</p>}
  </section>
}
