import type {Point} from "../domain";
export const villageSize={width:1920,height:1408};
export const humanDoorHeight=44;
export const residentialPlots=[
  {key:"home-porch",x:150,y:1030,door:[.5,.67,.5,.97],district:"calme"},
  {key:"home-garden",x:950,y:1290,door:[.49,.63,.49,.95],district:"calme"},
  {key:"home-tall",x:420,y:1240,door:[.30,.72,.30,.97],district:"calme"},
  {key:"home-oriel",x:1260,y:650,door:[.75,.66,.75,.97],district:"residentiel"},
  {key:"home-family",x:1200,y:280,door:[.52,.55,.52,.96],district:"residentiel"},
  {key:"home-chalet",x:1510,y:320,door:[.58,.62,.58,.96],district:"residentiel"},
  {key:"home-narrow",x:1150,y:1000,door:[.44,.79,.44,.98],district:"artisans"},
  {key:"home-shutters",x:1740,y:1000,door:[.52,.57,.52,.96],district:"artisans"},
  {key:"cottage-stone",x:1770,y:280,door:[.5,.60,.5,.96],district:"residentiel"},
  {key:"cottage-twin",x:1530,y:650,door:[.5,.60,.5,.96],district:"residentiel"},
  {key:"cottage-gable",x:1800,y:650,door:[.5,.60,.5,.96],district:"residentiel"},
  {key:"cottage-humble",x:730,y:1050,door:[.5,.60,.5,.96],district:"calme"},
  {key:"cottage-annex",x:1440,y:1000,door:[.5,.60,.5,.96],district:"artisans"},
  {key:"cottage-porchwide",x:1170,y:1290,door:[.5,.60,.5,.96],district:"artisans"},
  {key:"cottage-terrace",x:1470,y:1290,door:[.5,.60,.5,.96],district:"artisans"},
  {key:"cottage-garden",x:1770,y:1290,door:[.5,.60,.5,.96],district:"artisans"},
] as const;
export type UrbanLane={id:string;material:"stone"|"dirt";width:number;points:Point[]};
const points=(p:number[][])=>p.map(([x,y])=>({x,y}));
export const urbanLanes:UrbanLane[]=[
 {id:"porte-est",material:"stone",width:34,points:points([[784,348],[1000,348],[1080,400],[1880,400]])},
 {id:"rue-residentielle",material:"dirt",width:30,points:points([[1030,750],[1880,750]])},
 {id:"rue-artisans",material:"dirt",width:30,points:points([[1030,1100],[1880,1100]])},
 {id:"rue-jardins",material:"dirt",width:26,points:points([[900,1360],[1880,1360]])},
 {id:"liaison-est",material:"stone",width:30,points:points([[1080,400],[1080,1100],[1080,1360]])},
 {id:"lisiere-est",material:"dirt",width:26,points:points([[1900,400],[1900,1360],[1880,1360]])},
 {id:"porte-sud",material:"stone",width:38,points:points([[512,752],[512,920],[512,1100],[1080,1100]])},
 {id:"quartier-calme",material:"dirt",width:26,points:points([[512,920],[150,920],[150,1100],[420,1100],[420,1320],[950,1320],[950,1360]])},
];
export const relocatedPine={from:{x:944,y:416},to:{x:1860,y:120}};
