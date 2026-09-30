import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { BrushStroke, DemoCamera, DemoRefinement } from './demo-types'
import { defaultRefinement, editStyle, styleKind } from './demo-editing'
import { usePreferences } from './i18n'

type Inspection = {
  assets: string
  loadMS: number
  bytes: number
  triangles: number
  fps: number
}
function disposeModel(root: THREE.Object3D) {
  const textures = new Set<THREE.Texture>(),
    materials = new Set<THREE.Material>(),
    geometries = new Set<THREE.BufferGeometry>()
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry)
      ;(Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((material) => {
        materials.add(material)
        Object.values(material).forEach((value) => {
          if (value instanceof THREE.Texture) textures.add(value)
        })
      })
    }
  })
  geometries.forEach((g) => g.dispose())
  materials.forEach((m) => m.dispose())
  textures.forEach((t) => {
    if (t.source.data instanceof ImageBitmap) t.source.data.close()
    t.dispose()
  })
}
export function DemoViewer({
  title,
  urls,
  camera,
  onCamera,
  refinement,
  brush,
  onStroke,
  capture,
}: {
  title: string
  urls: string[]
  camera: DemoCamera
  onCamera: (value: DemoCamera) => void
  refinement?: DemoRefinement
  brush?: {kind:'hair'|'beard';radiusMm:number;strengthMm:number}
  capture?: { current: (()=>string|null)|null }
  onStroke?: (stroke:BrushStroke)=>void
}) {
  const { t } = usePreferences(),
    host = useRef<HTMLDivElement>(null)
  const active = useRef<{
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    updating: boolean
    applyEdits: () => void
    requestRender: () => void
  } | null>(null)
  const cameraRef = useRef(camera),
    changeRef = useRef(onCamera)
  const editRef=useRef(refinement), brushRef=useRef(brush), strokeRef=useRef(onStroke)
  editRef.current=refinement;brushRef.current=brush;strokeRef.current=onStroke
  cameraRef.current = camera
  changeRef.current = onCamera
  const [error, setError] = useState(''),
    [brushMessage,setBrushMessage]=useState(''),
    [loading, setLoading] = useState(true),
    [inspection, setInspection] = useState<Inspection>()
  const key = urls.join('|')
  useEffect(() => {
    const element = host.current!
    let destroyed = false,
      frame = 0,
      visible=true, renderNeeded=true
    const abort = new AbortController(),
      scene = new THREE.Scene(),
      model = new THREE.Group()
    scene.background = new THREE.Color('#e8e7e2')
    scene.add(model)
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    element.appendChild(renderer.domElement)
    renderer.domElement.setAttribute('aria-label', t(title))
    renderer.domElement.setAttribute('role', 'img')
    const viewCamera = new THREE.PerspectiveCamera(30, 1, 0.01, 20),
      controls = new OrbitControls(viewCamera, renderer.domElement)
    controls.target.set(0, 0, 0)
    controls.enablePan = false
    controls.minDistance = 0.3
    controls.maxDistance = 3
    controls.minPolarAngle = Math.PI / 2 - 1.45
    controls.maxPolarAngle = Math.PI / 2 + 1.45
    const applyEdits=()=>{
      renderNeeded=true
      const edits=editRef.current||defaultRefinement()
      let changedVertices=0,maximumDisplacementMm=0
      const measurements:Record<string,unknown>={}
      model.children.forEach(child=>{
        const kind=child.userData.styleKind as 'hair'|'beard'|undefined
        if(!kind)return
        const m=editStyle(child,kind,edits[kind],edits.strokes,edits.version||'style-mesh-v1')
        measurements[kind]=m
        changedVertices+=m.changedVertices;maximumDisplacementMm=Math.max(maximumDisplacementMm,m.maximumDisplacementMm)
      })
      element.dataset.changedVertices=String(changedVertices)
      element.dataset.maximumDisplacementMm=maximumDisplacementMm.toFixed(6)
      element.dataset.appliedRefinement=JSON.stringify(edits)
      element.dataset.editMeasurements=JSON.stringify(measurements)
      controls.enabled=!brushRef.current
    }
    const instance = { camera: viewCamera, controls, updating: false, applyEdits, requestRender:()=>{renderNeeded=true} }
    active.current = instance
    const measuredCamera = () => {
      element.dataset.azimuth = controls.getAzimuthalAngle().toFixed(6)
      element.dataset.elevation = (
        Math.PI / 2 -
        controls.getPolarAngle()
      ).toFixed(6)
      element.dataset.distance = controls.getDistance().toFixed(6)
    }
    const position = (value: DemoCamera) => {
      renderNeeded=true
      instance.updating = true
      const radius = Math.cos(value.elevation) * value.distance
      viewCamera.position.set(
        radius * Math.sin(value.azimuth),
        controls.target.y + Math.sin(value.elevation) * value.distance,
        radius * Math.cos(value.azimuth),
      )
      controls.update()
      measuredCamera()
      instance.updating = false
    }
    position(cameraRef.current)
    const changed = () => {
      renderNeeded=true
      measuredCamera()
      if (!instance.updating && !destroyed)
        changeRef.current({
          azimuth: controls.getAzimuthalAngle(),
          elevation: Math.PI / 2 - controls.getPolarAngle(),
          distance: controls.getDistance(),
        })
    }
    controls.addEventListener('change', changed)
    const stroke=(event:PointerEvent)=>{
      const settings=brushRef.current
      if(!settings||event.button!==0||!loaded)return
      const bounds=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster()
      ray.setFromCamera(new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1),viewCamera)
      const hit=ray.intersectObjects(model.children,true)[0]
      let root=hit?.object
      while(root?.parent&&root.parent!==model)root=root.parent
      // A ray must hit the visible chosen style first. Clicking the forehead
      // must not edit hair hidden behind the client head or the other style.
      if(!hit?.face||root?.userData.styleKind!==settings.kind){element.dataset.brushFeedback='No selected style surface under pointer';setBrushMessage('No selected style surface under pointer. Click the chosen hair or beard, or change the viewing angle.');return}
      const normal=hit.face.normal.clone().applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)).normalize()
      strokeRef.current?.({kind:settings.kind,center:hit.point.toArray(),normal:normal.toArray(),radiusMm:settings.radiusMm,strengthMm:settings.strengthMm})
      element.dataset.brushFeedback='Localized style stroke applied'
      setBrushMessage('Localized style stroke applied. Inspect the proposal from the other angles before saving.')
    }
    renderer.domElement.addEventListener('pointerdown',stroke)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x70716c, 2))
    const keyLight = new THREE.DirectionalLight(0xffffff, 3)
    keyLight.position.set(-2, 3, 4)
    scene.add(keyLight)
    const fill = new THREE.DirectionalLight(0xffffff, 1)
    fill.position.set(3, 0, -2)
    scene.add(fill)
    const visibility = new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;if(visible)renderNeeded=true})
    visibility.observe(element)
    const resize = new ResizeObserver(() => {
      renderNeeded=true
      const width = element.clientWidth,
        height = element.clientHeight
      if (width && height) {
        renderer.setSize(width, height)
        viewCamera.aspect = width / height
        viewCamera.updateProjectionMatrix()
      }
    })
    resize.observe(element)
    setLoading(true)
    setError('')
    setInspection(undefined)
    const started = performance.now()
    let bytes = 0,
      loaded = false,
      renderedFrames = 0,
      measuredAt = 0,
      sampleStarted = 0,
      inspected = false
    const loader = new GLTFLoader()
    Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url, {
          credentials: 'same-origin',
          signal: abort.signal,
        })
        if (!response.ok)
          throw new Error(
            `${t('Could not load 3D asset')} (${response.status})`,
          )
        const data = await response.arrayBuffer()
        bytes += data.byteLength
        const gltf = await loader.parseAsync(data, '')
        if (destroyed || abort.signal.aborted) {
          disposeModel(gltf.scene)
          return
        }
        gltf.scene.userData.styleKind=styleKind(url)
        model.add(gltf.scene)
      }),
    )
      .then(() => {
        if (!destroyed) {
          loaded = true
          applyEdits()
          measuredAt = performance.now()
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!destroyed) {
          abort.abort()
          disposeModel(model)
          model.clear()
          setError((e as Error).message)
          setLoading(false)
        }
      })
    if(capture)capture.current=()=>{
      if(destroyed||!loaded||!renderer.domElement.width)return null
      applyEdits();position(cameraRef.current);renderer.render(scene,viewCamera)
      const picture=document.createElement('canvas');picture.width=400;picture.height=Math.round(400*renderer.domElement.height/renderer.domElement.width)
      if(picture.height>1024)return null
      picture.getContext('2d')!.drawImage(renderer.domElement,0,0,picture.width,picture.height)
      return picture.toDataURL('image/jpeg',.85)
    }
    const draw = () => {
      if (destroyed) return
      // Sample only a contiguous visible, foreground interval. Loading and
      // offscreen pauses are separate from the renderer's frame rate.
      if(!visible||document.hidden){sampleStarted=0;renderedFrames=0}
      if(visible&&(renderNeeded||(!document.hidden&&loaded&&!inspected))){
      if(loaded&&!document.hidden&&!sampleStarted)sampleStarted=performance.now()
      renderer.render(scene, viewCamera)
      renderNeeded=false
      if (loaded&&!document.hidden) {
        renderedFrames++
        if (!inspected && performance.now() - sampleStarted >= 1000) {
          inspected = true
          setInspection({
            assets: key,
            loadMS: Math.round(measuredAt - started),
            bytes,
            triangles: renderer.info.render.triangles,
            fps: Math.round(
              (renderedFrames * 10000) / (performance.now() - sampleStarted),
            )/10,
          })
        }
      }
      }
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      if(capture)capture.current=null
      destroyed = true
      abort.abort()
      cancelAnimationFrame(frame)
      resize.disconnect()
      visibility.disconnect()
      controls.removeEventListener('change', changed)
      renderer.domElement.removeEventListener('pointerdown',stroke)
      controls.dispose()
      disposeModel(model)
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      if (active.current === instance) active.current = null
    }
    // Model changes rebuild the scene. Camera changes synchronize the existing scene.
  }, [key, t, title])
  useEffect(()=>{active.current?.applyEdits();if(host.current)host.current.style.cursor=brush?'crosshair':'grab';if(!brush)setBrushMessage('')},[refinement,brush])
  useEffect(() => {
    const instance = active.current
    if (!instance) return
    const { controls, camera: viewCamera } = instance
    instance.requestRender()
    instance.updating = true
    const radius = Math.cos(camera.elevation) * camera.distance
    viewCamera.position.set(
      radius * Math.sin(camera.azimuth),
      controls.target.y + Math.sin(camera.elevation) * camera.distance,
      radius * Math.cos(camera.azimuth),
    )
    controls.update()
    if (host.current) {
      host.current.dataset.azimuth = controls.getAzimuthalAngle().toFixed(6)
      host.current.dataset.elevation = (
        Math.PI / 2 -
        controls.getPolarAngle()
      ).toFixed(6)
      host.current.dataset.distance = controls.getDistance().toFixed(6)
    }
    instance.updating = false
  }, [camera])
  return (
    <div className="demo-viewer">
      <h3>{t(title)}</h3>
      <div
        className="demo-canvas"
        ref={host}
        data-assets={key}
        data-measured-assets={inspection?.assets}
      />
      {loading && <p role="status">{t('Loading actual 3D meshes…')}</p>}
      {brush && brushMessage && <p role="status">{t(brushMessage)}</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {inspection && (
        <small className="demo-inspection">
          {inspection.triangles.toLocaleString()} {t('triangles')} ·{' '}
          {(inspection.bytes / 1048576).toFixed(1)} MB · {inspection.loadMS} ms
          · {inspection.fps} {t('initial FPS')}
        </small>
      )}
    </div>
  )
}
