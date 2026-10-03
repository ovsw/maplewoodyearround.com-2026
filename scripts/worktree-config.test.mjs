import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, utimes, writeFile } from "node:fs/promises";
import { hostname, tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  allocatePorts,
  desiredSanityOrigins,
  firstSlotForPath,
  FRONTEND_BASE_PORT,
  portsForSlot,
  SLOT_COUNT,
  STUDIO_BASE_PORT,
  validateOverrides,
} from "./worktree-config.mjs";

async function temporaryWorktree() {
  return mkdtemp(path.join(tmpdir(), "maplewood-worktree-test-"));
}

function reservationRootFor(worktreeRoot) {
  return path.join(worktreeRoot, ".test-reservations");
}

function allocationOptions(worktreeRoot, options = {}) {
  return {
    worktreeRoot,
    reservationRoot: reservationRootFor(worktreeRoot),
    ...options,
  };
}

test("the same worktree gets the same bounded first slot", () => {
  const root = "/work/example/t3code-stable";
  assert.equal(firstSlotForPath(root), firstSlotForPath(root));
  for (let slot = 0; slot < SLOT_COUNT; slot += 1) {
    const ports = portsForSlot(slot);
    assert.equal(ports.frontendPort, FRONTEND_BASE_PORT + slot);
    assert.equal(ports.studioPort, STUDIO_BASE_PORT + slot);
  }
});

test("an occupied first slot falls forward inside the pool", async () => {
  const worktreeRoot = await temporaryWorktree();
  const first = firstSlotForPath(worktreeRoot);
  const blocked = portsForSlot(first);
  const selected = await allocatePorts(
    allocationOptions(worktreeRoot, {
      probe: async (port) =>
        port !== blocked.frontendPort && port !== blocked.studioPort,
    }),
  );
  assert.equal(selected.slot, (first + 1) % SLOT_COUNT);
  await selected.release();
});

test("a selection persists and is reused", async () => {
  const worktreeRoot = await temporaryWorktree();
  const first = await allocatePorts(
    allocationOptions(worktreeRoot, { probe: async () => true }),
  );
  await first.release();
  const second = await allocatePorts(
    allocationOptions(worktreeRoot, { probe: async () => true }),
  );
  assert.deepEqual(second, first);
  await second.release();
});

test("legacy saved ports migrate to the current state shape", async () => {
  const worktreeRoot = await temporaryWorktree();
  const runtimeFile = path.join(worktreeRoot, ".worktree-ports.json");
  await writeFile(runtimeFile, JSON.stringify({ frontendPort: 3004, studioPort: 3337 }));
  const selected = await allocatePorts(
    allocationOptions(worktreeRoot, { runtimeFile, probe: async () => true }),
  );
  assert.deepEqual(selected, portsForSlot(4));
  assert.deepEqual(JSON.parse(await readFile(runtimeFile, "utf8")), portsForSlot(4));
  await selected.release();
});

test("saved ports from a different pool are clearly rejected", async () => {
  const worktreeRoot = await temporaryWorktree();
  await writeFile(
    path.join(worktreeRoot, ".worktree-ports.json"),
    JSON.stringify({ version: 0, frontendPort: 4100, studioPort: 5100 }),
  );
  await assert.rejects(
    allocatePorts(allocationOptions(worktreeRoot, { probe: async () => true })),
    /does not match the current pool/,
  );
});

test("an occupied saved selection stops instead of launching a duplicate", async () => {
  const worktreeRoot = await temporaryWorktree();
  await writeFile(
    path.join(worktreeRoot, ".worktree-ports.json"),
    JSON.stringify(portsForSlot(2)),
  );
  await assert.rejects(
    allocatePorts(allocationOptions(worktreeRoot, { probe: async () => false })),
    /may already be running/,
  );
});

test("concurrent allocations cannot reserve the same shared slot", async () => {
  const sharedRoot = await temporaryWorktree();
  const reservationRoot = path.join(sharedRoot, "reservations");
  const worktreeRoots = [];
  for (let candidate = 0; worktreeRoots.length < 3; candidate += 1) {
    const worktreeRoot = path.join(sharedRoot, `worktree-${candidate}`);
    if (
      worktreeRoots.length === 0 ||
      firstSlotForPath(worktreeRoot) === firstSlotForPath(worktreeRoots[0])
    ) {
      worktreeRoots.push(worktreeRoot);
    }
  }

  const [first, second] = await Promise.all(
    worktreeRoots.slice(0, 2).map((worktreeRoot, index) =>
      allocatePorts({
        worktreeRoot,
        runtimeFile: path.join(sharedRoot, `runtime-${index}.json`),
        reservationRoot,
        probe: async () => true,
      }),
    ),
  );

  assert.notEqual(first.slot, second.slot);
  await Promise.all([first.release(), second.release()]);

  const reused = await allocatePorts({
    worktreeRoot: worktreeRoots[2],
    runtimeFile: path.join(sharedRoot, "runtime-reused.json"),
    reservationRoot,
    probe: async () => true,
  });
  assert.equal(reused.slot, firstSlotForPath(worktreeRoots[2]));
  await reused.release();
});

test("a reservation left by a crashed local process is reclaimed", async () => {
  const worktreeRoot = await temporaryWorktree();
  const reservationRoot = reservationRootFor(worktreeRoot);
  const slot = firstSlotForPath(worktreeRoot);
  const reservationPath = path.join(reservationRoot, `slot-${slot}`);
  await mkdir(reservationPath, { recursive: true });
  await writeFile(
    path.join(reservationPath, "owner.json"),
    JSON.stringify({
      ownerId: "stale-owner",
      pid: 1_073_741_824,
      hostname: hostname(),
      worktreeRoot,
      createdAt: new Date(0).toISOString(),
    }),
  );

  const selected = await allocatePorts(
    allocationOptions(worktreeRoot, { probe: async () => true }),
  );
  assert.equal(selected.slot, slot);
  await selected.release();
});

test("failed owner writes never delete a successor reservation", async () => {
  const sharedRoot = await temporaryWorktree();
  const reservationRoot = path.join(sharedRoot, "reservations");
  const worktreeRoots = [];
  for (let candidate = 0; worktreeRoots.length < 2; candidate += 1) {
    const worktreeRoot = path.join(sharedRoot, `write-race-${candidate}`);
    if (
      worktreeRoots.length === 0 ||
      firstSlotForPath(worktreeRoot) === firstSlotForPath(worktreeRoots[0])
    ) {
      worktreeRoots.push(worktreeRoot);
    }
  }

  let allowFirstOwnerWrite;
  const firstOwnerWriteMayContinue = new Promise((resolve) => {
    allowFirstOwnerWrite = resolve;
  });
  let firstDirectoryCreated;
  const firstDirectoryWasCreated = new Promise((resolve) => {
    firstDirectoryCreated = resolve;
  });
  const firstAllocation = allocatePorts({
    worktreeRoot: worktreeRoots[0],
    runtimeFile: path.join(sharedRoot, "write-race-first.json"),
    reservationRoot,
    probe: async () => true,
    writeReservationOwner: async (...args) => {
      firstDirectoryCreated();
      await firstOwnerWriteMayContinue;
      return writeFile(...args);
    },
  });

  await firstDirectoryWasCreated;
  const slot = firstSlotForPath(worktreeRoots[0]);
  const reservationPath = path.join(reservationRoot, `slot-${slot}`);
  await utimes(reservationPath, new Date(0), new Date(0));

  const successor = await allocatePorts({
    worktreeRoot: worktreeRoots[1],
    runtimeFile: path.join(sharedRoot, "write-race-successor.json"),
    reservationRoot,
    probe: async () => true,
  });
  allowFirstOwnerWrite();
  await assert.rejects(firstAllocation, { code: "EEXIST" });

  await assert.rejects(
    allocatePorts({
      worktreeRoot: path.join(sharedRoot, "write-race-third"),
      runtimeFile: path.join(sharedRoot, "write-race-third.json"),
      reservationRoot,
      overrides: {
        frontendPort: successor.frontendPort,
        studioPort: successor.studioPort,
      },
      probe: async () => true,
    }),
    /Requested slot .* is busy/,
  );
  await successor.release();
});

test("manual overrides must be complete, paired, and allowlisted", () => {
  assert.throws(() => validateOverrides({ frontendPort: "3001" }), /both/);
  assert.throws(
    () => validateOverrides({ frontendPort: "3010", studioPort: "3343" }),
    /CORS pool/,
  );
  assert.throws(
    () => validateOverrides({ frontendPort: "3001", studioPort: "3335" }),
    /same port slot/,
  );
  assert.deepEqual(
    validateOverrides({ frontendPort: "3001", studioPort: "3334" }),
    portsForSlot(1),
  );
});

test("Sanity origins cover local services, hosted Studio, and the production preview", () => {
  const productionOrigin = "https://maplewoodyearround-com-2026.vercel.app";
  const origins = desiredSanityOrigins({ productionOrigin });
  assert.equal(origins.length, SLOT_COUNT * 2 + 2);
  assert.equal(new Set(origins.map(({ origin }) => origin)).size, SLOT_COUNT * 2 + 2);
  for (let slot = 0; slot < SLOT_COUNT; slot += 1) {
    assert.deepEqual(origins[slot * 2], {
      origin: `http://localhost:${FRONTEND_BASE_PORT + slot}`,
      credentials: true,
    });
    assert.deepEqual(origins[slot * 2 + 1], {
      origin: `http://localhost:${STUDIO_BASE_PORT + slot}`,
      credentials: true,
    });
  }
  assert.deepEqual(origins.at(-2), {
    origin: "https://maplewood.sanity.studio",
    credentials: true,
  });
  assert.deepEqual(origins.at(-1), {
    origin: productionOrigin,
    credentials: true,
  });

  const originsWithoutProduction = desiredSanityOrigins();
  assert.equal(originsWithoutProduction.length, SLOT_COUNT * 2 + 1);
  assert.deepEqual(originsWithoutProduction.at(-1), {
    origin: "https://maplewood.sanity.studio",
    credentials: true,
  });
});
