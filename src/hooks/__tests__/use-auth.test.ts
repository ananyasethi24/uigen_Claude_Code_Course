import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

// Mock dependencies
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

const mockedSignIn = vi.mocked(signInAction);
const mockedSignUp = vi.mocked(signUpAction);
const mockedGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockedClearAnonWork = vi.mocked(clearAnonWork);
const mockedGetProjects = vi.mocked(getProjects);
const mockedCreateProject = vi.mocked(createProject);

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetAnonWorkData.mockReturnValue(null);
});

describe("useAuth", () => {
  it("returns signIn, signUp, and isLoading", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.signIn).toBeTypeOf("function");
    expect(result.current.signUp).toBeTypeOf("function");
    expect(result.current.isLoading).toBe(false);
  });

  describe("signIn", () => {
    it("calls signInAction and redirects to anon work project when anon data exists", async () => {
      mockedSignIn.mockResolvedValue({ success: true });
      mockedGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "hello" }],
        fileSystemData: { "App.jsx": "code" },
      });
      mockedCreateProject.mockResolvedValue({
        id: "proj-anon",
        name: "Design from 12:00:00",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "u1",
        messages: "[]",
        fileSystemData: "{}",
      });

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("a@b.com", "pass123");
      });

      expect(mockedSignIn).toHaveBeenCalledWith("a@b.com", "pass123");
      expect(mockedCreateProject).toHaveBeenCalledWith({
        name: expect.stringContaining("Design from"),
        messages: [{ role: "user", content: "hello" }],
        data: { "App.jsx": "code" },
      });
      expect(mockedClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-anon");
      expect(returnValue).toEqual({ success: true });
    });

    it("redirects to most recent project when no anon work exists", async () => {
      mockedSignIn.mockResolvedValue({ success: true });
      mockedGetProjects.mockResolvedValue([
        { id: "proj-1", name: "My Project", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "pass123");
      });

      expect(mockedGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
      expect(mockedCreateProject).not.toHaveBeenCalled();
    });

    it("creates a new project when no anon work and no existing projects", async () => {
      mockedSignIn.mockResolvedValue({ success: true });
      mockedGetProjects.mockResolvedValue([]);
      mockedCreateProject.mockResolvedValue({
        id: "proj-new",
        name: "New Design #42",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "u1",
        messages: "[]",
        fileSystemData: "{}",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "pass123");
      });

      expect(mockedCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #\d+$/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/proj-new");
    });

    it("does not redirect when signIn fails", async () => {
      mockedSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signIn("a@b.com", "wrong");
      });

      expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockedGetProjects).not.toHaveBeenCalled();
      expect(mockedCreateProject).not.toHaveBeenCalled();
    });

    it("sets isLoading to true during sign in and false after", async () => {
      let resolveSignIn!: (val: { success: boolean }) => void;
      mockedSignIn.mockReturnValue(
        new Promise((res) => {
          resolveSignIn = res;
        })
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      let signInPromise: Promise<any>;
      act(() => {
        signInPromise = result.current.signIn("a@b.com", "pass123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: false });
        await signInPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("resets isLoading even when signInAction throws", async () => {
      mockedSignIn.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "pass123").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("skips anon work with empty messages array", async () => {
      mockedSignIn.mockResolvedValue({ success: true });
      mockedGetAnonWorkData.mockReturnValue({
        messages: [],
        fileSystemData: {},
      });
      mockedGetProjects.mockResolvedValue([
        { id: "proj-1", name: "P", createdAt: new Date(), updatedAt: new Date() },
      ]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "pass123");
      });

      // Should not create project from anon work, should fall through to getProjects
      expect(mockedClearAnonWork).not.toHaveBeenCalled();
      expect(mockedGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });
  });

  describe("signUp", () => {
    it("calls signUpAction and handles post-sign-in redirect", async () => {
      mockedSignUp.mockResolvedValue({ success: true });
      mockedGetProjects.mockResolvedValue([]);
      mockedCreateProject.mockResolvedValue({
        id: "proj-new",
        name: "New Design #1",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "u1",
        messages: "[]",
        fileSystemData: "{}",
      });

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("new@user.com", "pass123");
      });

      expect(mockedSignUp).toHaveBeenCalledWith("new@user.com", "pass123");
      expect(returnValue).toEqual({ success: true });
      expect(mockPush).toHaveBeenCalledWith("/proj-new");
    });

    it("does not redirect when signUp fails", async () => {
      mockedSignUp.mockResolvedValue({ success: false, error: "Email taken" });

      const { result } = renderHook(() => useAuth());

      let returnValue: any;
      await act(async () => {
        returnValue = await result.current.signUp("taken@user.com", "pass123");
      });

      expect(returnValue).toEqual({ success: false, error: "Email taken" });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("sets isLoading during sign up and resets after", async () => {
      let resolveSignUp!: (val: { success: boolean }) => void;
      mockedSignUp.mockReturnValue(
        new Promise((res) => {
          resolveSignUp = res;
        })
      );

      const { result } = renderHook(() => useAuth());

      let signUpPromise: Promise<any>;
      act(() => {
        signUpPromise = result.current.signUp("a@b.com", "pass123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: false });
        await signUpPromise!;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("resets isLoading even when signUpAction throws", async () => {
      mockedSignUp.mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("a@b.com", "pass123").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("migrates anon work on successful sign up", async () => {
      mockedSignUp.mockResolvedValue({ success: true });
      mockedGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "build me a button" }],
        fileSystemData: { "App.jsx": "export default () => <button />" },
      });
      mockedCreateProject.mockResolvedValue({
        id: "proj-migrated",
        name: "Design from 3:00:00",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "u1",
        messages: "[]",
        fileSystemData: "{}",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@user.com", "pass123");
      });

      expect(mockedCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: "user", content: "build me a button" }],
          data: { "App.jsx": "export default () => <button />" },
        })
      );
      expect(mockedClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/proj-migrated");
    });
  });
});
