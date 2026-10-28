// Create a separately colored GLB from the exact approved original.
// No external dependencies. Original geometry, images, and animation remain byte-identical.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const APPROVED_PLANET_SHA='d9c8694975801df074264107e5199a6936498eb72b6f2f119641685fbba81144';
export const COLORED_PLANET_SHA='181ed373c3db053ec7abaaf753a13d6dafa6d782b3b4226a1c01197dabc55a00';
export function sha256(buffer){return createHash('sha256').update(buffer).digest('hex');}
export function colorizePlanet(source,destination){
 const original=readFileSync(source);
 if(sha256(original)!==APPROVED_PLANET_SHA)throw Error('Source does not match approved original planet');
 if(original.readUInt32LE(0)!==0x46546c67||original.readUInt32LE(4)!==2)throw Error('Expected GLB 2.0');
 const jsonLen=original.readUInt32LE(12);
 if(original.readUInt32LE(16)!==0x4e4f534a)throw Error('Missing JSON chunk');
 const gltf=JSON.parse(original.subarray(20,20+jsonLen).toString('utf8'));
 for(const mat of gltf.materials){
  const pbr=mat.pbrMetallicRoughness||={};
  if(mat.name==='PurplePlanet'){
   pbr.baseColorFactor=[0.48,0.23,0.87,1];
   mat.emissiveFactor=[0.08,0.025,0.2];
  }else if(mat.name==='Clouds_0'){
   pbr.baseColorFactor=[0.85,0.58,0.94,0.26];
   mat.emissiveFactor=[0.14,0.075,0.19];
  }else if(mat.name==='Clouds_1'){
   pbr.baseColorFactor=[0.82,0.72,0.94,0.22];
   mat.emissiveFactor=[0.1,0.085,0.15];
  }
 }
 const json=Buffer.from(JSON.stringify(gltf));
 const length=Math.ceil(json.length/4)*4;
 const jsonChunk=Buffer.alloc(length,0x20);
 json.copy(jsonChunk);
 const binaryChunks=original.subarray(20+jsonLen);
 const output=Buffer.alloc(20+length+binaryChunks.length);
 output.writeUInt32LE(0x46546c67,0);
 output.writeUInt32LE(2,4);
 output.writeUInt32LE(output.length,8);
 output.writeUInt32LE(length,12);
 output.writeUInt32LE(0x4e4f534a,16);
 jsonChunk.copy(output,20);
 binaryChunks.copy(output,20+length);
 if(sha256(output)!==COLORED_PLANET_SHA)throw Error('Colored planet fingerprint mismatch');
 writeFileSync(destination,output);
 return COLORED_PLANET_SHA;
}
