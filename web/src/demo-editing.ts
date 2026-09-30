import * as THREE from 'three'
import type { DemoRefinement, StyleEdit } from './demo-types'

export const defaultRefinement = (): DemoRefinement => ({
  version:'style-mesh-v2',
  hair: {lengthPercent:100,widthPercent:100,volumeMm:0,color:'original'},
  beard: {lengthPercent:100,widthPercent:100,volumeMm:0,color:'original'}, strokes:[],
})
export const styleKind = (url:string) => url.includes('/hair/') ? 'hair' : url.includes('/beard/') ? 'beard' : undefined
const colors:Record<string,string>={black:'#171310',brown:'#70452c',blond:'#c9a66b',gray:'#a5a39f'}
export type EditMeasurement = { changedVertices:number; changedSincePrevious:number; maximumDisplacementMm:number; vertices:number; fingerprints:{mesh:string;original:string;edited:string}[] }
function fingerprint(array:Float32Array) {
  let value=2166136261
  const words=new Uint32Array(array.buffer,array.byteOffset,array.length)
  for(const word of words)value=Math.imul(value^word,16777619)>>>0
  return value.toString(16).padStart(8,'0')
}
export function editStyle(root:THREE.Object3D, kind:'hair'|'beard', edit:StyleEdit, strokes:DemoRefinement['strokes'],version='style-mesh-v2'):EditMeasurement {
  const measured:EditMeasurement={changedVertices:0,changedSincePrevious:0,maximumDisplacementMm:0,vertices:0,fingerprints:[]}
  const activeStrokes=strokes.filter(s=>s.kind===kind).map(s=>({...s,centerVector:new THREE.Vector3(...s.center),normalVector:new THREE.Vector3(...s.normal)}))
  root.updateMatrixWorld(true)
  root.traverse(object=>{
    if (!(object instanceof THREE.Mesh)) return
    const geometry=object.geometry as THREE.BufferGeometry, position=geometry.getAttribute('position')
    if (!object.userData.editBase) {
      object.userData.editBase=new Float32Array(position.array)
      object.userData.baseFingerprint=fingerprint(object.userData.editBase)
      object.userData.editNormals=new Float32Array(geometry.getAttribute('normal').array)
      object.userData.editColors=(Array.isArray(object.material)?object.material:[object.material]).map(m=>m.color?.clone())
    }
    const base:Float32Array=object.userData.editBase, normals:Float32Array=object.userData.editNormals
    const point=new THREE.Vector3(),original=new THREE.Vector3(),direction=new THREE.Vector3(),world=new THREE.Vector3()
    const inverseWorld=object.matrixWorld.clone().invert()
    let meshChanged=false
    for(let i=0;i<position.count;i++) {
      original.fromArray(base,i*3);point.copy(original)
      // Bounded mannequin proportions. The pivot is in GLB metres/Y-up.
      const crownWeight=kind==='hair'?THREE.MathUtils.smoothstep(original.y,.08,.18):1
      const tipWeight=kind==='hair'?THREE.MathUtils.smoothstep(-original.y,.10,.20):0
      const proportionWeight=kind==='hair'&&version==='style-mesh-v2'?Math.max(crownWeight,tipWeight):1
      point.x*=version==='style-mesh-v2'?1+(edit.widthPercent/100-1)*proportionWeight:edit.widthPercent/100
      const pivot=kind==='hair'?.10:-.04
      const lengthPivot=kind==='hair'&&version==='style-mesh-v2'&&original.y<-.10?-.10:pivot
      if(version==='style-mesh-v2')point.y+=(point.y-lengthPivot)*(edit.lengthPercent/100-1)*proportionWeight
      else point.y=pivot+(point.y-pivot)*edit.lengthPercent/100
      direction.fromArray(normals,i*3)
      point.addScaledVector(direction,edit.volumeMm/1000*crownWeight)
      if(activeStrokes.length) {
        world.copy(point).applyMatrix4(object.matrixWorld)
        for(const stroke of activeStrokes) {
          const radius=stroke.radiusMm/1000,distance=world.distanceTo(stroke.centerVector)
          if(distance>=radius)continue
          const falloff=(1-distance/radius)**2
          world.addScaledVector(stroke.normalVector,stroke.strengthMm/1000*falloff)
        }
        point.copy(world).applyMatrix4(inverseWorld)
      }
      direction.copy(point).sub(original)
      // Repeated brush operations cannot grow into an unbounded displacement.
      if(direction.length()>.025)point.copy(original).add(direction.setLength(.025))
      const displacement=point.distanceTo(original)*1000
      if(Math.abs(point.x-position.getX(i))>1e-7||Math.abs(point.y-position.getY(i))>1e-7||Math.abs(point.z-position.getZ(i))>1e-7)measured.changedSincePrevious++
      if(displacement>.00001){measured.changedVertices++;meshChanged=true}
      measured.maximumDisplacementMm=Math.max(measured.maximumDisplacementMm,displacement)
      measured.vertices++;position.setXYZ(i,point.x,point.y,point.z)
    }
    position.needsUpdate=true
    if(meshChanged)geometry.computeVertexNormals()
    else {geometry.getAttribute('normal').array.set(normals);geometry.getAttribute('normal').needsUpdate=true}
    geometry.computeBoundingBox();geometry.computeBoundingSphere()
    measured.fingerprints.push({mesh:object.name,original:object.userData.baseFingerprint,edited:fingerprint(position.array as Float32Array)})
    ;(Array.isArray(object.material)?object.material:[object.material]).forEach((material,i)=>{
      if(!('color' in material))return
      const m=material as THREE.MeshStandardMaterial,original=object.userData.editColors[i]
      if(edit.color==='original'&&original)m.color.copy(original)
      else if(colors[edit.color])m.color.set(colors[edit.color])
      m.needsUpdate=true
    })
  })
  return measured
}
