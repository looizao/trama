import { lazy, Suspense, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, json, imageURL } from './api'
import { usePreferences } from './i18n'
import type { DemoCamera, DemoOption, ExpectedResult } from './demo-types'
import type { PhotoSet } from './photos'

const ExpectedViewer = lazy(() => import('./demo-viewer').then(m => ({ default: m.DemoViewer })))
export type OutcomeVisit = {
  id: string; clientId: string; consultationId: string; previousVisitId: string; kind: string; title: string;
  occurredOn: string; notes: string; clientFeedback: string; synthetic: boolean;
  baselineSetId: string; actualSetId: string; expectedOptionId: string; expectedEventId: string; expectedVersion: number;
  views: { baseline: Record<string,string>; actual: Record<string,string> }; createdAt: string
}
const angles = [
  {id:'front',label:'Front',yaw:0}, {id:'left-three-quarter',label:'Left three-quarter',yaw:Math.PI/4},
  {id:'right-three-quarter',label:'Right three-quarter',yaw:-Math.PI/4}, {id:'left-profile',label:'Left profile',yaw:Math.PI/2},
  {id:'right-profile',label:'Right profile',yaw:-Math.PI/2}, {id:'back',label:'Back',yaw:Math.PI},
  {id:'crown',label:'Crown',yaw:0}, {id:'under-chin',label:'Under-chin',yaw:0},
]
function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}

export function OutcomeVisits({clientId,authorized,options}:{clientId:string;authorized:boolean;options:DemoOption[]}) {
  const {t}=usePreferences(),cache=useQueryClient(),base=`/clients/${clientId}`,prefix=`outcome-${clientId}`
  const visits=useQuery({queryKey:['outcome-visits',clientId],queryFn:()=>api<OutcomeVisit[]>(base+'/outcome-visits'),refetchInterval:8000})
  const sets=useQuery({queryKey:['photo-sets',clientId],queryFn:()=>api<PhotoSet[]>(base+'/photo-sets')})
  const consultations=useQuery({queryKey:['consultations',clientId],queryFn:()=>api<{id:string;title:string;revision:number}[]>(base+'/consultations')})
  const selections=useQuery({queryKey:['expected-results',clientId],queryFn:()=>api<ExpectedResult[]>(base+'/expected-results'),enabled:authorized})
  const [selected,setSelected]=useState(''),[consultation,setConsultation]=useState(''),[kind,setKind]=useState('post-cut'),[previous,setPrevious]=useState('')
  const [title,setTitle]=useState(''),[date,setDate]=useState(localDate),[baseline,setBaseline]=useState(''),[actual,setActual]=useState('')
  const [notes,setNotes]=useState(''),[feedback,setFeedback]=useState(''),[synthetic,setSynthetic]=useState(false),[confirmed,setConfirmed]=useState(false)
  const [requestId,setRequestId]=useState(()=>crypto.randomUUID()),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
  const [view,setView]=useState('front'),[distance,setDistance]=useState(1.3)
  const selection=selections.data?.find(s=>s.consultationId===consultation)
  const current=visits.data?.find(v=>v.id===selected)||visits.data?.[0]
  const option=options.find(o=>o.id===current?.expectedOptionId)
  const angle=angles.find(a=>a.id===view)!
  const camera:DemoCamera={azimuth:angle.yaw,elevation:view==='crown'?1.2:view==='under-chin'?-.65:.08,distance}
  const expectedURLs=option?(()=>{
    const state=option.state,root=`/api${base}/demo-jobs/${state.modelRunId}/artifacts`
    const hair=state.hairId==='keep-current'?state.currentHairId:state.hairId,beard=state.beardId==='keep-current'?state.currentBeardId:state.beardId
    return [`${root}/head/model`,...(!['none','keep-current'].includes(hair)?[`${root}/hair/${hair}`]:[]),...(!['clean-shaven','keep-current'].includes(beard)?[`${root}/beard/${beard}`]:[])]
  })():[]
  async function record(e:FormEvent){
    e.preventDefault();setBusy(true);setError('');setMessage('')
    try {
      const saved=await api<OutcomeVisit>(base+'/outcome-visits',json('POST',{requestId,consultationId:consultation,kind,title,occurredOn:date,previousVisitId:kind==='follow-up'?previous:'',baselineSetId:baseline,actualSetId:actual,notes,clientFeedback:feedback,synthetic,actualConfirmed:confirmed,expectedVersion:selection?.version||0}))
      await cache.invalidateQueries({queryKey:['outcome-visits',clientId]});setSelected(saved.id);setRequestId(crypto.randomUUID());setTitle('');setNotes('');setFeedback('');setConfirmed(false)
      setMessage(t('Visit retained. Its original photo assignments and selected expected version are preserved. Add a later visit to record further progress.'))
    } catch(e){setError((e as Error).message);await cache.invalidateQueries({queryKey:['expected-results',clientId]})}finally{setBusy(false)}
  }
  return <section className="card outcome-panel" id="outcome-visits" aria-label={t('Actual outcomes and follow-up visits')}>
    <h2>{t('Actual outcomes and follow-up visits')}</h2>
    <p>{t('Record post-cut photos and later visits alongside the original baseline and the selected expected version when the visit is recorded. Later photo replacements and target changes preserve earlier visit history. Deleted media is removed from dependent comparisons.')}</p>
    <a className="button secondary" href="#guided-photos">{t('Upload labeled post-cut or follow-up photos')}</a>
    <details><summary>{t('Record a visit')}</summary>
      {!authorized&&<p className="notice">{t('Client acknowledgement is required before uploads.')}</p>}
      <form className="stack-form" onSubmit={record}>
        <div className="form-grid">
          <label htmlFor={prefix+'-kind'}>{t('Visit type')}<select id={prefix+'-kind'} value={kind} onChange={e=>setKind(e.target.value)}><option value="post-cut">{t('Post-cut')}</option><option value="follow-up">{t('Follow-up')}</option></select></label>
          <label htmlFor={prefix+'-title'}>{t('Visit title')}<input id={prefix+'-title'} value={title} onChange={e=>setTitle(e.target.value)} minLength={2} maxLength={160} required/></label>
          <label htmlFor={prefix+'-date'}>{t('Visit date')}<input id={prefix+'-date'} type="date" max={localDate()} value={date} onChange={e=>setDate(e.target.value)} required/></label>
          <label htmlFor={prefix+'-consultation'}>{t('Consultation at this visit')}<select id={prefix+'-consultation'} value={consultation} onChange={e=>setConsultation(e.target.value)} required><option value="">{t('Select a consultation')}</option>{consultations.data?.map(c=><option key={c.id} value={c.id}>{c.title} / {t('Revision')} {c.revision}</option>)}</select></label>
          {kind==='follow-up'&&<label htmlFor={prefix+'-previous'}>{t('Earlier visit (optional)')}<select id={prefix+'-previous'} value={previous} onChange={e=>setPrevious(e.target.value)}><option value="">{t('No linked earlier visit')}</option>{visits.data?.map(v=><option key={v.id} value={v.id}>{v.occurredOn} / {v.title}</option>)}</select></label>}
          <label htmlFor={prefix+'-baseline'}>{t('Original baseline photo set')}<select id={prefix+'-baseline'} value={baseline} onChange={e=>setBaseline(e.target.value)} required><option value="">{t('Select a photo set')}</option>{sets.data?.map(s=><option key={s.id} value={s.id}>{s.title} / {6-s.missing.length}/6</option>)}</select></label>
          <label htmlFor={prefix+'-actual'}>{t('Post-cut or follow-up photo set')}<select id={prefix+'-actual'} value={actual} onChange={e=>setActual(e.target.value)} required><option value="">{t('Select a photo set')}</option>{sets.data?.filter(s=>s.id!==baseline).map(s=><option key={s.id} value={s.id}>{s.title} / {6-s.missing.length}/6</option>)}</select></label>
          <label htmlFor={prefix+'-notes'}>{t('Visit observations')}<textarea id={prefix+'-notes'} value={notes} onChange={e=>setNotes(e.target.value)} maxLength={4000}/></label>
          <label htmlFor={prefix+'-feedback'}>{t('Client feedback (optional)')}<textarea id={prefix+'-feedback'} value={feedback} onChange={e=>setFeedback(e.target.value)} maxLength={2000}/></label>
        </div>
        <p>{t('Expected version recorded with this visit')}: {options.find(o=>o.id===selection?.optionId)?.title||t('No selected expected result')} · {selection?.version||0}</p>
        <label className="check-label"><input type="checkbox" checked={synthetic} onChange={e=>setSynthetic(e.target.checked)}/>{t('These are synthetic inputs and simulated outcomes, not actual haircut photographs.')}</label>
        {!synthetic&&<label className="check-label"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{t('I confirm these photographs document the actual visit.')}</label>}
        <button className="button primary" disabled={busy||!authorized||!consultation||!baseline||!actual||(!synthetic&&!confirmed)||selections.isPending||!!selections.error}>{t('Retain visit and comparison')}</button>
      </form>
    </details>
    {message&&<p role="status">{message}</p>}
    {(error||visits.error||sets.error||consultations.error)&&<p role="alert" className="error">{error||visits.error?.message||sets.error?.message||consultations.error?.message}</p>}
    {visits.isPending?<p>{t('Loading…')}</p>:!current?<p>{t('No outcome visit has been recorded. Photo sets alone do not establish a post-cut result.')}</p>:<>
      <label htmlFor={prefix+'-selected'}>{t('Retained visit')}<select id={prefix+'-selected'} value={current.id} onChange={e=>{setSelected(e.target.value);setView('front');setDistance(1.3)}}>{visits.data?.map(v=><option key={v.id} value={v.id}>{v.occurredOn} / {v.title} / {t(v.synthetic?'Simulated outcome':'Actual visit')}</option>)}</select></label>
      <article className="outcome-record"><h3>{current.title}</h3><p>{current.occurredOn} · {t(current.kind==='follow-up'?'Follow-up':'Post-cut')} · <strong>{t(current.synthetic?'Simulated outcome':'Actual visit')}</strong></p>
        {current.synthetic&&<p className="notice">{t('Synthetic demonstration. These photographs show simulated changes and do not establish actual haircut outcomes or reconstruction accuracy.')}</p>}
        {current.previousVisitId&&<p>{t('Linked earlier visit')}: {visits.data?.find(v=>v.id===current.previousVisitId)?.title||t('Earlier visit unavailable')}</p>}
        <p>{t('Recorded expected selection version')}: {current.expectedVersion} · {option?.title||t('Expected result absent or removed')}</p>
        {current.notes&&<p>{current.notes}</p>}{current.clientFeedback&&<p><strong>{t('Client feedback (optional)')}: </strong>{current.clientFeedback}</p>}
      </article>
      <div className="demo-actions" aria-label={t('Comparison viewing angle')}>{angles.map(a=><button key={a.id} className={view===a.id?'button primary':'button secondary'} aria-pressed={view===a.id} onClick={()=>setView(a.id)}>{t(a.label)}</button>)}</div>
      <p>{t('Compare the same labeled angle. Uploaded framing is not measured camera calibration. The expected view is the retained edited 3D proposal with fitted and inferred surfaces, not an actual photograph. Rotation is fixed to the named angle; zoom remains available.')}</p>
      <div className="demo-actions"><label htmlFor={prefix+'-zoom'}>{t('Expected proposal zoom')}<input id={prefix+'-zoom'} type="range" min={.3} max={3} step={.05} value={3.3-distance} onChange={e=>setDistance(3.3-Number(e.target.value))}/></label><button className="button secondary" onClick={()=>setDistance(1.3)}>{t('Reset expected zoom')}</button></div>
      {!authorized?<p className="notice">{t('Client acknowledgement is required to view media.')}</p>:<div className="outcome-comparison" data-view={view}>
        {(['baseline','expected','actual'] as const).map(phase=><div className="outcome-column" key={phase}><h3>{t(phase==='baseline'?'Original baseline':phase==='expected'?'Expected proposal':current.synthetic?'Simulated outcome':'Actual visit')} / {t(angle.label)}</h3>
          {phase==='expected'?option?<Suspense fallback={<p role="status">{t('Loading actual 3D meshes…')}</p>}><ExpectedViewer title="Retained expected 3D proposal" urls={expectedURLs} camera={camera} onCamera={value=>setDistance(value.distance)} refinement={option.state.refinement} lockedRotation/></Suspense>:<p className="comparison-missing">{t('Expected result absent or removed')}</p>:current.views[phase][view]?<img className="outcome-photo" src={imageURL(current.views[phase][view])} alt={`${t(phase==='baseline'?'Original baseline':current.synthetic?'Simulated outcome':'Actual visit')} / ${t(angle.label)} / ${current.title}`}/>:<p className="comparison-missing">{t('This view was not captured or its source media was deleted.')}</p>}
        </div>)}
      </div>}
      <ol className="outcome-history">{visits.data?.map(v=><li key={v.id}><button className="button ghost" onClick={()=>{setSelected(v.id);setView('front')}}>{v.occurredOn} / {v.title}</button><span>{t(v.synthetic?'Simulated outcome':'Actual visit')} · {t('Recorded expected selection version')} {v.expectedVersion}</span></li>)}</ol>
    </>}
  </section>
}
