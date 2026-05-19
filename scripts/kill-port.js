#!/usr/bin/env node
import { execSync } from "child_process";

const arg = process.argv[2] || process.env.PORT;
if (!arg) {
  console.error("Usage: node scripts/kill-port.js <port>");
  process.exit(1);
}

const port = Number(arg);
if (Number.isNaN(port)) {
  console.error("Invalid port:", arg);
  process.exit(1);
}

try {
  const out = execSync(`lsof -ti tcp:${port}`, { stdio: [0, "pipe", "ignore"] }).toString().trim();
  if (!out) {
    console.log(`No process listening on port ${port}`);
    process.exit(0);
  }

  const pids = out.split(/\s+/).filter(Boolean);
  if (pids.length) {
    console.log(`Killing process(es) on port ${port}: ${pids.join(", ")}`);
    execSync(`kill -9 ${pids.join(" ")}`);
  }
} catch (err) {
  // If lsof not found or no process, ignore and exit 0
}

process.exit(0);
