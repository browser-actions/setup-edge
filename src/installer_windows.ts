import { Installer, InstallResult, DownloadResult } from "./installer";
import { Platform } from "./platform";
import { EdgeUpdatesClient } from "./edge_api";
import * as versions from "./params";
import path from "path";
import os from "os";
import fs from "fs";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import * as core from "@actions/core";
import * as exec from "@actions/exec";

const isENOENT = (e: unknown): boolean => {
  return (
    typeof e === "object" && e !== null && "code" in e && e.code === "ENOENT"
  );
};

export class WindowsInstaller implements Installer {
  private readonly api = new EdgeUpdatesClient();

  constructor(private readonly platform: Platform) {}

  async checkInstalled(
    version: versions.Version
  ): Promise<InstallResult | undefined> {
    const root = this.rootDir(version);
    try {
      await fs.promises.stat(root);
    } catch (e) {
      if (isENOENT(e)) {
        return undefined;
      }
      throw e;
    }
    return { root, bin: "msedge.exe" };
  }

  async download(version: versions.Version): Promise<DownloadResult> {
    const releases = await this.api.getReleases();
    const productVersions = releases.getProduct(version);
    if (!productVersions) {
      throw new Error(`Unsupported version: ${version}`);
    }
    const product = productVersions.getReleaseByPlatform(this.platform);
    if (!product) {
      throw new Error(
        `Unsupported platform: ${this.platform.os} ${this.platform.arch}`
      );
    }
    const artifact = product.getPreferredArtifact();
    if (!artifact) {
      throw new Error(
        `Artifact not found of Edge ${version} for platform ${this.platform.os} ${this.platform.arch}`
      );
    }

    core.info(
      `Acquiring ${version} (${product.ProductVersion}) from ${artifact.Location}`
    );
    const archive = await tc.downloadTool(artifact.Location);

    return { archive };
  }

  async install(
    version: versions.Version,
    archive: string
  ): Promise<InstallResult> {
    await exec.exec("msiexec", ["/i", archive, "/qn"]);

    return { root: this.rootDir(version), bin: "msedge.exe" };
  }

  private rootDir(version: versions.Version): string {
    switch (version) {
      case versions.StableVersion:
        return "C:\\Program Files (x86)\\Microsoft\\Edge\\Application";
      case versions.BetaVersion:
        return "C:\\Program Files (x86)\\Microsoft\\Edge Beta\\Application";
      case versions.DevVersion:
        return "C:\\Program Files (x86)\\Microsoft\\Edge Dev\\Application";
      case versions.CanaryVersion:
        return path.join(
          os.homedir(),
          "AppData\\Local\\Microsoft\\Edge SxS\\Application"
        );
    }
  }

  async test(version: versions.Version): Promise<void> {
    const msedgeBin = await io.which("msedge", true);
    await exec.exec("wmic", [
      "datafile",
      "where",
      `name="${msedgeBin.replace(/\\/g, "\\\\")}"`,
      "get",
      "version",
    ]);
  }
}
