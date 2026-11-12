import { access, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const original = "assets/node_modules/";
const hosted = "assets/vendor/";

// Pages excludes every node_modules directory, including Expo's exported assets.
// Move only the compiled assets and update the URLs emitted by Expo.
await access(path.join(root, "index.html"));
try {
  await rename(path.join(root, original), path.join(root, hosted));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

async function updateUrls(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await updateUrls(filename);
    } else if (/\.(?:js|html|css|json)$/.test(entry.name)) {
      const before = await readFile(filename, "utf8");
      const after = before.replaceAll(original, hosted);
      if (after !== before) await writeFile(filename, after);
    }
  }
}

await updateUrls(root);
console.log("Prepared web assets for static hosting.");
