import { useState } from 'react'
import type { DemoRefinement, StyleEdit } from './demo-types'
import { defaultRefinement } from './demo-editing'
import { usePreferences } from './i18n'

export type ProposalBrush={kind:'hair'|'beard';radiusMm:number;strengthMm:number}
export function ProposalEditor({value,note,onChange,onNote,brush,onBrush,onWritten,onSave,disabled,hairAvailable,beardAvailable,error,message}: {
 value?:DemoRefinement;note?:string;onChange:(value:DemoRefinement)=>void;onNote:(value:string)=>void;
 brush?:ProposalBrush;onBrush:(value?:ProposalBrush)=>void;onWritten:(text:string)=>Promise<void>;onSave:()=>Promise<void>;
 disabled:boolean;hairAvailable:boolean;beardAvailable:boolean;
 error:string;message:string;
}) {
 const {t}=usePreferences(),[text,setText]=useState(''),[target,setTarget]=useState<'hair'|'beard'>('hair'),[radius,setRadius]=useState(20),[strength,setStrength]=useState(3)
 const edits=value||defaultRefinement()
 const update=(kind:'hair'|'beard',next:Partial<StyleEdit>)=>onChange({...edits,[kind]:{...edits[kind],...next}})
 return <section className="proposal-editor" aria-label={t('Proposal refinements')}>
  <h3>{t('Refine this proposal')}</h3>
  <p>{t('Changes reshape the selected style meshes. The client head and current reference stay unchanged. These proportions do not predict a physical cut or growth.')}</p>
  {value&&value.version!=='style-mesh-v2'&&<p className="error">{t('Historical style edit: whole-style proportions can expose attachment gaps. Earlier revisions retain that behavior. Apply a new written request or upgrade this draft to protect the attachment band.')}</p>}
  {value&&value.version!=='style-mesh-v2'&&<button className="button secondary" onClick={()=>onChange({...edits,version:'style-mesh-v2'})}>{t('Upgrade draft attachment')}</button>}
  <div className="demo-current">{(['hair','beard'] as const).map(kind=><fieldset key={kind} disabled={disabled||!(kind==='hair'?hairAvailable:beardAvailable)}>
   <legend>{t(kind==='hair'?'Hair geometry and color':'Beard geometry and color')}</legend>
   {([['lengthPercent','Length proportion (%)',75,125,1],['widthPercent','Width proportion (%)',85,115,1],['volumeMm','Surface volume adjustment (mm)',-15,15,1]] as const).map(([key,label,min,max,step])=><label key={key}>{t(label)}<input type="number" min={min} max={max} step={step} value={edits[kind][key]} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=min&&v<=max)update(kind,{[key]:v})}}/></label>)}
   <label>{t('Material tint')}<select value={edits[kind].color} onChange={e=>update(kind,{color:e.target.value})}>{['original','black','brown','blond','gray'].map(color=><option key={color} value={color}>{t(color)}</option>)}</select></label>
   <button className="button secondary" onClick={()=>onChange({...edits,[kind]:defaultRefinement()[kind],strokes:edits.strokes.filter(s=>s.kind!==kind)})}>{t('Reset this style edit')}</button>
  </fieldset>)}</div>
  <label>{t('Written refinement request')}<textarea value={text} maxLength={2000} onChange={e=>setText(e.target.value)} placeholder={t('shorter hair; more crown volume; narrower beard')}/></label>
  <button className="button secondary" disabled={disabled||!text.trim()} onClick={()=>onWritten(text)}>{t('Apply written refinement')}</button>
  {error&&<p role="alert" className="error">{t(error)}</p>}
  {message&&<p role="status">{t(message)}</p>}
  <details><summary>{t('Supported written requests')}</summary><p>{t('Use requests separated by semicolons: shorter hair, longer hair, more crown volume, less hair volume, narrower hair, wider hair, shorter beard, longer beard, narrower beard, fuller beard. Portuguese equivalents are supported. Exact values: hair length 85%; beard width 90%; hair volume 5mm; beard color brown. Length 75 to 125%, width 85 to 115%, volume -15 to 15mm. Unsupported requests leave the proposal unchanged.')}</p></details>
  <fieldset disabled={disabled}><legend>{t('Direct 3D style brush')}</legend>
   <label>{t('Brush target')}<select value={target} onChange={e=>{setTarget(e.target.value as 'hair'|'beard');onBrush(undefined)}}><option value="hair">{t('Hair')}</option><option value="beard">{t('Beard')}</option></select></label>
   <label>{t('Brush radius (mm)')}<input type="number" min={5} max={50} value={radius} onChange={e=>{setRadius(Math.max(5,Math.min(50,Number(e.target.value))));onBrush(undefined)}}/></label>
   <label>{t('Brush push or pull (mm)')}<input type="number" min={-10} max={10} value={strength} onChange={e=>{setStrength(Math.max(-10,Math.min(10,Number(e.target.value))));onBrush(undefined)}}/></label>
   <button className={`button ${brush?'primary':'secondary'}`} aria-pressed={!!brush} disabled={!strength||edits.strokes.length>=64||!(target==='hair'?hairAvailable:beardAvailable)} onClick={()=>onBrush(brush?undefined:{kind:target,radiusMm:radius,strengthMm:strength})}>{t(brush?'Return to rotation':'Enable style brush')}</button>
   <p>{t('With the brush enabled, click a visible proposed style surface to push or pull a smooth local region. Rotation pauses in the proposed view; named angles and the current view still synchronize. Up to 64 strokes; total displacement is capped at 25mm per vertex. Inspect all angles for clipping before saving.')}</p>
   <p role="status">{edits.strokes.length} {t('retained brush strokes')}</p>
   <button className="button secondary" disabled={!edits.strokes.length} onClick={()=>onChange({...edits,strokes:edits.strokes.slice(0,-1)})}>{t('Undo last brush stroke')}</button>
  </fieldset>
  <label>{t('Revision note')}<textarea maxLength={2000} value={note||''} onChange={e=>onNote(e.target.value)}/></label>
  <button className="button primary" disabled={disabled||!value} onClick={onSave}>{t('Save edited revision')}</button>
 </section>
}
