import fs from "fs";

export function readJsonFile(file: string) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export type BumpType = "minor" | "major" | "patch";
export function updateVersion(version: string, type: BumpType) {
  if (!version.match(/\d+\.\d+\.\d+/)) {
    throw new Error(`Invalid version string: ${version}`);
  }
  const [major, minor, patch] = version.split(".");

  if (type === "major") {
    return [Number(major) + 1, 0, 0].join(".");
  }

  if (type === "minor") {
    return [major, Number(minor) + 1, 0].join(".");
  }

  return [major, minor, Number(patch) + 1].join(".");
}
