import { Installer, InstallResult, DownloadResult } from "./installer";
import { Platform } from "./platform";
import * as versions from "./params";
import path from "path";
import os from "os";
import fs from "fs";
import * as tc from "@actions/tool-cache";
import * as io from "@actions/io";
import * as core from "@actions/core";
import * as exec from "@actions/exec";

export class WindowsInstaller implements Installer {
  constructor(private readonly platform: Platform) {}

  async checkInstalled(
    version: versions.Version
  ): Promise<InstallResult | undefined> {
    const root = this.rootDir(version);
    try {
      await fs.promises.stat(root);
    } catch (e) {
      if (e.code === "ENOENT") {
        return undefined;
      }
      throw e;
    }
    return { root, bin: "msedge.exe" };
  }

  async download(version: versions.Version): Promise<DownloadResult> {
    const url = this.url(version);

    core.info(`Acquiring ${version} from ${url}`);
    let installer = await tc.downloadTool(url);
    await fs.promises.rename(installer, `${installer}.exe`);
    installer = `${installer}.exe`;

    return { archive: installer };
  }

  async install(
    version: versions.Version,
    archive: string
  ): Promise<InstallResult> {
    await exec.exec(archive);

    return { root: this.rootDir(version), bin: "msedge.exe" };
  }

  private url(version: versions.Version): string {
    switch (version) {
      case versions.StableVersion:
        return `https://c2rsetup.officeapps.live.com/c2r/downloadEdge.aspx?platform=Default&Channel=Stable&language=en`;
      case versions.BetaVersion:
        return `https://c2rsetup.officeapps.live.com/c2r/downloadEdge.aspx?platform=Default&Channel=Beta&language=en`;
      case versions.DevVersion:
        return `https://c2rsetup.officeapps.live.com/c2r/downloadEdge.aspx?platform=Default&Channel=Dev&language=en`;
      case versions.CanaryVersion:
        return `https://c2rsetup.officeapps.live.com/c2r/downloadEdge.aspx?platform=Default&Channel=Canary&language=en`;
    }
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
