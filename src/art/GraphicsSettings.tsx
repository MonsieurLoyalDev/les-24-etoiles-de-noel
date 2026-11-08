import { useState } from "react";
import { readGraphics, setGraphics, type GraphicsQuality } from "./graphics";
export function GraphicsSettings() {
  const [quality, update] = useState(readGraphics);
  return (
    <fieldset className="graphics-settings">
      <legend>Ambiance visuelle</legend>
      <label htmlFor="graphics-quality">Effets du village</label>
      <select
        id="graphics-quality"
        value={quality}
        onChange={(event) => {
          const value = event.target.value as GraphicsQuality;
          update(value);
          setGraphics(value);
        }}
      >
        <option value="auto">Automatique</option>
        <option value="full">Complets</option>
        <option value="soft">Légers</option>
        <option value="none">Sans animations d'ambiance</option>
      </select>
      <small>
        Le mode automatique allège les effets sur petit écran. La réduction des
        mouvements de l'appareil reste prioritaire.
      </small>
    </fieldset>
  );
}
