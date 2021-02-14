import { Platform } from "./platform";
import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as versions from "./params";
import { EdgeUpdatesClient } from "./client";
import fs from "fs";
import os from "os";
import path from "path";

export const install = async (
  platform: Platform,
  version: versions.Version
): Promise<string> => {
  core.info(`Attempting to download Edge ${version}...`);

  const url = (() => {
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
  })();

  const installDir = (() => {
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
  })();

  core.info(`Acquiring ${version} from ${url}`);
  let installer = await tc.downloadTool(url);
  await fs.promises.rename(installer, `${installer}.exe`);
  installer = `${installer}.exe`;

  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), ""));

  core.info("Installing Edge...");
  try {
    await exec.exec(installer);
    return installDir;
  } catch (e) {
    core.error("Installation failure" + e);
    throw e;
  }
};
