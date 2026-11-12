import * as THREE from 'three';

/**
 * Transient reflective ripple in model-local space, preserving skin/beanie
 * textures and roughness. An independent effect on the clicked material.
 */
export function installSurfaceRipple(mesh){
 const center={value:new THREE.Vector3(0,0,0)};
 const age={value:10};
 const strength={value:0};
 const colorMix={value:0}; // 0: monochrome, 1: natural color
 const original=mesh.material;
 const materials=(Array.isArray(original)?original:[original]).map(source=>{
  if(!source || !source.isMeshStandardMaterial && !source.isMeshPhysicalMaterial)return source;
  const material=source.clone();
  material.onBeforeCompile=shader=>{
   shader.uniforms.uImpactCenter=center;
   shader.uniforms.uImpactAge=age;
   shader.uniforms.uImpactStrength=strength;
   shader.uniforms.uColorMix=colorMix;
   shader.vertexShader=shader.vertexShader.replace(
    '#include <common>',
    '#include <common>\nvarying vec3 vImpactLocal;');
   shader.vertexShader=shader.vertexShader.replace(
    '#include <begin_vertex>',
    '#include <begin_vertex>\nvImpactLocal = position;');
   shader.fragmentShader=shader.fragmentShader.replace(
    '#include <common>',
    '#include <common>\nvarying vec3 vImpactLocal;\nuniform vec3 uImpactCenter;\nuniform float uImpactAge;\nuniform float uImpactStrength;\nuniform float uColorMix;');
   shader.fragmentShader=shader.fragmentShader.replace(
    '#include <dithering_fragment>',
    `#include <dithering_fragment>
    // A short, traveling reflection glint across the ORIGINAL textured surface.
    // The base PBR material, texture, and matte fabric properties are preserved.
    float naturalGray = dot(gl_FragColor.rgb,vec3(0.2126,0.7152,0.0722));
    gl_FragColor.rgb = mix(vec3(naturalGray),gl_FragColor.rgb,clamp(uColorMix,0.0,1.0));
    float radius = uImpactAge * 0.95;
    float delta = length(vImpactLocal - uImpactCenter) - radius;
    float ring = exp(-delta * delta / (0.060 * 0.060));
    float secondary = exp(-pow((delta + 0.11) / 0.045, 2.0)) * 0.32;
    float fade = 1.0 - smoothstep(0.06, 0.95, uImpactAge);
    float ripple = (ring + secondary) * fade * uImpactStrength;
    float shimmer = 0.84 + 0.16 * sin(delta * 92.0 - uImpactAge * 14.0);
    vec3 glint = vec3(0.465,0.251,0.820) * ripple * shimmer * 0.7;
    gl_FragColor.rgb = 1.0 - (1.0 - gl_FragColor.rgb) * (1.0 - clamp(glint,0.0,0.55));`);
  };
  material.customProgramCacheKey=()=> 'natural-head-reflection-ripple-v5-solid-restored';
  return material;
 });
 mesh.material=Array.isArray(original)?materials:materials[0];
 return {mesh,center,age,strength,colorMix,lastStart:-100,trigger(worldPoint,now,power=1){
   center.value.copy(mesh.worldToLocal(worldPoint.clone()));
   this.lastStart=now;
   strength.value=power;
 },update(now){age.value=Math.max(0,now-this.lastStart);}};
}
