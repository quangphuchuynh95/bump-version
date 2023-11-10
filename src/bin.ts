#!/usr/bin/env node
import { Command } from "commander";
import { sync } from "glob";
const program = new Command();
import path from "path";
import { BumpType, readJsonFile, updateVersion } from "./helper";
import fs from "fs";

program
  .version("0.0.1")
  .command("bump", { isDefault: true })
  .description("Bump packages version")
  .option("--major")
  .option("--minor")
  .action(({ major, minor }: { major: boolean; minor: boolean }) => {
    const bumpType: BumpType = major ? "major" : minor ? "minor" : "patch";
    const rootPackageJsonFile = path.join(process.cwd(), "package.json");
    const rootPackage = readJsonFile(rootPackageJsonFile);

    let childPackageJson: any[] = [];
    const childPackageJsonFiles = new Map<string, string>();

    if (rootPackage.workspaces) {
      for (const workspace of rootPackage.workspaces as string[]) {
        const packageJsonFiles = sync(workspace, {
          cwd: process.cwd(),
        }).map((folder) => {
          const file = path.join(process.cwd(), folder, "package.json");
          const packageJson = readJsonFile(file);
          childPackageJsonFiles.set(packageJson.name, file);
          return packageJson;
        });

        childPackageJson = [...childPackageJson, ...packageJsonFiles];
      }
    }

    let childPackageJsonMap = new Map<string, any>(
      childPackageJson.map((packageJson) => [packageJson.name, packageJson]),
    );

    rootPackage.version = updateVersion(rootPackage.version, bumpType);

    for (const packageJson of childPackageJsonMap.values()) {
      packageJson.version = updateVersion(packageJson.version, bumpType);
    }

    for (const packageJson of childPackageJsonMap.values()) {
      Object.keys(packageJson.dependencies || {}).forEach((dependencyName) => {
        const dependency = childPackageJsonMap.get(dependencyName);
        if (dependency) {
          packageJson.dependencies[dependencyName] = dependency.version;
        }
      });
    }

    for (const packageJson of childPackageJsonMap.values()) {
      fs.writeFileSync(
        childPackageJsonFiles.get(packageJson.name) as string,
        JSON.stringify(packageJson, null, 2),
      );
    }
  });

program.parse();
