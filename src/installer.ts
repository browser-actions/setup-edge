import * as versions from "./params";

export type InstallResult = {
  root: string; // root is a directory containing all contents for chromium
  bin: string; // bin is a sub-path to chromium executable binary from root
};

export type DownloadResult = {
  archive: string;
};

export interface Installer {
  checkInstalled(version: versions.Version): Promise<InstallResult | undefined>;

  download(version: versions.Version): Promise<DownloadResult>;

  install(version: versions.Version, archive: string): Promise<InstallResult>;

  test(): Promise<void>;
}
