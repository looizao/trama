import { useState } from 'react'
import { DemoViewer } from './demo-viewer'
import type { DemoCamera, DemoJob } from './demo-types'
import { usePreferences } from './i18n'

export function PhotoTextureEvaluation({job,url,camera,onCamera}:{job:DemoJob;url:(kind:string,id:string)=>string;camera:DemoCamera;onCamera:(camera:DemoCamera)=>void}) {
  const {t}=usePreferences(),[open,setOpen]=useState(false),report=job.result.photoTexture
  if(!report)return null
  return <details onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary>{t('Actual six-photo texture evaluation')}</summary>
    <p className="notice">{t('Projected photo colors retain existing hair, beard and lighting. This experiment cannot provide bare scalp or clean facial skin beneath them. Neutral material remains the editable proposal default.')}</p>
    <p>{report.assignedTriangles.toLocaleString()} / {report.totalSkinTriangles.toLocaleString()} {t('triangles with source photo projection')} · {report.neutralTriangles.toLocaleString()} {t('neutral uncovered triangles')} · {report.seconds}s</p>
    {open&&<div className="demo-view-pair">
      <DemoViewer title="Neutral fitted head" urls={[url('head','model')]} camera={camera} onCamera={onCamera}/>
      <DemoViewer title="Projected photo appearance experiment" urls={[url('photo-texture','model')]} camera={camera} onCamera={onCamera}/>
    </div>}
    <p>{t('Drag either evaluation view to rotate both. Shared viewing controls also synchronize this diagnostic with the proposal.')}</p>
    <div className="demo-photo-strip">{report.sourceViews.map(view=><figure key={view.view}>
      <a href={url('photo-texture-render',view.view)}><img src={url('photo-texture-render',view.view)} alt={`${t(view.view)} / ${t('Projected photo appearance experiment')}`} loading="lazy"/></a>
      <figcaption>{t(view.view)} · {view.assignedTriangles} {t('assigned triangles')} · {view.framingLandmarksAvailable?t('Landmark framing available'):t('No facial landmark framing')}</figcaption>
    </figure>)}</div>
    <p><a href={url('photo-texture','atlas')}>{t('Retained private photo atlas')}</a> · <a href={url('diagnostic','photo-texture')}>{t('Projection settings, provenance and limitations')}</a></p>
    <p>{report.method}</p><p>{report.textureLicense}</p>{report.limitations.map(l=><p key={l}>{l}</p>)}
  </details>
}
