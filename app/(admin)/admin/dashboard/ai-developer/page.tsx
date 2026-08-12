"use client";

import { useState } from "react";
import useTokenStore from "@/store";

type ProposalResult = {
  success?: boolean;
  status?: string;
  proposalId?: string;
  prompt?: string;
  proposal?: string;
  filesRead?: string[];
  message?: string;
  error?: string;
};

export default function AiDeveloperPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [result, setResult] = useState<ProposalResult | null>(null);
  const [error, setError] = useState("");
  const [approveMessage, setApproveMessage] = useState("");

  const token = useTokenStore((state) => state.token);

  async function proposeChange() {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setApproveMessage("");
    setResult(null);

    try {
      const response = await fetch(
        "https://api.roomkhoj.com/ai-developer/propose",
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

  async function approveProposal() {
    if (!result?.proposalId) return;

    setApproving(true);
    setError("");
    setApproveMessage("");

    try {
      const response = await fetch(
        `https://api.roomkhoj.com/ai-developer/proposals/${result.proposalId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        },
      );

      console.log("AI DEV APPROVE STATUS:", response.status);
      console.log("AI DEV APPROVE OK:", response.ok);

      const data = await response.json();

      console.log("AI DEV APPROVE RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || "Approval failed",
        );
      }

      setResult((current) =>
        current
          ? {
              ...current,
              status: data.status || "APPROVED",
              message: data.message,
            }
          : current,
      );

      setApproveMessage(
        data.message || "Proposal approved and applied successfully.",
      );
    } catch (err: any) {
      setError(err.message || "Approval failed");
    } finally {
      setApproving(false);
    }
  }

  const canApprove =
    result?.status === "PENDING_APPROVAL" &&
    !!result.proposalId &&
    !approving;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Developer</h1>
        <p className="mt-1 text-sm text-gray-500">
          Describe a code change and AI will prepare a proposal for
          admin approval.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <label className="mb-2 block text-sm font-medium">
          What should AI change?
        </label>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Example: Improve the approved job search ranking..."
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

      {approveMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {approveMessage}
        </div>
      )}

      {result && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Proposal Created
            </h2>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                result.status === "PENDING_APPROVAL"
                  ? "bg-yellow-100 text-yellow-800"
                  : result.status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {result.status || "UNKNOWN"}
            </span>
          </div>

          {result.proposalId && (
            <div className="mt-3 text-xs text-gray-500">
              Proposal ID: {result.proposalId}
            </div>
          )}

          {result.filesRead && result.filesRead.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">
                Files Read
              </h3>

              <div className="rounded-lg bg-gray-50 p-3 text-xs">
                {result.filesRead.map((file) => (
                  <div key={file} className="py-1">
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.proposal && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold">
                Proposed Changes
              </h3>

              <pre className="max-h-[500px] overflow-auto rounded-lg bg-gray-100 p-4 text-xs whitespace-pre-wrap">
                {result.proposal}
              </pre>
            </div>
          )}

          {canApprove && (
            <div className="mt-5 border-t pt-5">
              <button
                type="button"
                onClick={approveProposal}
                disabled={!canApprove}
                className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {approving
                  ? "Applying Changes..."
                  : "Approve & Apply"}
              </button>

              <p className="mt-2 text-xs text-gray-500">
                This will validate the patch and apply it to the
                source code.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
