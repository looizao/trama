export type DemoCamera = {
  azimuth: number
  elevation: number
  distance: number
}
export type NativeSettings = {
  focalLength: number
  cameraDistance: number
  cameraHeight: number
  fitRounds: number
}
export type DemoState = {
  native?: NativeSettings
  candidate: string
  photoSetId: string
  photoViews?: Record<string, string>
  modelRunId: string
  currentHairId: string
  currentBeardId: string
  hairId: string
  beardId: string
  camera: DemoCamera
  minimumWidth: number
}
export type DemoStyle = {
  id: string
  kind: string
  label: string
  length: string
  lengthMm: number
  texture: string
  maintenance: string
  license: string
  creator: string
  sourceUrl: string
  modelUrl: string
  renderUrl: string
  bytes: number
}
export type DemoLibrary = {
  headUrl: string
  geometry: string
  hair: DemoStyle[]
  beard: DemoStyle[]
  candidates: {
    id: string
    name: string
    role: string
    dependency: string
    status: string
  }[]
}
export type DemoOption = {
  id: string
  title: string
  candidate: string
  geometry: string
  state: DemoState
  createdAt: string
}
export type DemoJob = {
  id: string
  candidate: string
  kind: string
  photoSetId: string
  photoViews?: Record<string, string>
  status: string
  error: string
  progress: number
  settings: { minimumWidth: number; native?: NativeSettings }
  createdAt: string
  result: {
    diagnostics?: string[]
    head?: string
    hair?: Record<string, string>
    beard?: Record<string, string>
    retainedBytes?: number
    failure?: { error?: string }
    fit?: {
      pairedLandmarks: number
      meanLandmarkErrorPixels: number
      evaluations: number
      initialLoss: number
      finalLoss: number
      iterations: { iteration: number; loss: number }[]
      views: {
        view: string
        targetFaces: number
        neutralFaces: number
        matchedLandmarks: number
        limitation?: string
      }[]
      limitations: string[]
    }
    resources?: {
      stage: string
      seconds: number
      cpuSeconds: number
      peakRssKiB: number
      exitCode: number
    }[]
    scope?: string
    geometry?: string
    elapsedMs?: number
    inputs?: {
      view: string
      assetId: string
      sha256: string
      width: number
      height: number
      bytes: number
      meanBrightness: number
      edgeContrast: number
      warnings: string[]
    }[]
  }
}
