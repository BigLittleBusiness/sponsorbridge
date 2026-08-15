import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";

const password = process.env.E2E_TEST_PASSWORD;

describe("E2E test credential configuration", () => {
  let server: ReturnType<typeof createServer> | undefined;

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      if (!server) return resolve();
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
  });

  it("makes the securely configured test password available to a guarded local API probe", async () => {
    expect(password).toBeTruthy();
    expect(password).toMatch(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{16,}$/);

    server = createServer((request, response) => {
      const supplied = request.headers["x-e2e-test-password"];
      response.statusCode = supplied === password ? 204 : 401;
      response.end();
    });

    await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test probe did not bind to a TCP port");

    const response = await fetch(`http://127.0.0.1:${address.port}/e2e-auth-probe`, {
      headers: { "x-e2e-test-password": password! },
    });

    expect(response.status).toBe(204);
  });
});
