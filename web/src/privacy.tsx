import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json, dateLabel } from './api'
import { usePreferences } from './i18n'

export type Permission = { status: string; notice: string; noticeVersion: string; acknowledgedName: string; acknowledgedAt: string; method: string; requests: {id:string;action:string;status:string;requestedAt:string}[] }
type Impact = {mediaCount:number;jobCount:number;explanation:string}

export function PrivacyRequestHistory() {
  const {t,locale}=usePreferences()
  const requests=useQuery({queryKey:['privacy-requests'],queryFn:()=>api<{id:string;action:string;status:string;requestedAt:string}[]>('/privacy-requests'),refetchInterval:5000})
  if(!requests.data?.length)return null
  return <details className="card privacy-panel"><summary>{t('Privacy request history')}</summary><p>{t('Deletion status remains available here after a client record is removed. No photos or deleted client names are retained in this history.')}</p>{requests.data.map(r=><p key={r.id}><span className={`status ${r.status==='completed'?'completed':'queued'}`}>{t(r.status)}</span> {t(r.action)} · {dateLabel(r.requestedAt,locale)}</p>)}</details>
}

export function PermissionPortal() {
  const { t } = usePreferences()
  const token = window.location.pathname.split('/').pop()
  const notice = useQuery({queryKey:['permission-link',token],queryFn:()=>api<{notice:string;noticeVersion:string}>(`/permission/${token}`),retry:false})
  const [name,setName]=useState(''),[ack,setAck]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[done,setDone]=useState(false)
  async function submit(e:React.FormEvent) {
    e.preventDefault();setBusy(true);setError('')
    try {await api(`/permission/${token}`,json('POST',{name,acknowledged:ack,noticeVersion:notice.data?.noticeVersion}));setDone(true)}catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  return <main className="permission-page"><div className="brand"><span className="brand-mark">T</span>trama</div><section className="card form-card"><span className="eyebrow">{t('CLIENT PERMISSION')}</span><h1>{t('Your private consultation')}</h1>{done?<div role="status"><h2>{t('Acknowledgement recorded')}</h2><p>{t('You may close this page. Ask your professional at any time to withdraw permission or delete your photos or journey.')}</p></div>:notice.error?<div className="error" role="alert">{t(notice.error.message)}</div>:notice.data?<><p>{t('Please read and respond yourself. The professional cannot acknowledge on your behalf.')}</p><p>{t(notice.data.notice)}</p><small>{t('Notice version')}: {notice.data.noticeVersion}</small><form className="stack-form" onSubmit={submit}><label>{t('Your full name')}<input value={name} onChange={e=>setName(e.target.value)} required maxLength={160}/></label><label className="check-label"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} required/>{t('I have read the notice and affirmatively allow these private consultation uses.')}</label>{error&&<div role="alert" className="error">{t(error)}</div>}<button className="button primary" disabled={busy||!ack}>{t(busy?'Saving…':'Record my acknowledgement')}</button></form></>:<p>{t('Loading…')}</p>}</section></main>
}

export function PrivacyPanel({clientId}:{clientId:string}) {
  const {t,locale}=usePreferences(),cache=useQueryClient()
  const permission=useQuery({queryKey:['permission',clientId],queryFn:()=>api<Permission>(`/clients/${clientId}/permission`),refetchInterval:3000})
  const [link,setLink]=useState(''),[expiry,setExpiry]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[impact,setImpact]=useState<Impact>(),[action,setAction]=useState<'withdraw'|'delete'>(),[result,setResult]=useState('')
  async function createLink(){setBusy(true);setError('');try{const r=await api<{path:string;expiresAt:string}>(`/clients/${clientId}/permission-link`,{method:'POST'});setLink(r.path);setExpiry(r.expiresAt)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  async function prepare(next:'withdraw'|'delete'){setError('');try{setImpact(await api<Impact>(`/clients/${clientId}/deletion-impact`));setAction(next)}catch(e){setError((e as Error).message)}}
  async function erase(){setBusy(true);setError('');try{const r=await api<{status:string}>(`/clients/${clientId}${action==='withdraw'?'/withdraw':''}`,json(action==='withdraw'?'POST':'DELETE',{confirmed:true}));setResult(r.status);setImpact(undefined);setLink('');await cache.invalidateQueries();if(action==='delete'&&r.status==='completed')window.location.href='/clients'}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  return <section className="card privacy-panel"><div><span className="eyebrow">{t('PRIVATE STUDIO ACCESS')}</span><h2>{t('Client permission and privacy')}</h2><span className={`status ${permission.data?.status==='active'?'completed':'queued'}`}>{t(permission.data?.status||'Loading…')}</span></div><p>{t('Client photos and personal previews belong to this private consultation. No promotion, training or generic catalog reuse.')}</p>{permission.data?.status==='active'&&<p><strong>{permission.data.acknowledgedName}</strong> · {dateLabel(permission.data.acknowledgedAt,locale)} · {t(permission.data.method)} · {permission.data.noticeVersion}</p>}<p>{t('The client reads the notice and enters their own acknowledgement on a short-lived page. No client account is required. This records acknowledgement, not verified identity.')}</p><div className="privacy-actions"><button className="button secondary" onClick={createLink} disabled={busy}>{t('Create client acknowledgement page')}</button><button className="button ghost" onClick={()=>prepare('withdraw')} disabled={busy}>{t('Record withdrawal request')}</button><button className="button danger" onClick={()=>prepare('delete')} disabled={busy}>{t('Delete client and journey')}</button></div>{link&&<p><a className="button secondary" href={link} target="_blank" rel="noreferrer">{t('Open page for the client')}</a> <small>{t('Expires in 15 minutes')}: {new Date(expiry).toLocaleTimeString(locale)}</small></p>}{impact&&<div className="notice privacy-confirm"><h3>{t(action==='withdraw'?'Confirm withdrawal':'Confirm client deletion')}</h3><p>{t(impact.explanation)}</p><p>{impact.mediaCount} {t('dependent media')} · {impact.jobCount} {t('related jobs')}</p><div className="privacy-actions"><button className="button danger" onClick={erase} disabled={busy}>{t('Confirm removal')}</button><button className="button ghost" onClick={()=>setImpact(undefined)}>{t('Cancel')}</button></div></div>}{result&&<p role="status">{t('Request status')}: {t(result)}</p>}{error&&<p className="error" role="alert">{t(error)}</p>}{permission.error&&<p className="error">{t(permission.error.message)}</p>}{!!permission.data?.requests.length&&<details><summary>{t('Privacy request history')}</summary>{permission.data.requests.map(r=><p key={r.id}>{t(r.action)} · {t(r.status)} · {dateLabel(r.requestedAt,locale)}</p>)}</details>}</section>
}

export function DeletePhoto({assetId}:{assetId:string}) {
  const {t}=usePreferences(),cache=useQueryClient();const [impact,setImpact]=useState<Impact>(),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function prepare(){setError('');try{setImpact(await api<Impact>(`/assets/${assetId}/deletion-impact`))}catch(e){setError((e as Error).message)}}
  async function erase(){setBusy(true);try{const r=await api<{status:string}>(`/assets/${assetId}`,json('DELETE',{confirmed:true}));await cache.invalidateQueries();if(r.status!=='completed')setError(t('Removal recorded; storage cleanup is pending.'))}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
  return <div className="photo-removal">{impact?<><p>{t(impact.explanation)}</p><small>{impact.mediaCount} {t('dependent media')} · {impact.jobCount} {t('related jobs')}</small><button className="button danger" disabled={busy} onClick={erase}>{t('Confirm photo removal')}</button><button className="button ghost" onClick={()=>setImpact(undefined)}>{t('Cancel')}</button></>:<button className="button ghost" onClick={prepare}>{t('Remove photo')}</button>}{error&&<p role="alert" className="error">{t(error)}</p>}</div>
}
