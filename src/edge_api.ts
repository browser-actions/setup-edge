import * as httpm from "@actions/http-client";
import { Platform, OS, Arch } from "./platform";
import {
  StableVersion,
  BetaVersion,
  DevVersion,
  CanaryVersion,
  Version,
} from "./params";

type EdgeUpdatesProductReleaseArtifactJSON = {
  ArtifactName: string;
  Location: string;
  Hash: string;
  HashAlgorithm: string;
  SizeInBytes: number;
};

type EdgeUpdatesProductReleaseJSON = {
  ReleaseID: number;
  Platform: string;
  Architecture: string;
  CVEs: string[];
  ProductVersion: string;
  Artifacts: EdgeUpdatesProductReleaseArtifactJSON[];
  PublishedTime: string;
  ExpectedExpiryDate: string;
};

type EdgeUpdatesProductJSON = {
  Product: string;
  Releases: EdgeUpdatesProductReleaseJSON[];
};

type EdgeUpdatesJSON = EdgeUpdatesProductJSON[];

export class EdgeUpdatesProductRelease {
  private static readonly ArtifactNameValues: { [key: string]: string } = {
    Windows: "msi",
    MacOS: "pkg",
  };

  constructor(private readonly json: EdgeUpdatesProductReleaseJSON) {}

  getPreferredArtifact(): EdgeUpdatesProductReleaseArtifactJSON | undefined {
    const artifactName =
      EdgeUpdatesProductRelease.ArtifactNameValues[this.json.Platform];
    return this.json.Artifacts.find((a) => a.ArtifactName === artifactName);
  }

  get ProductVersion(): string {
    return this.json.ProductVersion;
  }
}

export class EdgeUpdatesProduct {
  private static readonly PlatformValues: { [key: string]: string } = {
    [OS.WINDOWS]: "Windows",
    [OS.DARWIN]: "MacOS",
  };

  private static readonly ArchValues = {
    [Arch.I686]: "x86",
    [Arch.AMD64]: "x64",
    [Arch.ARM64]: "arm64",
  };

  constructor(private readonly json: EdgeUpdatesProductJSON) {}

  getReleaseByPlatform({
    os,
    arch,
  }: Platform): EdgeUpdatesProductRelease | undefined {
    const platformValue = EdgeUpdatesProduct.PlatformValues[os];
    const archValue = EdgeUpdatesProduct.ArchValues[arch];
    const release = this.json.Releases.find(
      (r) =>
        r.Platform === platformValue &&
        (r.Architecture == "universal" || r.Architecture === archValue)
    );
    if (release) {
      return new EdgeUpdatesProductRelease(release);
    }
  }
}

export class EdgeUpdates {
  private static readonly ProductValues = {
    [StableVersion]: "Stable",
    [BetaVersion]: "Beta",
    [DevVersion]: "Dev",
    [CanaryVersion]: "Canary",
  };

  constructor(private readonly json: EdgeUpdatesJSON) {}

  getProduct(version: Version): EdgeUpdatesProduct | undefined {
    const productName = EdgeUpdates.ProductValues[version];
    const product = this.json.find((p) => p.Product === productName);
    if (product) {
      return new EdgeUpdatesProduct(product);
    }
  }
}

export class EdgeUpdatesClient {
  async getReleases(): Promise<EdgeUpdates> {
    // https://docs.microsoft.com/en-us/mem/configmgr/apps/deploy-use/deploy-edge
    const url = "https://edgeupdates.microsoft.com/api/products";
    const http = new httpm.HttpClient("setup-edge");
    const resp = await http.getJson<EdgeUpdatesJSON>(url);
    if (resp.statusCode !== httpm.HttpCodes.OK) {
      throw new Error(
        `Failed to get latest version: server returns ${resp.statusCode}`
      );
    }
    if (resp.result === null) {
      throw new Error(
        "Failed to get latest version: server returns empty body"
      );
    }
    return new EdgeUpdates(resp.result);
  }
}
