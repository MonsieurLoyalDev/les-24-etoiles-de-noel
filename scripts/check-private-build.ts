// @ts-expect-error Build-only module, never included in the browser.
import { checkPrivateBuild } from "../ops/lib/private-assets.mjs";
const result = checkPrivateBuild(process.cwd());
console.log(
  `Build privé : ${result.assets} ressources contrôlées, octets identiques, paquet demo exclu.`,
);
if (!result.configured)
  console.warn(
    "Compilation privée de contrôle : backend/CAPTCHA non configurés, paquet de livraison interdit.",
  );
