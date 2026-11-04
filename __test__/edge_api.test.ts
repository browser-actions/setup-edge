import * as fs from "node:fs";
import * as path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { EdgeUpdates } from "../src/edge_api";

describe("EdgeUpdates", () => {
  let updates: EdgeUpdates;

  beforeEach(async () => {
    const content = await fs.promises.readFile(
      path.join(import.meta.dirname, "./testdata.json"),
      "utf-8",
    );
    updates = new EdgeUpdates(JSON.parse(content));
  });

  describe("getProduct", () => {
    it("returns the product by channel name", () => {
      const product = updates?.getProduct("stable");

      expect(product).toBeDefined();
    });
  });
});

describe("EdgeUpdatesProduct", () => {
  let updates: EdgeUpdates;

  beforeEach(async () => {
    const content = await fs.promises.readFile(
      path.join(import.meta.dirname, "./testdata.json"),
      "utf-8",
    );
    updates = new EdgeUpdates(JSON.parse(content));
  });

  describe("getReleaseByPlatform", () => {
    it("skips matching releases without an installer artifact", async () => {
      const content = await fs.promises.readFile(
        path.join(import.meta.dirname, "./testdata.json"),
        "utf-8",
      );
      const data = JSON.parse(content);
      const stable = data.find(
        (product: { Product: string }) => product.Product === "Stable",
      );
      const mac = stable.Releases.find(
        (release: { Platform: string }) => release.Platform === "MacOS",
      );
      stable.Releases = [
        { ...mac, Architecture: "universal", Artifacts: [] },
        { ...mac, Architecture: "universal" },
      ];

      const release = new EdgeUpdates(data)
        .getProduct("stable")
        ?.getReleaseByPlatform({ os: "darwin", arch: "arm64" });

      expect(release?.getPreferredArtifact()?.ArtifactName).toBe("pkg");
    });

    it("returns undefined when matching releases have no installer artifact", async () => {
      const content = await fs.promises.readFile(
        path.join(import.meta.dirname, "./testdata.json"),
        "utf-8",
      );
      const data = JSON.parse(content);
      for (const product of data) {
        for (const release of product.Releases) {
          release.Artifacts = [];
        }
      }

      expect(
        new EdgeUpdates(data)
          .getProduct("stable")
          ?.getReleaseByPlatform({ os: "darwin", arch: "amd64" }),
      ).toBeUndefined();
    });

    it("returns the release by platform", async () => {
      const product = updates?.getProduct("stable");
      const release = product?.getReleaseByPlatform({
        os: "windows",
        arch: "amd64",
      });

      expect(release).toBeDefined();
    });

    it("returns undefined on unsupported platform", async () => {
      const product = updates?.getProduct("stable");
      const release = product?.getReleaseByPlatform({
        os: "linux",
        arch: "amd64",
      });

      expect(release).toBeUndefined();
    });
  });
});

describe("EdgeUpdatesProductRelease", () => {
  let updates: EdgeUpdates;

  beforeEach(async () => {
    const content = await fs.promises.readFile(
      path.join(import.meta.dirname, "./testdata.json"),
      "utf-8",
    );
    updates = new EdgeUpdates(JSON.parse(content));
  });

  describe("getPreferredArtifact", () => {
    it("returns the release by platform", () => {
      let artifact = updates
        ?.getProduct("stable")
        ?.getReleaseByPlatform({ os: "windows", arch: "amd64" })
        ?.getPreferredArtifact();

      expect(artifact?.ArtifactName).toBe("msi");

      artifact = updates
        ?.getProduct("stable")
        ?.getReleaseByPlatform({ os: "darwin", arch: "amd64" })
        ?.getPreferredArtifact();

      expect(artifact?.ArtifactName).toBe("pkg");
    });
  });
});
