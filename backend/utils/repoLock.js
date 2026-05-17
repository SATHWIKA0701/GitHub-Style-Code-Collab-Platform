const locks = new Map();

export const withRepoLock = async (repoName, fn) => {
  if (!repoName) {
    throw new Error("repoName is required");
  }

  const key = repoName.trim();

  if (!locks.has(key)) {
    locks.set(key, Promise.resolve());
  }

  const previous = locks.get(key);

  let release;

  const current = new Promise((resolve) => {
    release = resolve;
  });

  locks.set(key, previous.then(() => current));

  await previous;

  try {
    return await fn();
  } finally {
    release();

    if (locks.get(key) === current) {
      locks.delete(key);
    }
  }
};