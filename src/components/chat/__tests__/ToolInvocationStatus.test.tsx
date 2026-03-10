import { test, expect, vi, afterEach, describe } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolMessage, ToolInvocationStatus } from "../ToolInvocationStatus";

afterEach(() => {
  cleanup();
});

describe("getToolMessage", () => {
  test("str_replace_editor create in-progress", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: { command: "create", path: "/App.jsx" },
      })
    ).toBe("Creating App.jsx");
  });

  test("str_replace_editor create completed", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "result",
        args: { command: "create", path: "/App.jsx" },
        result: "Success",
      })
    ).toBe("Created App.jsx");
  });

  test("str_replace_editor str_replace in-progress", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: { command: "str_replace", path: "/Card.jsx" },
      })
    ).toBe("Editing Card.jsx");
  });

  test("str_replace_editor str_replace completed", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "result",
        args: { command: "str_replace", path: "/Card.jsx" },
        result: "Success",
      })
    ).toBe("Edited Card.jsx");
  });

  test("str_replace_editor insert in-progress", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: { command: "insert", path: "/index.tsx" },
      })
    ).toBe("Editing index.tsx");
  });

  test("str_replace_editor insert completed", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "result",
        args: { command: "insert", path: "/index.tsx" },
        result: "Done",
      })
    ).toBe("Edited index.tsx");
  });

  test("str_replace_editor view in-progress", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: { command: "view", path: "/App.jsx" },
      })
    ).toBe("Viewing App.jsx");
  });

  test("str_replace_editor view completed", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "result",
        args: { command: "view", path: "/App.jsx" },
        result: "content",
      })
    ).toBe("Viewed App.jsx");
  });

  test("str_replace_editor undo_edit in-progress", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
        args: { command: "undo_edit", path: "/App.jsx" },
      })
    ).toBe("Reverting App.jsx");
  });

  test("str_replace_editor undo_edit completed", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "result",
        args: { command: "undo_edit", path: "/App.jsx" },
        result: "reverted",
      })
    ).toBe("Reverted App.jsx");
  });

  test("file_manager rename in-progress", () => {
    expect(
      getToolMessage({
        toolName: "file_manager",
        state: "call",
        args: { command: "rename", path: "/old.jsx" },
      })
    ).toBe("Renaming old.jsx");
  });

  test("file_manager rename completed", () => {
    expect(
      getToolMessage({
        toolName: "file_manager",
        state: "result",
        args: { command: "rename", path: "/old.jsx" },
        result: "renamed",
      })
    ).toBe("Renamed old.jsx");
  });

  test("file_manager delete in-progress", () => {
    expect(
      getToolMessage({
        toolName: "file_manager",
        state: "call",
        args: { command: "delete", path: "/temp.jsx" },
      })
    ).toBe("Deleting temp.jsx");
  });

  test("file_manager delete completed", () => {
    expect(
      getToolMessage({
        toolName: "file_manager",
        state: "result",
        args: { command: "delete", path: "/temp.jsx" },
        result: "deleted",
      })
    ).toBe("Deleted temp.jsx");
  });

  test("nested path extracts just the filename", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "result",
        args: { command: "create", path: "/src/components/ui/Button.tsx" },
        result: "Success",
      })
    ).toBe("Created Button.tsx");
  });

  test("missing args falls back to raw tool name", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "call",
      })
    ).toBe("str_replace_editor");
  });

  test("unknown tool name falls back to raw tool name", () => {
    expect(
      getToolMessage({
        toolName: "unknown_tool",
        state: "call",
        args: { command: "do_something", path: "/file.tsx" },
      })
    ).toBe("unknown_tool");
  });

  test("partial-call state treated as in-progress", () => {
    expect(
      getToolMessage({
        toolName: "str_replace_editor",
        state: "partial-call",
        args: { command: "create", path: "/App.jsx" },
      })
    ).toBe("Creating App.jsx");
  });
});

describe("ToolInvocationStatus component", () => {
  test("completed state renders green dot", () => {
    const { container } = render(
      <ToolInvocationStatus
        toolInvocation={{
          toolName: "str_replace_editor",
          state: "result",
          args: { command: "create", path: "/App.jsx" },
          result: "Success",
        }}
      />
    );

    const greenDot = container.querySelector(".bg-emerald-500");
    expect(greenDot).not.toBeNull();
  });

  test("in-progress state renders spinner", () => {
    const { container } = render(
      <ToolInvocationStatus
        toolInvocation={{
          toolName: "str_replace_editor",
          state: "call",
          args: { command: "create", path: "/App.jsx" },
        }}
      />
    );

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
  });

  test("displays friendly message text", () => {
    render(
      <ToolInvocationStatus
        toolInvocation={{
          toolName: "str_replace_editor",
          state: "result",
          args: { command: "create", path: "/App.jsx" },
          result: "Success",
        }}
      />
    );

    expect(screen.getByText("Created App.jsx")).toBeDefined();
  });
});
