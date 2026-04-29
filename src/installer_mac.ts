import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import { EdgeUpdatesClient } from "./edge_api";
import type { DownloadResult, InstallResult, Installer } from "./installer";
import * as versions from "./params";
import type { Platform } from "./platform";

export class MacInstaller implements Installer {
  private readonly api = new EdgeUpdatesClient();

  constructor(private readonly platform: Platform) {}

  async checkInstalled(
    version: versions.Version,
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
    const extdir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "msedge-")); // /tmp/msedge-xxxxxx/

    await exec.exec("xar", ["-xf", archive], { cwd: extdir });

    // Log directory tree to diagnose where the .app bundle is located
    const walk = async (dir: string, depth = 0): Promise<void> => {
      if (depth > 3) return;
      for (const e of await fs.promises.readdir(dir)) {
        core.info(`${"  ".repeat(depth)}${e}`);
        const full = path.join(dir, e);
        if ((await fs.promises.stat(full)).isDirectory()) {
          await walk(full, depth + 1);
        }
      }
    };
    core.info(`Extracted pkg structure under ${extdir}:`);
    await walk(extdir);

    const pkgdir = (await fs.promises.readdir(extdir)).filter(
      (e) => e.startsWith("MicrosoftEdge") && e.endsWith(".pkg"),
    )[0];
    if (!pkgdir) {
      throw new Error('"MicrosoftEdge*.pkg" not found in extracted archive');
    }
    const pkgroot = path.join(extdir, pkgdir); // /tmp/msedge-xxxx/MicrosoftEdge-xx.x.xxx.x.pkg/

    await fs.promises.rename(
      path.join(pkgroot, "Payload"),
      path.join(pkgroot, "App.gz"),
    );
    await exec.exec("gzip", ["--decompress", "App.gz"], { cwd: pkgroot });
    await exec.exec("cpio", ["--extract", "--file", "App"], { cwd: pkgroot });

    const app = path.join(pkgroot, this.appName(version));

    // Diagnose codesign and quarantine attributes before caching
    core.info(`App path: ${app}`);
    core.info(`App exists: ${fs.existsSync(app)}`);
    await exec.exec("codesign", ["--verify", "--verbose=4", app], {
      ignoreReturnCode: true,
    });
    await exec.exec("xattr", ["-l", app], { ignoreReturnCode: true });
    await exec.exec("spctl", ["-a", "-v", app], { ignoreReturnCode: true });

    const root = await tc.cacheDir(app, "msedge", version);

    // Diagnose cached binary
    const cachedBin = path.join(root, this.binPath(version));
    core.info(`Cached binary: ${cachedBin}`);
    core.info(`Cached binary exists: ${fs.existsSync(cachedBin)}`);
    await exec.exec("ls", ["-la", path.dirname(cachedBin)], {
      ignoreReturnCode: true,
    });

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
    core.info(`Testing binary: ${msedgeBin}`);
    const output = await exec.getExecOutput(`"${msedgeBin}"`, ["--version"], {
      ignoreReturnCode: true,
    });
    core.info(`stdout: ${output.stdout}`);
    core.info(`stderr: ${output.stderr}`);
    core.info(`exit code: ${output.exitCode}`);
    if (output.exitCode !== 0) {
      throw new Error(
        `Edge binary test failed with exit code ${output.exitCode}\nstderr: ${output.stderr}`,
      );
    }
  }
}
