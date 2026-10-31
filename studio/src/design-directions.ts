import {catalogue} from './catalog-data';

export const collections=[
  {id:'all',label:'All directions'},
  {id:'new',label:'New arrivals'},
  {id:'vibrant',label:'Vibrant'},
  {id:'essential',label:'Clear & useful'},
  {id:'product',label:'Product & technical'},
  {id:'editorial',label:'Editorial'},
  {id:'expressive',label:'Expressive'},
  {id:'warm',label:'Warm'},
] as const;
export type CollectionId=typeof collections[number]['id'];
export type DirectionId='evidence'|'precision'|'maison'|'signal'|'civique'|'edition'|'rituel'|'terminal'|'comptoir'|'mouvement'|'folio'|'patrimoine'|'zeste'|'parade'|'bloom'|'rivage';
export const directions=catalogue.themes.filter(theme=>theme.complete).map(theme=>({
  id:theme.id as DirectionId,name:theme.name,description:theme.description,...theme.design,
  sources:theme.design.sources.map(source=>[source.label,source.url] as const),
}));
export const isDirectionComposition=(value?:string):value is DirectionId=>directions.some(direction=>direction.id===value);
export const isNewDirection=(id:string)=>directions.find(direction=>direction.id===id)?.introduced===true;
export function inCollection(direction:typeof directions[number],collection:CollectionId){
  return collection==='all'||(collection==='new'?direction.introduced:direction.family===collection);
}
