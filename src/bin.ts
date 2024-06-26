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
        const packageJsonFiles = sync(`${workspace}/package.json`, {
          cwd: process.cwd(),
          nodir: true,
        }).map((file) => {
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

    if (rootPackage.version) {
      rootPackage.version = updateVersion(rootPackage.version, bumpType);
    } else {
      console.warn("Root package.json does not have a version field");
    }

    for (const packageJson of childPackageJsonMap.values()) {
      if (packageJson.version) {
        packageJson.version = updateVersion(packageJson.version, bumpType);
      } else {
        console.warn(
          `Package.json for ${packageJson.name} does not have a version field`,
        );
      }
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

    fs.writeFileSync(rootPackageJsonFile, JSON.stringify(rootPackage, null, 2));
  });

program.parse();
