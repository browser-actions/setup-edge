import fs from "fs";

export const waitInstall = (
  path: string,
  timeoutSec: number = 10 * 60,
  checkIntervalSec = 5
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const resetTimers = () => {
      clearInterval(watchId);
      clearTimeout(rejectId);
    };

    const rejectId = setTimeout(() => {
      clearTimeout(rejectId);
      resetTimers();
      reject(`Install timed-out: ${path}`);
    }, timeoutSec * 1000);

    const watchId = setInterval(() => {
      fs.access(path, fs.constants.F_OK, (err) => {
        if (err === null) {
          // file exists
          resetTimers();
          resolve();
          return;
        }

        if (err.code !== "ENOENT") {
          // unexpected error
          resetTimers();
          reject(err);
          return;
        }

        // file not found
      });
    }, checkIntervalSec * 1000);
  });
};
