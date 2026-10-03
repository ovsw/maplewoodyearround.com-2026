#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allocatePorts, HOST } from "./worktree-config.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag !== "--frontend-port" && flag !== "--studio-port") {
      throw new Error(
        "Usage: pnpm dev:worktree [--frontend-port <port> --studio-port <port>]",
      );
    }
    const value = argv[index + 1];
    if (!value) throw new Error(`${flag} needs a value.`);
    values[flag === "--frontend-port" ? "frontendPort" : "studioPort"] = value;
    index += 1;
  }
  return values;
}

async function main() {
  const ports = await allocatePorts({
    worktreeRoot: repoRoot,
    overrides: parseArgs(process.argv.slice(2)),
  });
  let reservationReleased = false;
  async function releaseReservation() {
    if (reservationReleased) return;
    reservationReleased = true;
    await ports.release();
  }
  const frontendUrl = `http://localhost:${ports.frontendPort}`;
  const studioUrl = `http://localhost:${ports.studioPort}`;
  const childEnvironment = {
    ...process.env,
    NEXT_PUBLIC_SITE_URL: frontendUrl,
    NEXT_PUBLIC_STUDIO_URL: studioUrl,
    SANITY_STUDIO_PREVIEW_URL: frontendUrl,
  };

  console.log(`Worktree slot ${ports.slot}`);
  console.log(`Website: ${frontendUrl}`);
  console.log(`Studio:  ${studioUrl}`);

  const commands = [
    {
      name: "Website",
      args: [
        "--dir",
        "frontend",
        "exec",
        "next",
        "dev",
        "--hostname",
        HOST,
        "--port",
        String(ports.frontendPort),
      ],
    },
    {
      name: "Studio",
      args: [
        "--dir",
        "studio",
        "exec",
        "sanity",
        "dev",
        "--host",
        HOST,
        "--port",
        String(ports.studioPort),
      ],
    },
  ];

  const children = [];
  try {
    for (const { name, args } of commands) {
      children.push({
        name,
        process: spawn("pnpm", args, {
          cwd: repoRoot,
          detached: process.platform !== "win32",
          env: childEnvironment,
          stdio: "inherit",
        }),
      });
    }
  } catch (error) {
    await releaseReservation();
    throw error;
  }
  let stopping = false;
  let exitCode = 0;
  const closedChildren = new Set();

  function signalChild(child, signal) {
    if (child.exitCode !== null || child.signalCode !== null) return;
    if (child.pid === undefined) return;
    try {
      if (process.platform === "win32") child.kill(signal);
      else process.kill(-child.pid, signal);
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }

  function stopAll(signal = "SIGTERM") {
    if (!stopping) stopping = true;
    for (const child of children) signalChild(child.process, signal);
    const timer = setTimeout(() => {
      for (const child of children) signalChild(child.process, "SIGKILL");
    }, 5_000);
    timer.unref();
  }

  for (const { name, process: child } of children) {
    child.once("error", (error) => {
      console.error(`${name} failed to start: ${error.message}`);
      exitCode = 1;
      // A failed spawn may never emit "close", so record the failure on the
      // process now instead of waiting for the final close handler.
      process.exitCode = 1;
      stopAll();
    });
    child.once("exit", (code, signal) => {
      if (!stopping) {
        console.error(`${name} stopped (${signal ?? `exit ${code ?? 1}`}); stopping the group.`);
        exitCode = code ?? 1;
        stopAll();
      }
    });
    child.once("close", async () => {
      closedChildren.add(child);
      if (closedChildren.size !== children.length) return;
      try {
        await releaseReservation();
      } catch (error) {
        console.error(`Failed to release worktree slot: ${error.message}`);
        exitCode = 1;
      }
      process.exit(exitCode);
    });
  }

  process.once("SIGINT", () => stopAll("SIGINT"));
  process.once("SIGTERM", () => stopAll("SIGTERM"));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
