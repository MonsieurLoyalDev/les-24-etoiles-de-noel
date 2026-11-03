import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {loadSave,writeSave} from '../src/save';
import {initial} from '../src/domain';
it('enregistre et relit une progression versionnée dans IndexedDB',async()=>{await writeSave({...initial,stage:3});expect((await loadSave())?.stage).toBe(3);});
