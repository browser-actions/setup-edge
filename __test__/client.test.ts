import * as fs from "fs";
import * as path from "path";
import { EdgeUpdates } from "../src/client";

describe("EdgeUpdates", () => {
  let updates: EdgeUpdates;

  beforeEach(async () => {
    const content = await fs.promises.readFile(
      path.join(__dirname, "./testdata.json"),
      "utf-8"
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
      path.join(__dirname, "./testdata.json"),
      "utf-8"
    );
    updates = new EdgeUpdates(JSON.parse(content));
  });

  describe("getReleaseByPlatform", () => {
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
      path.join(__dirname, "./testdata.json"),
      "utf-8"
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
