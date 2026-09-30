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
export type ComponentSettings = { sourceRunId: string; triangleRatio: number; voxelSize: number; samplePoints: number }
export type DemoState = {
  component?: ComponentSettings
  colmapPreset?: string
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
  settings: { minimumWidth: number; native?: NativeSettings; colmapPreset?: string; component?: ComponentSettings }
  createdAt: string
  result: {
    component?: {
 version: string; processingVersion: string; upstream: { runId: string; candidate: string; headSha256: string }; settings: ComponentSettings;
 mesh: { before: { vertices: number; triangles: number }; after: { vertices: number; triangles: number }; triangleTarget: number; deviation: { upstreamVerticesToProcessedSurface: { meanMetres: number; maximumMetres: number }; processedVerticesToUpstreamSurface: { meanMetres: number; maximumMetres: number } } };
 pointProcessing: { sampled: number; voxelized: number; retainedAfterOutlierFilter: number; role: string };
 alignment: { input: string; fitness: number; inlierRmseMetres: number; maximumIterations: number; actualIterations?: number; iterations?: { iteration:number; fitness:number; inlierRmseMetres:number }[]; recoveredPointMaximumErrorMetres: number };
 provenance: { upstreamCandidate: string; upstreamProvenance: unknown }; limitations: string[]
 };
    diagnostics?: string[]
    head?: string
    hair?: Record<string, string>
    beard?: Record<string, string>
    retainedBytes?: number
    failure?: { error?: string }
    targetBasisCheck?: { basisVersion: string; mappedVertices: number; maximumErrorMetres: number; passed: boolean }
    reconstruction?: {
      version: string
      geometry: string
      denseStatus: string
      elapsedMs: number
      retainedBytes: number
      resourceMeasurement: string
      features: { view: string; features: number }[]
      pairs: { first: string; second: string; verifiedMatches: number }[]
      trials: {
        index: number
        initialMinimumInliers: number
        initialMinimumAngleDegrees: number
        models: { model: string; registeredViews: string[]; points3D: number; meanReprojectionErrorPixels: number }[]
      }[]
      resources: { stage: string; seconds: number; cpuSeconds: number; peakRssKiB: number }[]
      limitations: string[]
      unmetRequirements: string[]
    }
    fit?: {
      basisVersion?: string
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
