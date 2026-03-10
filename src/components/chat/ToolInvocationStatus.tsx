import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state: string;
  args?: Record<string, string>;
  result?: unknown;
}

export function getToolMessage(toolInvocation: ToolInvocation): string {
  const { toolName, state, args } = toolInvocation;
  const isCompleted = state === "result" && toolInvocation.result;
  const path = args?.path;
  const file = path ? path.split("/").pop() : undefined;
  const command = args?.command;

  if (toolName === "str_replace_editor" && command && file) {
    const messages: Record<string, [string, string]> = {
      create: ["Creating", "Created"],
      str_replace: ["Editing", "Edited"],
      insert: ["Editing", "Edited"],
      view: ["Viewing", "Viewed"],
      undo_edit: ["Reverting", "Reverted"],
    };
    const pair = messages[command];
    if (pair) {
      return `${isCompleted ? pair[1] : pair[0]} ${file}`;
    }
  }

  if (toolName === "file_manager" && command && file) {
    const messages: Record<string, [string, string]> = {
      rename: ["Renaming", "Renamed"],
      delete: ["Deleting", "Deleted"],
    };
    const pair = messages[command];
    if (pair) {
      return `${isCompleted ? pair[1] : pair[0]} ${file}`;
    }
  }

  return toolName;
}

interface ToolInvocationStatusProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationStatus({ toolInvocation }: ToolInvocationStatusProps) {
  const message = getToolMessage(toolInvocation);
  const isCompleted = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isCompleted ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}
