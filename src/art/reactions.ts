import Phaser from "phaser";
import catalog from "./catalog.json";
export type Reaction="calin"|"bisou"|"mains"|"rechauffe"|"boude"|"coeur"|"coucou"|"etoile"|"froid"|"joie"|"lecture"|"lettre";
const active=new WeakMap<Phaser.Scene,()=>void>();
/** Cosmetic overlay only: no save mutation, movement, dialogue or quest effects. */
export function reaction(scene:Phaser.Scene,kind:Reaction,debby:Phaser.GameObjects.Sprite,loyal:Phaser.GameObjects.Sprite) {
  active.get(scene)?.();
  const pair=["calin","bisou","mains","rechauffe"].includes(kind);
  const entry=Object.entries(catalog.atlases).find(([key])=>key.startsWith(`${pair?kind:"debby_"+kind}_atlas`));
  if(!entry)return;
  const [key,atlas]=entry;let cancelled=false,overlay:Phaser.GameObjects.Sprite|undefined;
  const clear=()=>{cancelled=true;overlay?.destroy();if(debby.active)debby.setVisible(true);if(loyal.active)loyal.setVisible(true);};
  active.set(scene,clear);
  const play=()=>{
    if(cancelled||!debby.active)return;
    const anim=`reaction-${kind}`;
    if(!scene.anims.exists(anim))scene.anims.create({key:anim,frames:Object.keys(atlas.data.frames).sort().map(frame=>({key,frame})),frameRate:4,repeat:0});
    overlay=scene.add.sprite(debby.x,debby.y,key).setOrigin(.5,1).setDepth(Math.max(debby.y,loyal.y)+1);
    overlay.setScale((pair?90:76)/overlay.height);
    debby.setVisible(false);if(pair)loyal.setVisible(false);
    overlay.play(anim).once(Phaser.Animations.Events.ANIMATION_COMPLETE,clear);
    // Close immediately when Debby resumes walking; the simulation never waits for a visual.
    const check=()=>{if(!debby.active||Math.hypot(debby.x-overlay!.x,debby.y-overlay!.y)>2)clear();if(cancelled)scene.events.off("update",check);};
    scene.events.on("update",check);
  };
  if(scene.textures.exists(key))play();
  else{scene.load.atlas(key,atlas.image,atlas.data);scene.load.once("complete",play);scene.load.start();}
}
