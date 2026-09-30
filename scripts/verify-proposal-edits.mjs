// SPDX-License-Identifier: GPL-3.0-or-later
// Run the application's exact deformation implementation on retained native GLBs.
// No browser control, texture approximation or generated geometry is used here.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import * as THREE from '../web/node_modules/three/build/three.module.js'
import {defaultRefinement,editStyle} from '../web/src/demo-editing.ts'
const root=path.resolve(import.meta.dirname,'..'),log=path.join(root,'.scratch/execution-log/assets'),runtime=path.join(root,'.scratch/private/runtime')
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),sha=data=>crypto.createHash('sha256').update(data).digest('hex')
const imports=read(path.join(runtime,'demo-asset-imports.json')),directories=new Map()
for(const parent of ['makehuman','blender-mpfb','flame']) {
 for(const c of read(path.join(log,`cloudcompare-${parent}-populated-results.json`)).results) {
  const client=imports.cases[c.fictionalCase].clientId,dir=path.join(runtime,'processing',client,c.jobId),report=read(path.join(dir,'component-report.json'))
  directories.set(path.join(runtime,'processing',client,report.upstream.runId),{candidate:parent,fictionalCase:c.fictionalCase})
 }
 for(const candidate of ['open3d','meshlab','cloudcompare']) {
  const c=read(path.join(log,`${candidate}-${parent}-populated-results.json`)).results.find(c=>c.fictionalCase==='alex-ramos')
  directories.set(path.join(runtime,'processing',imports.cases[c.fictionalCase].clientId,c.jobId),{candidate,upstream:parent,fictionalCase:c.fictionalCase})
 }
}
function load(file) {
 const data=fs.readFileSync(file);assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(8),data.length)
 const size=data.readUInt32LE(12),doc=JSON.parse(data.toString('utf8',20,20+size)),binary=data.subarray(28+size),group=new THREE.Group()
 function accessor(index) {
  const a=doc.accessors[index],v=doc.bufferViews[a.bufferView];assert.equal(v.byteStride,undefined)
  const count=a.count*({SCALAR:1,VEC2:2,VEC3:3}[a.type]),bytes=({5121:1,5123:2,5125:4,5126:4}[a.componentType]),offset=(v.byteOffset||0)+(a.byteOffset||0)
  const raw=binary.subarray(offset,offset+count*bytes),copy=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.length)
  return new ({5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array}[a.componentType])(copy)
 }
 for(const node of doc.nodes) {
  if(node.mesh===undefined)continue
  for(const property of ['matrix','scale','translation','rotation'])assert.equal(node[property],undefined,'Expected verified baked common interchange')
  for(const p of doc.meshes[node.mesh].primitives) {
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(accessor(p.attributes.POSITION),3));geometry.setAttribute('normal',new THREE.BufferAttribute(accessor(p.attributes.NORMAL),3))
   if(p.attributes.TEXCOORD_0!==undefined)geometry.setAttribute('uv',new THREE.BufferAttribute(accessor(p.attributes.TEXCOORD_0),2))
   geometry.setIndex(new THREE.BufferAttribute(accessor(p.indices),1))
   const rgba=doc.materials[p.material].pbrMetallicRoughness.baseColorFactor||[1,1,1,1],material=new THREE.MeshStandardMaterial({color:new THREE.Color(...rgba.slice(0,3))})
   const mesh=new THREE.Mesh(geometry,material);mesh.name=node.name;group.add(mesh)
  }
 }
 return group
}
const results=[],started=performance.now()
for(const [directory,caseInfo] of directories) {
 const head=path.join(directory,'head.glb'),headHash=sha(fs.readFileSync(head))
 for(const kind of ['hair','beard'])for(const name of fs.readdirSync(path.join(directory,kind)).filter(n=>n.endsWith('.glb'))) {
  const file=path.join(directory,kind,name),originalHash=sha(fs.readFileSync(file)),group=load(file)
  const snapshots=group.children.map(m=>({positions:new Float32Array(m.geometry.getAttribute('position').array),normals:new Float32Array(m.geometry.getAttribute('normal').array),indices:new Uint32Array(m.geometry.index.array),uv:m.geometry.getAttribute('uv')?.array.slice()}))
  const e=defaultRefinement(),baseline=editStyle(group,kind,e[kind],[]);assert.equal(baseline.changedVertices,0);assert(baseline.fingerprints.every(f=>f.original===f.edited))
  e[kind]={lengthPercent:85,widthPercent:90,volumeMm:5,color:'brown'}
  const adjusted=editStyle(group,kind,e[kind],[]);assert(adjusted.changedVertices>0);assert(adjusted.maximumDisplacementMm<=25.00001);assert(adjusted.fingerprints.some(f=>f.original!==f.edited))
  let protectedAttachmentVertices=0
  if(kind==='hair')group.children.forEach((m,i)=>{
   const actual=m.geometry.getAttribute('position').array,original=snapshots[i].positions
   for(let n=0;n<original.length;n+=3)if(original[n+1]>=-.10&&original[n+1]<=.08){assert.equal(actual[n],original[n]);assert.equal(actual[n+1],original[n+1]);assert.equal(actual[n+2],original[n+2]);protectedAttachmentVertices++}
  })
  const first=group.children[0].geometry,point=new THREE.Vector3().fromBufferAttribute(first.getAttribute('position'),0),normal=new THREE.Vector3().fromBufferAttribute(first.getAttribute('normal'),0).normalize()
  const stroke={kind,center:point.toArray(),normal:normal.toArray(),radiusMm:20,strengthMm:3}
  const brushed=editStyle(group,kind,e[kind],[stroke]);assert(brushed.changedSincePrevious>0,'Actual localized brush must change positions')
  const repeated=editStyle(group,kind,e[kind],[stroke]);assert.deepEqual(repeated.fingerprints,brushed.fingerprints);assert.equal(repeated.changedSincePrevious,0,'Reapplying retained recipe must not accumulate displacement')
  const bounded=editStyle(group,kind,e[kind],Array(64).fill({...stroke,strengthMm:10,radiusMm:50}));assert(bounded.maximumDisplacementMm<=25.00001)
  for(const mesh of group.children)for(const v of mesh.geometry.getAttribute('normal').array)assert(Number.isFinite(v))
  const reset=editStyle(group,kind,defaultRefinement()[kind],[]);assert(reset.fingerprints.every(f=>f.original===f.edited))
  group.children.forEach((m,i)=>{
   assert.deepEqual(m.geometry.getAttribute('position').array,snapshots[i].positions);assert.deepEqual(m.geometry.getAttribute('normal').array,snapshots[i].normals);assert.deepEqual(new Uint32Array(m.geometry.index.array),snapshots[i].indices)
   if(snapshots[i].uv)assert.deepEqual(m.geometry.getAttribute('uv').array,snapshots[i].uv)
  })
  assert.equal(sha(fs.readFileSync(file)),originalHash);assert.equal(sha(fs.readFileSync(head)),headHash)
  results.push({...caseInfo,jobId:path.basename(directory),kind,style:name,sourceSha256:originalHash,headSha256:headHash,protectedAttachmentVertices,adjusted,brushed,maximumRepeatedBrushDisplacementMm:bounded.maximumDisplacementMm,repeatRecipeIdentical:true,resetPositionsNormalsIndicesAndUVExact:true,sourceFilesUnchanged:true})
  group.children.forEach(m=>{m.geometry.dispose();m.material.dispose()})
 }
 console.log('Verified actual mesh edits:',caseInfo.candidate,caseInfo.upstream||'',caseInfo.fictionalCase)
}
const report={date:new Date().toISOString(),deformationVersion:'style-mesh-v2',scope:'Exact app deformation implementation on 288 actual retained native style GLBs from 18 fitted/supporting jobs. Protected attachment band, positions/normals/UV/topology, independent recipes, real brush effects, determinism, cap, reset and unchanged source head/files verified. This CLI check does not test browser rendering, texture color appearance, physical cut feasibility or professional acceptance.',threeVersion:THREE.REVISION,seconds:(performance.now()-started)/1000,results}
fs.writeFileSync(path.join(log,'editing-native-geometry-verification.json'),JSON.stringify(report,null,2)+'\n')
console.log('PASS',directories.size,'native jobs;',results.length,'actual style meshes; geometry edits, brush, deterministic replay, cap, exact reset, immutable heads and inputs.')
