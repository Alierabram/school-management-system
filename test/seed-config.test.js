const test = require("node:test");
const assert = require("node:assert/strict");
const { buildInitialUsers } = require("../scripts/seed");

test("production seed requires unique registrar credentials", () => {
  assert.throws(
    () => buildInitialUsers({ NODE_ENV: "production" }),
    /INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD/
  );
  assert.throws(
    () => buildInitialUsers({
      NODE_ENV: "production",
      INITIAL_ADMIN_EMAIL: "registrar@example.com",
      INITIAL_ADMIN_PASSWORD: "short"
    }),
    /at least 12 characters/
  );

  const users = buildInitialUsers({
    NODE_ENV: "production",
    INITIAL_ADMIN_EMAIL: "Registrar@example.com ",
    INITIAL_ADMIN_PASSWORD: "a-unique-production-password"
  });
  assert.deepEqual(users, [{
    name: "BugemaDesk Registrar",
    email: "registrar@example.com",
    password: "a-unique-production-password",
    role: "Registrar"
  }]);
});

test("non-production seeding keeps the local demo accounts", () => {
  const users = buildInitialUsers({ NODE_ENV: "development" });
  assert.equal(users.length, 3);
  assert.equal(users[0].role, "Registrar");
});
