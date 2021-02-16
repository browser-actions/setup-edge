import * as core from "@actions/core";
import { getPlatform } from "./platform";
import { valueOfVersion } from "./params";
import { WindowsInstaller } from "./installer_windows";

async function run(): Promise<void> {
  try {
    const version = valueOfVersion(core.getInput("edge-version") || "stable");
    const platform = getPlatform();
    const installer = new WindowsInstaller(platform);

    core.info(`Setup Edge ${version}`);

    const result = await (async () => {
      const installed = await installer.checkInstalled(version);
      if (installed) {
        core.info(`Edge ${version} is already installed @ ${installed.root}`);
        return installed;
      }

      core.info(`Attempting to download Edge ${version}...`);
      const downloaded = await installer.download(version);

      core.info("Installing Edge...");
      const result = await installer.install(version, downloaded.archive);
      core.info(`Successfully setup Edge ${version}`);

      return result;
    })();

    core.addPath(result.root);

    await installer.test();
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
