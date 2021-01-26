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
  const edgeUpdatesClient = new EdgeUpdatesClient();
  const releases = await edgeUpdatesClient.getReleases();
  const productVersions = releases.getProduct(version);
  if (!productVersions) {
    throw new Error(`Unsupported version: ${version}`);
  }
  const product = productVersions.getReleaseByPlatform(platform);
  if (!product) {
    throw new Error(`Unsupported platform: ${platform.os} ${platform.arch}`);
  }
  core.info(
    `Attempting to download Edge ${version} (${product.ProductVersion})...`
  );

  const artifact = product.getPreferredArtifact();
  if (!artifact) {
    throw new Error(
      `artifact not found for ${platform.os} ${platform.arch} on ${product.ProductVersion}`
    );
  }
  core.info(`Acquiring ${version} from ${artifact.Location}`);
  const installerPath = await tc.downloadTool(artifact.Location);

  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), ""));
  const logFile = path.join(dir, "edge-install.log");

  core.info("Installing Edge...");
  try {
    await exec.exec("msiexec.exe", [
      "/i",
      installerPath,
      "/qn",
      "/log",
      logFile,
    ]);

    return path.join(
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application",
      product.ProductVersion
    );
  } catch (e) {
    core.error("Installation failure" + e);
    throw e;
  } finally {
    const logData = await fs.promises.readFile(logFile, { encoding: "utf-8" });
    core.info(logData);
  }
};
