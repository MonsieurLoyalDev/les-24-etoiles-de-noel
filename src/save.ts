import {openDB} from 'idb';
import {decode, type Save} from './domain';
const database=()=>openDB('etoilebois',1,{upgrade(db){db.createObjectStore('saves');}});
export async function loadSave(){const db=await database();try{return decode(await db.get('saves','phase-a'));}finally{db.close();}}
export async function writeSave(save:Save){const db=await database();try{await db.put('saves',structuredClone(save),'phase-a');}finally{db.close();}}
