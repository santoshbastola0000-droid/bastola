"use client";

import { useState } from "react";
import useTokenStore from "@/store";

export default function AiDeveloperPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const token = useTokenStore((state) => state.token);

  async function proposeChange() {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `https://api.roomkhoj.com/ai-developer/propose`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || "Proposal failed",
        );
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Developer</h1>
        <p className="mt-1 text-sm text-gray-500">
          Describe a change and AI will prepare a code proposal.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium">
          What should AI change?
        </label>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Add salary filtering to approved job search..."
          className="min-h-[180px] w-full rounded-lg border p-4 outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="button"
          onClick={proposeChange}
          disabled={loading || !prompt.trim()}
          className="mt-4 rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {loading ? "AI is working..." : "Generate Proposal"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">
            Proposal Created
          </h2>

          <pre className="mt-4 overflow-auto rounded-lg bg-gray-100 p-4 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
