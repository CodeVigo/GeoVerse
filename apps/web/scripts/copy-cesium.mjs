// Copies Cesium's static runtime assets into /public/cesium so the browser can
// load Workers/Assets/Widgets at runtime. Run before `next dev` / `next build`.
// Done outside webpack on purpose: these prebuilt files must NOT be re-bundled
// or minified by Next (Terser can't parse the ESM worker chunks).

import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cesiumBuild = path.join(path.dirname(require.resolve("cesium/package.json")), "Build/Cesium");
const target = path.join(__dirname, "..", "public", "cesium");

const folders = ["Workers", "Assets", "Widgets", "ThirdParty"];

fs.mkdirSync(target, { recursive: true });
for (const folder of folders) {
  const from = path.join(cesiumBuild, folder);
  const to = path.join(target, folder);
  if (!fs.existsSync(from)) {
    console.warn(`[copy-cesium] skip missing ${from}`);
    continue;
  }
  fs.cpSync(from, to, { recursive: true });
}

console.log(`[copy-cesium] Copied Cesium assets -> ${target}`);
