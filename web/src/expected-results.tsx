import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api,json,dateLabel } from './api'
import { usePreferences } from './i18n'
import type { DemoOption,ExpectedResult } from './demo-types'

type Visit={id:string;title:string;revision:number;createdAt:string}
export function ExpectedResults({clientId,options,onReopen,onSelectOption,selectedOptionId,authorized=true}:{clientId:string;options:DemoOption[];onReopen?:(option:DemoOption)=>void;onSelectOption?:(id:string)=>void;selectedOptionId?:string;authorized?:boolean}) {
 const {t,locale}=usePreferences(),cache=useQueryClient(),base=`/clients/${clientId}`
 const visits=useQuery({queryKey:['consultations',clientId],queryFn:()=>api<Visit[]>(`${base}/consultations`),enabled:authorized})
 const selections=useQuery({queryKey:['expected-results',clientId],queryFn:()=>api<ExpectedResult[]>(`${base}/expected-results`),enabled:authorized,refetchInterval:3000})
 const [visit,setVisit]=useState(''),[rationale,setRationale]=useState(''),[name,setName]=useState(''),[review,setReview]=useState(false),[agreed,setAgreed]=useState(false),[synthetic,setSynthetic]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 const visitId=visit||visits.data?.[0]?.id||'',current=selections.data?.find(s=>s.consultationId===visitId),chosen=options.find(o=>o.id===selectedOptionId)
 async function select(optionId:string){setBusy(true);setError('');setMessage('');try{
  await api(`${base}/expected-results`,json('POST',{consultationId:visitId,optionId,version:current?.version||0,rationale,agreementName:name,professionalReviewed:review,clientAgreed:agreed,agreementMethod:synthetic?'synthetic-demonstration':'professional-recorded'}));await cache.invalidateQueries({queryKey:['expected-results',clientId]});setReview(false);setAgreed(false);setMessage(optionId?'Expected result recorded. Earlier choices and all alternatives remain available.':'Current expected result cleared. Earlier choices remain in history.')
 }catch(e){setError((e as Error).message);await cache.invalidateQueries({queryKey:['expected-results',clientId]})}finally{setBusy(false)}}
 if(!authorized)return null
 return <section className="expected-results" aria-label={t('Expected results and selection history')}>
 <h2>{t('Expected results and selection history')}</h2><p>{t('Choose a completed client-specific proposal for a consultation. Record professional review and how the client agreed. A studio record of agreement is not an authenticated client signature. Synthetic demonstrations remain labeled and do not establish professional acceptance.')}</p>
 {onSelectOption&&<div className="expected-form">
 <label>{t('Consultation for expected result')}<select value={visitId} onChange={e=>{setVisit(e.target.value);setReview(false);setAgreed(false)}}><option value="">{t('Select a consultation')}</option>{visits.data?.map(v=><option key={v.id} value={v.id}>{v.title} / {t('Revision')} {v.revision}</option>)}</select></label>
 <label>{t('Saved proposal to choose')}<select value={selectedOptionId||''} onChange={e=>{onSelectOption(e.target.value);setReview(false);setAgreed(false)}}><option value="">{t('Choose an explored option')}</option>{options.filter(o=>o.state.modelRunId).map(o=><option key={o.id} value={o.id}>{o.title}</option>)}</select></label>
 {chosen&&<p>{chosen.state.hairId} + {chosen.state.beardId} · {t(chosen.geometry)}</p>}
 <label>{t('Selection rationale or reason for clearing')}<textarea value={rationale} onChange={e=>setRationale(e.target.value)} maxLength={2000}/></label>
 <label>{t('Client name confirming agreement')}<input value={name} onChange={e=>setName(e.target.value)} maxLength={160}/></label>
 <label className="check-row"><input type="checkbox" checked={review} onChange={e=>setReview(e.target.checked)}/>{t('I reviewed likeness, all viewing angles, clipping and achievable constraints with the client.')}</label>
 <label className="check-row"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/>{t('I record that the client agreed to this specific saved version.')}</label>
 <label className="check-row"><input type="checkbox" checked={synthetic} onChange={e=>setSynthetic(e.target.checked)}/>{t('This selection is a synthetic demonstration, not a real client agreement or professional acceptance.')}</label>
 <div className="demo-actions"><button className="button primary" disabled={busy||!visitId||!chosen||!review||!agreed||!name.trim()||rationale.trim().length<5} onClick={()=>select(selectedOptionId!)}>{t('Record selected expected result')}</button><button className="button secondary" disabled={busy||!current?.optionId||rationale.trim().length<5} onClick={()=>select('')}>{t('Clear current expected result')}</button></div></div>}
 {(error||selections.error||visits.error)&&<p className="error" role="alert">{error||selections.error?.message||visits.error?.message}</p>}{message&&<p role="status">{t(message)}</p>}
 <div className="expected-journey">{selections.data?.filter(s=>s.version>0).map(s=>{const v=visits.data?.find(v=>v.id===s.consultationId),option=options.find(o=>o.id===s.optionId);return <article className="expected-visit" key={s.consultationId}>
 <h3>{v?.title||t('Consultation')} / {t('Revision')} {v?.revision}</h3><p>{t('Current expected result')}: {option?.title||t('No current selection')} · {t('Selection version')} {s.version}</p>
 {option&&<><OptionPicture option={option}/>{onReopen?<button className="button secondary" onClick={()=>onReopen(option)}>{t('Inspect selected proposal')}</button>:<a className="button secondary" href={`/demos?client=${clientId}&option=${option.id}`}>{t('Inspect selected proposal')}</a>}</>}
 <details><summary>{t('Preserved selection history')} ({s.history.length})</summary>{s.history.map(e=><div className="expected-event" key={e.id}><strong>#{e.sequence} · {t(e.action==='select'?'Selected':'Cleared')} · {options.find(o=>o.id===e.optionId)?.title||t('No selected proposal')}</strong><p>{e.rationale}</p><small>{dateLabel(e.createdAt,locale)} · {t(e.agreementMethod==='synthetic-demonstration'?'Synthetic demonstration':e.agreementMethod==='professional-recorded'?'Client agreement recorded by professional':'Selection cleared')} {e.agreementName}</small>{e.optionId&&options.find(o=>o.id===e.optionId)&&<button className="button ghost" onClick={()=>onReopen?onReopen(options.find(o=>o.id===e.optionId)!):window.location.assign(`/demos?client=${clientId}&option=${e.optionId}`)}>{t('Inspect earlier selection')}</button>}</div>)}</details></article>})}</div>
 {selections.isPending?<p role="status">{t('Loading…')}</p>:!selections.isError&&!selections.data?.some(s=>s.version>0)&&<p>{t('No expected result has been selected. Explored options remain alternatives until agreement is recorded.')}</p>}
 </section>
}
export function OptionPicture({option}:{option:DemoOption}){const {t}=usePreferences();return option.previewUrl?<img className="option-picture" src={option.previewUrl} alt={t('Retained render of the saved proposal')} loading="lazy"/>:<p className="option-no-picture">{t('No retained picture. Reopen this option to inspect its actual meshes and retain a picture.')}</p>}
