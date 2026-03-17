import { describe, test, expect, vi, beforeEach } from "vitest";

// Mock "server-only" to allow importing in test environment
vi.mock("server-only", () => ({}));

// Mock next/headers cookies()
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock jose — SignJWT returns a builder that resolves to a fake token
const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
vi.mock("jose", () => {
  const builder = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  };
  return {
    SignJWT: vi.fn(() => builder),
    jwtVerify: vi.fn(),
  };
});

const { createSession } = await import("@/lib/auth");

beforeEach(() => {
  vi.clearAllMocks();
  mockSign.mockResolvedValue("mock-jwt-token");
});

describe("createSession", () => {
  test("sets an httpOnly cookie with the correct name", async () => {
    await createSession("user-1", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
  });

  test("stores the signed JWT token as the cookie value", async () => {
    await createSession("user-1", "test@example.com");

    const token = mockCookieStore.set.mock.calls[0][1];
    expect(token).toBe("mock-jwt-token");
  });

  test("sets httpOnly, sameSite lax, and path /", async () => {
    await createSession("user-1", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("sets cookie expiration to 7 days from now", async () => {
    const before = Date.now();
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const options = mockCookieStore.set.mock.calls[0][2];
    const expiresTime = new Date(options.expires).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    expect(expiresTime).toBeGreaterThanOrEqual(before + sevenDays);
    expect(expiresTime).toBeLessThanOrEqual(after + sevenDays);
  });

  test("sets secure to false outside production", async () => {
    await createSession("user-1", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.secure).toBe(false);
  });

  test("passes userId and email into the JWT payload", async () => {
    const { SignJWT } = await import("jose");

    await createSession("user-42", "hello@world.com");

    expect(SignJWT).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-42",
        email: "hello@world.com",
      })
    );
  });
});
