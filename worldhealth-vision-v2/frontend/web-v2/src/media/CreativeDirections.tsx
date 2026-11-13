/**
 * World-Vision creative-direction screen.
 * A/B/C were explicitly rejected by the owner (without numerical scores).
 * They remain recoverable from earlier Git commits, but are no longer
 * presented as unapproved choices for the next production step.
 */
import {useEffect} from "react";
import GlobeDirection from "./GlobeDirection";
export type DirectionId="terrain"|"chiffres"|"pedagogie"|"globe";

export default function CreativeDirections({
 selected,onSelect,
}:{
 selected:DirectionId;
 onSelect:(id:DirectionId)=>void;
}){
 useEffect(()=>{
   if(selected!=="globe")onSelect("globe");
 },[selected,onSelect]);
 return <GlobeDirection/>;
}
