import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { DemoCamera } from './demo-types'
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
}: {
  title: string
  urls: string[]
  camera: DemoCamera
  onCamera: (value: DemoCamera) => void
}) {
  const { t } = usePreferences(),
    host = useRef<HTMLDivElement>(null)
  const active = useRef<{
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    updating: boolean
  } | null>(null)
  const cameraRef = useRef(camera),
    changeRef = useRef(onCamera)
  cameraRef.current = camera
  changeRef.current = onCamera
  const [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [inspection, setInspection] = useState<Inspection>()
  const key = urls.join('|')
  useEffect(() => {
    const element = host.current!
    let destroyed = false,
      frame = 0
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
    const instance = { camera: viewCamera, controls, updating: false }
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
      measuredCamera()
      if (!instance.updating && !destroyed)
        changeRef.current({
          azimuth: controls.getAzimuthalAngle(),
          elevation: Math.PI / 2 - controls.getPolarAngle(),
          distance: controls.getDistance(),
        })
    }
    controls.addEventListener('change', changed)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x70716c, 2))
    const keyLight = new THREE.DirectionalLight(0xffffff, 3)
    keyLight.position.set(-2, 3, 4)
    scene.add(keyLight)
    const fill = new THREE.DirectionalLight(0xffffff, 1)
    fill.position.set(3, 0, -2)
    scene.add(fill)
    const resize = new ResizeObserver(() => {
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
        model.add(gltf.scene)
      }),
    )
      .then(() => {
        if (!destroyed) {
          loaded = true
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
    const draw = () => {
      if (destroyed) return
      renderer.render(scene, viewCamera)
      if (loaded) {
        renderedFrames++
        if (!inspected && performance.now() - measuredAt >= 1000) {
          inspected = true
          setInspection({
            assets: key,
            loadMS: Math.round(measuredAt - started),
            bytes,
            triangles: renderer.info.render.triangles,
            fps: Math.round(
              (renderedFrames * 1000) / (performance.now() - measuredAt),
            ),
          })
        }
      }
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      destroyed = true
      abort.abort()
      cancelAnimationFrame(frame)
      resize.disconnect()
      controls.removeEventListener('change', changed)
      controls.dispose()
      disposeModel(model)
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      if (active.current === instance) active.current = null
    }
    // Model changes rebuild the scene. Camera changes synchronize the existing scene.
  }, [key, t, title])
  useEffect(() => {
    const instance = active.current
    if (!instance) return
    const { controls, camera: viewCamera } = instance
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
