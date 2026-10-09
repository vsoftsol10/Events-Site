import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  getDeadlineInstant as frontendInstant,
  isRegistrationOpen as frontendOpen,
} from "../src/utils/deadline.js";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "../..");
const backendSource = await readFile(path.join(root, "backend/index.js"), "utf8");
const helperStart = backendSource.indexOf("const IST_OFFSET_MS =");
const helperEnd = backendSource.indexOf("const PAYMENT_STATUS =", helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, "backend deadline helper block exists");
const backendContext = { Date: globalThis.Date, console: { warn() {} } };
vm.runInNewContext(
  `${backendSource.slice(helperStart, helperEnd)}\nglobalThis.helpers = { getDeadlineInstant, isRegistrationOpen, normalizeDeadline };`,
  backendContext,
);
const backend = backendContext.helpers;

if (process.env.DEADLINE_CHECK_CHILD === "1") {
  const expectedDateOnly = Date.parse("2026-10-11T18:29:59.000Z");
  const testInputs = [
    ["date only", "2026-10-11", expectedDateOnly],
    ["local IST datetime", "2026-10-11T18:30", Date.parse("2026-10-11T13:00:00Z")],
    ["explicit +05:30", "2026-10-11T18:30:00+05:30", Date.parse("2026-10-11T13:00:00Z")],
    ["explicit Z", "2026-10-11T18:30:00Z", Date.parse("2026-10-11T18:30:00Z")],
  ];
  for (const [label, value, expected] of testInputs) {
    assert.equal(frontendInstant(value), expected, `frontend ${label}`);
    assert.equal(backend.getDeadlineInstant(value), expected, `backend ${label}`);
  }
  for (const value of ["", null, "abc", "2026-13-45"]) {
    assert.equal(frontendOpen({ deadline: value }, 0), false, `frontend invalid ${value}`);
    assert.equal(backend.isRegistrationOpen({ deadline: value }, 0), false, `backend invalid ${value}`);
  }
  const close = expectedDateOnly;
  for (const [delta, open] of [[-1000, true], [0, false], [1000, false]]) {
    assert.equal(frontendOpen({ deadline: "2026-10-11" }, close + delta), open, `frontend boundary ${delta}`);
    assert.equal(backend.isRegistrationOpen({ deadline: "2026-10-11" }, close + delta), open, `backend boundary ${delta}`);
  }
  assert.equal(frontendOpen({ status: "closed", deadline: "2026-10-12" }, 0), false);
  assert.equal(backend.isRegistrationOpen({ status: "closed", deadline: "2026-10-12" }, 0), false);
  const eventStart = Date.parse("2026-10-10T11:00:00Z");
  assert.equal(frontendOpen({ deadline: "2026-10-11" }, eventStart), true);
  assert.equal(backend.isRegistrationOpen({ deadline: "2026-10-11" }, eventStart), true);
  assert.equal(backend.normalizeDeadline("2026-10-11"), "2026-10-11T23:59:59+05:30");
  assert.equal(backend.normalizeDeadline("2026-10-11T18:30"), "2026-10-11T18:30:00+05:30");
  assert.throws(() => backend.normalizeDeadline("2026-13-45"));
  process.stdout.write(`PASS deadline cases TZ=${process.env.TZ}\n`);
} else {
  for (const tz of ["Asia/Kolkata", "UTC", "America/Los_Angeles"]) {
    const run = spawnSync(process.execPath, [scriptPath], {
      env: { ...process.env, TZ: tz, DEADLINE_CHECK_CHILD: "1" },
      encoding: "utf8",
    });
    if (run.status !== 0) {
      process.stderr.write(run.stdout + run.stderr);
      process.exitCode = run.status || 1;
      break;
    }
    process.stdout.write(run.stdout);
  }
}
