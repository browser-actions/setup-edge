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

export class MacInstaller implements Installer {
  private readonly api = new EdgeUpdatesClient();

  constructor(private readonly platform: Platform) {}

  async checkInstalled(
    version: versions.Version
  ): Promise<InstallResult | undefined> {
    const root = tc.find("msedge", version);
    if (root) {
      core.info(`Found in cache @ ${root}`);
      return { root, bin: this.binPath(version) };
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
        `Unsupported platform: ${this.platform.os} ${this.platform.arch}`
      );
    }
    core.info(
      `Attempting to download Edge ${version} (${product.ProductVersion})...`
    );
    const artifact = product.getPreferredArtifact();
    if (!artifact) {
      throw new Error(
        `Artifact not found of Edge ${version} for platform ${this.platform.os} ${this.platform.arch}`
      );
    }
    artifact.Location;

    core.info(`Acquiring ${version} from ${artifact.Location}`);
    const archive = await tc.downloadTool(artifact.Location);

    return { archive };
  }

  async install(
    version: versions.Version,
    archive: string
  ): Promise<InstallResult> {
    const extdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "msedge-")); // /tmp/msedge-xxxxxx/

    await exec.exec("xar", ["-xf", archive], { cwd: extdir });

    const pkgdir = (await fs.promises.readdir(extdir)).filter(
      (e) => e.startsWith("MicrosoftEdge-") && e.endsWith(".pkg")
    )[0];
    if (!pkgdir) {
      throw new Error('"MicrosoftEdge-*.pkg" not found in extracted archive');
    }
    const pkgroot = path.join(extdir, pkgdir); // /tmp/msedge-xxxx/MicrosoftEdge-xx.x.xxx.x.pkg/

    await fs.promises.rename(
      path.join(pkgroot, "Payload"),
      path.join(pkgroot, "App.gz")
    );
    await exec.exec("gzip", ["--decompress", "App.gz"], { cwd: pkgroot });
    await exec.exec("cpio", ["--extract", "--file", "App"], { cwd: pkgroot });

    const app = path.join(pkgroot, this.appName(version));
    const root = await tc.cacheDir(app, "msedge", version);

    return { root, bin: this.binPath(version) };
  }

  private binPath(version: versions.Version): string {
    switch (version) {
      case versions.StableVersion:
        return "Contents/MacOS/Microsoft Edge";
      case versions.BetaVersion:
        return "Contents/MacOS/Microsoft Edge Beta";
      case versions.DevVersion:
        return "Contents/MacOS/Microsoft Edge Dev";
      case versions.CanaryVersion:
        return "Contents/MacOS/Microsoft Edge Canary";
    }
  }

  private appName(version: versions.Version): string {
    switch (version) {
      case versions.StableVersion:
        return "Microsoft Edge.app";
      case versions.BetaVersion:
        return "Microsoft Edge Beta.app";
      case versions.DevVersion:
        return "Microsoft Edge Dev.app";
      case versions.CanaryVersion:
        return "Microsoft Edge Canary.app";
    }
  }

  async test(version: versions.Version): Promise<void> {
    const bin = path.basename(this.binPath(version));
    const msedgeBin = await io.which(bin, true);
    await exec.exec(msedgeBin, ["--version"]);
  }
}
