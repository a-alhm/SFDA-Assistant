"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function ChatPage() {
  const t = useTranslations('chat');
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          locale,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          sources: data.sources,
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t('errors.generic'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/${locale}`}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <svg
                  className="w-6 h-6 rtl:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t('version')}
              </span>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="container mx-auto px-4 py-8 max-w-4xl h-[calc(100vh-80px)] flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('welcome.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {t('welcome.subtitle')}
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-start">
                  <button
                    onClick={() => setInput(t('suggestions.q1'))}
                    className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('suggestions.q1')}
                    </p>
                  </button>
                  <button
                    onClick={() => setInput(t('suggestions.q2'))}
                    className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('suggestions.q2')}
                    </p>
                  </button>
                  <button
                    onClick={() => setInput(t('suggestions.q3'))}
                    className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('suggestions.q3')}
                    </p>
                  </button>
                  <button
                    onClick={() => setInput(t('suggestions.q4'))}
                    className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('suggestions.q4')}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-3xl w-full sm:w-auto rounded-lg p-4 break-words ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold mb-2 text-gray-600 dark:text-gray-400">
                        {t('sources')}
                      </p>
                      <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                        {message.sources.map((source, i) => (
                          <li key={i}>• {source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('input.placeholder')}
              className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap flex-shrink-0 w-full sm:w-auto"
            >
              {t('input.send')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
