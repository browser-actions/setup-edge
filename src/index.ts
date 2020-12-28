import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as installer from "./installer";
import { getPlatform } from "./platform";
import path from "path";
import { valueOfVersion } from "./params";

async function run(): Promise<void> {
  try {
    const version = valueOfVersion(core.getInput("edge-version") || "stable");
    const platform = getPlatform();

    core.info(`Setup Edge ${version}`);

    const installDir = await installer.install(platform, version);

    core.addPath(path.join(installDir));
    core.info(`Successfully setup Edge ${version}`);

    await exec.exec("edge", ["--version"]);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
