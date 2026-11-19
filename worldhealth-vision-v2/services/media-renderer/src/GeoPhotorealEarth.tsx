import {useEffect} from "react";
import {ThreeCanvas} from "@remotion/three";
import {useLoader} from "@react-three/fiber";
import {AdditiveBlending,FrontSide,SRGBColorSpace,TextureLoader} from "three";
import {staticFile} from "remotion";

/**
 * NASA Blue Marble Earth in genuine 3D. Visual pixels are the official
 * seasonal Earth composite of June 2004, NOT realtime satellite imagery.
 * The globe and existing D3 projection share a single editor-approved
 * longitude / latitude / rotation. No substitute texture without disclosure.
 * Preparation: node creative/prepare-earth-texture.mjs
 */
const radius=399;
const textureFile="geo/nasa-blue-marble-june.jpg";
const atmosphereVertex=[
"varying vec3 vNorm;",
"varying vec3 vEye;",
"void main(){",
" vec4 mv=modelViewMatrix*vec4(position,1.0);",
" vNorm=normalize(normalMatrix*normal);",
" vEye=normalize(-mv.xyz);",
" gl_Position=projectionMatrix*mv;",
"}"
].join("\n");
const atmosphereFragment=[
"varying vec3 vNorm;",
"varying vec3 vEye;",
"void main(){",
" float edge=1.0-abs(dot(normalize(vNorm),normalize(vEye)));",
" float haze=pow(clamp(edge,0.0,1.0),3.2);",
" vec3 cyan=mix(vec3(.012,.32,.90),vec3(.12,.96,1.),haze);",
" gl_FragColor=vec4(cyan,haze*.83);",
"}"
].join("\n");
function EarthMesh({longitude,latitude}:{longitude:number;latitude:number}){
  const map=useLoader(TextureLoader,staticFile(textureFile));
  useEffect(()=>{
    map.colorSpace=SRGBColorSpace;
    map.anisotropy=8;
    map.needsUpdate=true;
  },[map]);
  // Three SphereGeometry UV reference: -90deg at the frontal normal.
  // Offset by -90deg - centerLon to align with D3 geoOrthographic.
  const rx=latitude*Math.PI/180;
  const ry=-(Math.PI/2+longitude*Math.PI/180);
  return <>
    <ambientLight intensity={1.15}/>
    <directionalLight position={[-800,620,1700]} intensity={1.85} color="#ffffff"/>
    <directionalLight position={[900,-350,450]} intensity={.54} color="#00a6ff"/>
    <group rotation={[rx,ry,0,"YXZ"]}>
      <mesh>
        <sphereGeometry args={[radius,128,96]}/>
        <meshStandardMaterial map={map} color="#ffffff"
          roughness={.82} metalness={0}
          emissive="#0b3d88" emissiveIntensity={.32} toneMapped={false}/>
      </mesh>
    </group>
    {/* Atmosphere is camera-fixed optical scattering, not claimed clouds. */}
    <mesh>
      <sphereGeometry args={[radius*1.023,128,96]}/>
      <shaderMaterial vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment} transparent depthWrite={false}
        blending={AdditiveBlending} side={FrontSide}/>
    </mesh>
  </>;
}
export function GeoPhotorealEarth({
  centerLongitude,centerLatitude,spinDegrees
}:{
  centerLongitude:number;centerLatitude:number;spinDegrees:number;
}){
  return <div data-wv-geo-nasa-texture="NASA-BlueMarble-June-2004"
    style={{position:"absolute",left:0,top:122,width:1080,height:1250,
      pointerEvents:"none",overflow:"hidden"}}>
    <ThreeCanvas orthographic width={1080} height={1250}
      camera={{position:[0,0,2100],near:1,far:5000}}
      style={{width:"100%",height:"100%",background:"transparent"}}
      gl={{alpha:true,antialias:true,preserveDrawingBuffer:true}}>
      <EarthMesh longitude={centerLongitude-spinDegrees}
        latitude={centerLatitude}/>
    </ThreeCanvas>
  </div>;
}
