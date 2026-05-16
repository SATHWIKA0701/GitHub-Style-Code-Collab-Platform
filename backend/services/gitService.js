import simpleGit from "simple-git";
import { diffLines } from "diff";
import fs from "fs";
import path from "path";

const baseRepoPath = path.resolve("repos");

const assertSafeRepoName = (repoName) => {
  const name = typeof repoName === "string" ? repoName.trim() : "";
  if (!name) throw new Error("repoName is required");
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) throw new Error("Invalid repoName. Use only letters, numbers, . _ -");
  return name;
};

const normalizeRepoPath = (repoName) => {
  const safeRepoName = assertSafeRepoName(repoName);
  return path.join(baseRepoPath, safeRepoName);
};

const getRepoPath = (repoName, ensureExists = true) => {
  const repoPath = normalizeRepoPath(repoName);
  if (ensureExists && !fs.existsSync(repoPath)) throw new Error(`Repository not found: ${repoName}`);
  return repoPath;
};

const assertSafeBranchName = (branchName) => {
  const name = typeof branchName === "string" ? branchName.trim() : "";
  if (!name) throw new Error("branchName is required");
  if (name.includes("..") || name.includes("\\")) throw new Error("Invalid branchName");
  if (!/^[a-zA-Z0-9._\/-]+$/.test(name)) throw new Error("Invalid branchName");
  return name;
};

const assertSafeRelativePath = (relativePath = "") => {
  const cleaned = String(relativePath || "").replace(/^\/+/, "").trim();
  if (cleaned.includes("..") || cleaned.includes("\\")) throw new Error("Invalid path");
  return cleaned;
};

const ensureGitIdentity = async (git) => {
  await git.addConfig("user.name", process.env.GIT_AUTHOR_NAME || "code-collab-platform");
  await git.addConfig("user.email", process.env.GIT_AUTHOR_EMAIL || "noreply@code-collab-platform.local");
};

export const initRepository = async (repoName, defaultBranch = "main") => {
  const repoPath = normalizeRepoPath(repoName);
  if (!fs.existsSync(repoPath)) fs.mkdirSync(repoPath, { recursive: true });
  const git = simpleGit(repoPath);
  await git.init();
  await ensureGitIdentity(git);

  const readme = path.join(repoPath, "README.md");
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(readme, `# ${repoName}
`, "utf8");
    await git.add("./*");
    await git.commit("Initial commit");
  }
  const branchInfo = await git.branchLocal();
  if (!branchInfo.all.includes(defaultBranch)) await git.checkoutLocalBranch(defaultBranch);
  else await git.checkout(defaultBranch);
  return repoPath;
};

export const ensureRepoExists = (repoName) => getRepoPath(repoName, true);

export const commitFiles = async (repoName, message) => {
  const safeMessage = typeof message === "string" && message.trim().length > 0 ? message.trim() : null;
  if (!safeMessage) throw new Error("Commit message is required");
  if (safeMessage.length > 200) throw new Error("Commit message is too long (max 200 chars)");
  const repoPath = getRepoPath(repoName, true);
  const git = simpleGit(repoPath);
  await ensureGitIdentity(git);
  await git.add("./*");
  return await git.commit(safeMessage);
};

export const getCommitHistory = async (repoName) => {
  const git = simpleGit(getRepoPath(repoName, true));
  return await git.log();
};

export const createBranch = async (repoName, branchName) => {
  const safeBranchName = assertSafeBranchName(branchName);
  const git = simpleGit(getRepoPath(repoName, true));
  await git.branch([safeBranchName]);
  return { message: "Branch created" };
};

export const switchBranch = async (repoName, branchName) => {
  const safeBranchName = assertSafeBranchName(branchName);
  const git = simpleGit(getRepoPath(repoName, true));
  await git.checkout(safeBranchName);
  return { message: "Switched branch" };
};

export const mergeBranch = async (
  repoName,
  sourceBranch,
  targetBranch
) => {

  const safeSourceBranch =
    assertSafeBranchName(sourceBranch);

  const safeTargetBranch =
    assertSafeBranchName(targetBranch);

  const git = simpleGit(
    getRepoPath(repoName, true)
  );

  // checkout target branch first
  await git.checkout(safeTargetBranch);

  // check conflicts before merge
  const status = await git.status();

  if (status.conflicted.length > 0) {
    throw new Error("Merge conflict detected");
  }

  // merge source branch into target branch
  return await git.merge([
    safeSourceBranch
  ]);
};

export const generateDiff = (oldContent, newContent) => diffLines(oldContent, newContent);

export const getBranchDiff = async (repoName, sourceBranch, targetBranch) => {
  const safeSourceBranch = assertSafeBranchName(sourceBranch);
  const safeTargetBranch = assertSafeBranchName(targetBranch);
  const git = simpleGit(getRepoPath(repoName, true));
  const base = await git.raw(["merge-base", safeTargetBranch, safeSourceBranch]);
  return await git.raw(["diff", `${base.trim()}..${safeSourceBranch}`]);
};

export const getBranches = async (repoName) => {
  const git = simpleGit(getRepoPath(repoName, true));
  return await git.branch();
};

export const getCommitGraph = async (repoName) => {
  const git = simpleGit(getRepoPath(repoName, true));
  return await git.raw(["log", "--graph", "--oneline", "--all"]);
};

export const listFiles = async (repoName, relativePath = "") => {
  const repoPath = getRepoPath(repoName, true);
  const safeRelativePath = assertSafeRelativePath(relativePath);
  const target = path.join(repoPath, safeRelativePath);
  if (!fs.existsSync(target)) throw new Error("Path not found");
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    return { type: "file", path: safeRelativePath, name: path.basename(target), content: fs.readFileSync(target, "utf8") };
  }
  const items = fs.readdirSync(target, { withFileTypes: true }).map((entry) => {
    const fullPath = path.join(target, entry.name);
    const childStat = fs.statSync(fullPath);
    return {
      name: entry.name,
      path: [safeRelativePath, entry.name].filter(Boolean).join("/"),
      type: entry.isDirectory() ? "dir" : "file",
      size: childStat.size,
      updatedAt: childStat.mtime,
    };
  }).sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  return { type: "dir", path: safeRelativePath, items };
};

export const writeFileContent = async (repoName, relativePath, content) => {
  const repoPath = getRepoPath(repoName, true);
  const safeRelativePath = assertSafeRelativePath(relativePath);
  if (!safeRelativePath) throw new Error("path is required");
  const target = path.join(repoPath, safeRelativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content ?? "", "utf8");
  return { message: "File saved", path: safeRelativePath };
};

export const uploadFiles = async (repoName, files = [], directory = "") => {
  const repoPath = getRepoPath(repoName, true);
  const safeDirectory = assertSafeRelativePath(directory);
  const targetDir = path.join(repoPath, safeDirectory);
  fs.mkdirSync(targetDir, { recursive: true });
  const uploaded = [];
  for (const file of files) {
    const target = path.join(targetDir, file.originalname);
    fs.writeFileSync(target, file.buffer);
    uploaded.push({ name: file.originalname, path: [safeDirectory, file.originalname].filter(Boolean).join("/") });
  }
  return uploaded;
};

export const createFolder = async (repoName, relativePath) => {
  const repoPath = getRepoPath(repoName, true);
  const safeRelativePath = assertSafeRelativePath(relativePath);
  if (!safeRelativePath) throw new Error("path is required");
  fs.mkdirSync(path.join(repoPath, safeRelativePath), { recursive: true });
  return { message: "Folder created", path: safeRelativePath };
};

export const deletePath = async (repoName, relativePath) => {
  const repoPath = getRepoPath(repoName, true);
  const safeRelativePath = assertSafeRelativePath(relativePath);
  if (!safeRelativePath) throw new Error("path is required");
  const target = path.join(repoPath, safeRelativePath);
  if (!fs.existsSync(target)) throw new Error("Path not found");
  fs.rmSync(target, { recursive: true, force: true });
  return { message: "Deleted", path: safeRelativePath };
};
