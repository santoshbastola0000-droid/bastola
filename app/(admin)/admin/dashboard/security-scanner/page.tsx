"use client";

import { useState } from "react";
import { privateApi } from "@/http/api/privateApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, ScanSearch, ShieldAlert } from "lucide-react";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

type ScanReport = {
  target: string;
  scannedAt: string;
  readOnly: boolean;
  maxPages: number;
  summary: {
    pagesScanned: number;
    apisObserved: number;
    findings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    riskScore: number;
  };
  slowestPages: Array<{
    url: string;
    status: number;
    durationMs: number;
    contentType: string;
    sizeBytes: number;
  }>;
  slowestApis: Array<{
    method: "GET";
    url: string;
    status: number;
    durationMs: number;
    contentType: string;
    sizeBytes: number;
  }>;
  findings: Array<{
    severity: Severity;
    title: string;
    url: string;
    detail: string;
    recommendation: string;
  }>;
};

const badgeClass: Record<Severity, string> = {
  CRITICAL: "bg-red-700 text-white",
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
  LOW: "bg-blue-100 text-blue-700 border-blue-200",
  INFO: "bg-slate-100 text-slate-700 border-slate-200",
};

function formatBytes(value: number) {
  if (!Number.isFinite(value)) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export default function SecurityScannerPage() {
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(20);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState("");

  const runScan = async () => {
    setError("");
    setReport(null);
    if (!url.trim()) {
      setError("Website URL हाल्नुहोस्।");
      return;
    }
    if (!confirmed) {
      setError("यो website scan गर्ने अनुमति/ownership छ भनेर confirm गर्नुहोस्।");
      return;
    }

    try {
      setLoading(true);
      const response = await privateApi.post("/admin/security-scanner/scan", {
        url: url.trim(),
        confirmOwnership: true,
        maxPages,
      });
      setReport(response.data.data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Scan चलाउन सकिएन। Backend log पनि जाँच गर्नुहोस्.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2">
          <ScanSearch className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Security Scanner</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          आफ्नो वा अनुमति भएको website को read-only page/API exposure र performance audit।
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website Scan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
            />
            <Input
              type="number"
              min={1}
              max={50}
              value={maxPages}
              onChange={(e) => setMaxPages(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              disabled={loading}
            />
            <Button onClick={runScan} disabled={loading || !confirmed}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  <ScanSearch className="mr-2 h-4 w-4" />
                  Scan
                </>
              )}
            </Button>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>
              म यो domain को owner हुँ वा security testing गर्न स्पष्ट अनुमति पाएको छु।
            </span>
          </label>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            Scanner ले GET/read-only requests मात्र गर्छ। Private/internal IP targets block छन्।
            Password guessing, destructive payload, brute force वा exploit execution गर्दैन।
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <SummaryCard title="Risk Score" value={report.summary.riskScore} suffix="/100" />
            <SummaryCard title="Pages" value={report.summary.pagesScanned} />
            <SummaryCard title="APIs" value={report.summary.apisObserved} />
            <SummaryCard title="Critical" value={report.summary.critical} />
            <SummaryCard title="High" value={report.summary.high} />
            <SummaryCard title="Findings" value={report.summary.findings} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {report.summary.critical || report.summary.high ? (
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                Important Risks
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.findings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  यो passive scan मा finding भेटिएन।
                </p>
              ) : (
                report.findings.map((finding, index) => (
                  <div key={`${finding.title}-${index}`} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={badgeClass[finding.severity]}>
                        {finding.severity}
                      </Badge>
                      <span className="font-semibold">{finding.title}</span>
                    </div>
                    <p className="mt-2 break-all text-xs text-muted-foreground">{finding.url}</p>
                    <p className="mt-2 text-sm">{finding.detail}</p>
                    <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                      <strong>Fix:</strong> {finding.recommendation}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <TimingTable
            title="Slow Pages"
            rows={report.slowestPages}
          />

          <TimingTable
            title="Observed API Endpoints"
            rows={report.slowestApis}
            showMethod
          />
        </>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  suffix = "",
}: {
  title: string;
  value: number;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold">
          {value}
          <span className="text-sm font-normal text-muted-foreground">{suffix}</span>
        </p>
      </CardContent>
    </Card>
  );
}

function TimingTable({
  title,
  rows,
  showMethod = false,
}: {
  title: string;
  rows: Array<{
    url: string;
    status: number;
    durationMs: number;
    contentType: string;
    sizeBytes: number;
    method?: "GET";
  }>;
  showMethod?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Data भेटिएन।</p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left">
                {showMethod && <th className="p-2">Method</th>}
                <th className="p-2">URL</th>
                <th className="p-2">Status</th>
                <th className="p-2">Time</th>
                <th className="p-2">Size</th>
                <th className="p-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.url} className="border-b align-top">
                  {showMethod && <td className="p-2 font-medium">{row.method || "GET"}</td>}
                  <td className="max-w-[520px] break-all p-2">{row.url}</td>
                  <td className="p-2">{row.status}</td>
                  <td className="p-2">
                    <span className={row.durationMs >= 3000 ? "font-semibold text-red-600" : row.durationMs >= 1200 ? "font-semibold text-amber-600" : ""}>
                      {row.durationMs} ms
                    </span>
                  </td>
                  <td className="p-2">{formatBytes(row.sizeBytes)}</td>
                  <td className="max-w-[220px] break-all p-2 text-xs text-muted-foreground">
                    {row.contentType || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
