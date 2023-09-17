import { Installer, InstallResult, DownloadResult } from "./installer";
import { Platform } from "./platform";
import { EdgeUpdatesClient } from "./edge_api";
import * as versions from "./params";
import fs from "fs";
import path from "path";
import os from "os";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import * as core from "@actions/core";
import * as exec from "@actions/exec";

export class LinuxInstaller implements Installer {
  private readonly api = new EdgeUpdatesClient();

  constructor(private readonly platform: Platform) {}

  async checkInstalled(
    version: versions.Version,
  ): Promise<InstallResult | undefined> {
    const root = tc.find("msedge", version);
    if (root) {
      return { root, bin: "msedge" };
    }
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
        `Unsupported platform: ${this.platform.os} ${this.platform.arch}`,
      );
    }
    const artifact = product.getPreferredArtifact();
    if (!artifact) {
      throw new Error(
        `Artifact not found of Edge ${version} for platform ${this.platform.os} ${this.platform.arch}`,
      );
    }
    core.info(
      `Acquiring ${version} (${product.ProductVersion}) from ${artifact.Location}`,
    );
    const archive = await tc.downloadTool(artifact.Location);

    return { archive };
  }

  async install(
    version: versions.Version,
    archive: string,
  ): Promise<InstallResult> {
    const tmpdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "deb-"));
    const extdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "msedge-"));

    await exec.exec("ar", ["x", archive], { cwd: tmpdir });
    await exec.exec("tar", [
      "-xf",
      path.join(tmpdir, "data.tar.xz"),
      "--directory",
      extdir,
      "--strip-components",
      "4",
      "./opt/microsoft",
    ]);

    // remove broken symlink
    await fs.promises.unlink(path.join(extdir, "microsoft-edge"));

    const root = await tc.cacheDir(extdir, "msedge", version);
    core.info(`Successfully Installed msedge to ${root}`);

    return { root, bin: "msedge" };
  }

  async test(_version: versions.Version): Promise<void> {
    const bin = "msedge";
    const msedgeBin = await io.which(bin, true);
    await exec.exec(`"${msedgeBin}"`, ["--version"]);
  }
}
