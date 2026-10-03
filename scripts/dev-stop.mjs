#!/usr/bin/env node

// Lists and stops Next.js and Sanity dev servers started from any worktree of
// this repository. Each server is reported as one tree: the launcher plus every
// descendant (next-server, Turbopack workers). Killing the launcher is enough
// for `dev-worktree.mjs` to stop its sibling and release the port slot.

import { execFile } from "node:child_process";
import { readlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_PATTERN = /\b(next|sanity) dev\b/;
const GRACE_MS = 5_000;

const USAGE = `Usage: pnpm dev:stop [--all | --here | --orphans | --port <port>...]

  (no flags)   list running dev servers
  --all        stop every dev server
  --here       stop servers started from this worktree
  --orphans    stop servers whose "pnpm dev:worktree" process is gone
  --port N     stop the server on port N (repeatable)`;

function parseArgs(argv) {
  const options = { all: false, here: false, orphans: false, ports: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--all") options.all = true;
    else if (flag === "--here") options.here = true;
    else if (flag === "--orphans") options.orphans = true;
    else if (flag === "--port") {
      const value = Number(argv[index + 1]);
      if (!Number.isInteger(value)) throw new Error(`--port needs a number.\n${USAGE}`);
      options.ports.push(value);
      index += 1;
    } else throw new Error(USAGE);
  }
  return options;
}

async function listProcesses() {
  const { stdout } = await execFileAsync("ps", [
    "-eo",
    "pid=,ppid=,pgid=,rss=,etimes=,args=",
  ], { maxBuffer: 16 * 1024 * 1024 });
  const processes = new Map();
  for (const line of stdout.split("\n")) {
    const match = /^\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(.*)$/.exec(line);
    if (!match) continue;
    const [, pid, ppid, pgid, rss, etimes, args] = match;
    processes.set(Number(pid), {
      pid: Number(pid),
      ppid: Number(ppid),
      pgid: Number(pgid),
      rssKb: Number(rss),
      seconds: Number(etimes),
      args,
    });
  }
  return processes;
}

async function readCwd(pid) {
  try {
    return await readlink(`/proc/${pid}/cwd`);
  } catch {
    return undefined;
  }
}

function worktreeOf(cwd) {
  if (!cwd) return "?";
  const base = path.basename(cwd);
  return base === "frontend" || base === "studio" ? path.dirname(cwd) : cwd;
}

async function findServers(processes) {
  const children = new Map();
  for (const proc of processes.values()) {
    if (!children.has(proc.ppid)) children.set(proc.ppid, []);
    children.get(proc.ppid).push(proc);
  }

  const servers = [];
  for (const proc of processes.values()) {
    if (!SERVER_PATTERN.test(proc.args)) continue;
    const parent = processes.get(proc.ppid);
    if (parent && SERVER_PATTERN.test(parent.args)) continue;

    const tree = [];
    const queue = [proc];
    while (queue.length) {
      const current = queue.shift();
      tree.push(current);
      queue.push(...(children.get(current.pid) ?? []));
    }

    const kindMatch = SERVER_PATTERN.exec(proc.args);
    const portMatch = /--port[= ](\d+)/.exec(proc.args);
    const cwd = await readCwd(proc.pid);
    servers.push({
      root: proc,
      tree,
      kind: kindMatch[1] === "next" ? "website" : "studio",
      port: portMatch ? Number(portMatch[1]) : undefined,
      worktree: worktreeOf(cwd),
      orphan: !parent || parent.pid === 1 || /systemd/.test(parent.args),
      rssMb: Math.round(tree.reduce((sum, item) => sum + item.rssKb, 0) / 1024),
    });
  }
  return servers.sort((a, b) => (a.port ?? 0) - (b.port ?? 0));
}

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h${String(minutes).padStart(2, "0")}m` : `${minutes}m`;
}

function printTable(servers) {
  if (!servers.length) {
    console.log("No dev servers running.");
    return;
  }
  const rows = servers.map((server) => [
    String(server.port ?? "?"),
    server.kind,
    `${server.rssMb} MB`,
    formatUptime(server.root.seconds),
    server.orphan ? "orphan" : "",
    server.worktree,
  ]);
  const header = ["PORT", "KIND", "MEMORY", "UPTIME", "STATE", "WORKTREE"];
  const widths = header.map((title, column) =>
    Math.max(title.length, ...rows.map((row) => row[column].length)),
  );
  for (const row of [header, ...rows]) {
    console.log(row.map((cell, column) => cell.padEnd(widths[column])).join("  ").trimEnd());
  }
}

function selectServers(servers, options) {
  return servers.filter(
    (server) =>
      options.all ||
      (options.here && server.worktree === repoRoot) ||
      (options.orphans && server.orphan) ||
      options.ports.includes(server.port),
  );
}

function signal(pid, name) {
  try {
    process.kill(pid, name);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function stopServers(servers) {
  const pids = servers.flatMap((server) => server.tree.map((proc) => proc.pid));
  for (const server of servers) {
    console.log(`Stopping ${server.kind} on port ${server.port ?? "?"} (${server.rssMb} MB)`);
  }
  // Signal roots first so dev-worktree.mjs sees a clean child exit and releases
  // the slot, then sweep the descendants.
  for (const pid of pids) signal(pid, "SIGTERM");

  const deadline = Date.now() + GRACE_MS;
  let remaining = pids.filter(alive);
  while (remaining.length && Date.now() < deadline) {
    await sleep(200);
    remaining = remaining.filter(alive);
  }
  if (remaining.length) {
    console.log(`Force-killing ${remaining.length} process(es) that ignored SIGTERM.`);
    for (const pid of remaining) signal(pid, "SIGKILL");
  }
}

async function main() {
  if (process.platform === "win32") throw new Error("dev:stop needs /proc; Linux or macOS only.");
  const options = parseArgs(process.argv.slice(2));
  const servers = await findServers(await listProcesses());
  const wantsStop = options.all || options.here || options.orphans || options.ports.length > 0;

  if (!wantsStop) {
    printTable(servers);
    if (servers.length) console.log(`\n${USAGE}`);
    return;
  }

  const selected = selectServers(servers, options);
  if (!selected.length) {
    console.log("Nothing matched.");
    printTable(servers);
    return;
  }
  await stopServers(selected);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
