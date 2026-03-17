"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { User, Bot, Loader2, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ToolInvocationStatus } from "./ToolInvocationStatus";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-5 shadow-lg shadow-blue-500/20">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <p className="text-neutral-900 font-semibold text-lg mb-1.5 tracking-tight">
          What would you like to build?
        </p>
        <p className="text-neutral-400 text-sm max-w-xs leading-relaxed">
          Describe a React component and I&apos;ll generate it for you in real time
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 py-6 scroll-smooth">
      <div className="space-y-5 max-w-3xl mx-auto w-full">
        {messages.map((message, messageIndex) => (
          <div
            key={message.id || message.content}
            className={cn(
              "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
            )}

            <div className={cn(
              "flex flex-col gap-1.5 max-w-[80%]",
              message.role === "user" ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-2xl px-4 py-2.5",
                message.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/10 rounded-br-md"
                  : "bg-white/80 backdrop-blur-sm text-neutral-800 border border-neutral-200/80 shadow-sm rounded-bl-md"
              )}>
                <div className={cn(
                  "text-[0.9rem] leading-relaxed",
                  message.role === "user" ? "text-white/95" : ""
                )}>
                  {message.parts ? (
                    <>
                      {message.parts.map((part, partIndex) => {
                        switch (part.type) {
                          case "text":
                            return message.role === "user" ? (
                              <span key={partIndex} className="whitespace-pre-wrap">{part.text}</span>
                            ) : (
                              <MarkdownRenderer
                                key={partIndex}
                                content={part.text}
                                className="prose-sm"
                              />
                            );
                          case "reasoning":
                            return (
                              <div key={partIndex} className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                                <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">Thinking</span>
                                <span className="text-sm text-neutral-600 leading-relaxed">{part.reasoning}</span>
                              </div>
                            );
                          case "tool-invocation":
                            return <ToolInvocationStatus key={partIndex} toolInvocation={part.toolInvocation} />;
                          case "source":
                            return (
                              <div key={partIndex} className="mt-2 text-xs text-neutral-400 font-mono">
                                Source: {JSON.stringify(part.source)}
                              </div>
                            );
                          case "step-start":
                            return partIndex > 0 ? <hr key={partIndex} className="my-3 border-neutral-100" /> : null;
                          default:
                            return null;
                        }
                      })}
                      {isLoading &&
                        message.role === "assistant" &&
                        messageIndex === messages.length - 1 && (
                          <div className="flex items-center gap-2 mt-3 text-neutral-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span className="text-sm">Generating...</span>
                          </div>
                        )}
                    </>
                  ) : message.content ? (
                    message.role === "user" ? (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                      <MarkdownRenderer content={message.content} className="prose-sm" />
                    )
                  ) : isLoading &&
                    message.role === "assistant" &&
                    messageIndex === messages.length - 1 ? (
                    <div className="flex items-center gap-2 text-neutral-400">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-8 h-8 rounded-full bg-neutral-800 shadow-sm flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
