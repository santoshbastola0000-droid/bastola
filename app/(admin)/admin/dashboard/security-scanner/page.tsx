"use client";

import { useEffect, useRef, useState } from "react";
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
    pagesDiscovered: number;
    pagesScanned: number;
    pagesRemaining: number;
    apisObserved: number;
    findings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    riskScore: number;
    userDataTheftFindings: number;
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
    category?: "USER_DATA_THEFT" | "SECURITY" | "PERFORMANCE";
    sampleEvidence?: {
      fields: string[];
      sample: Record<string, string>;
      authContext: "public" | "user" | "admin" | "unknown";
    };
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
  const [maxPages, setMaxPages] = useState(2000);
  const [scanAll, setScanAll] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<{ scannedPages: number; discoveredPages: number; remainingPages: number; scannedApis: number; currentUrl?: string; message?: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

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
      const response = await privateApi.post("/admin/security-scanner/start", {
        url: url.trim(),
        confirmOwnership: true,
        scanAll,
        maxPages,
      });
      const jobId = response.data.data.jobId;
      setProgress({ scannedPages: 0, discoveredPages: 1, remainingPages: 1, scannedApis: 0, message: "स्क्यान सुरु भयो।" });
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const statusResponse = await privateApi.get(`/admin/security-scanner/status/${jobId}`);
          const status = statusResponse.data.data;
          setProgress({ scannedPages: status.scannedPages, discoveredPages: status.discoveredPages, remainingPages: status.remainingPages, scannedApis: status.scannedApis, currentUrl: status.currentUrl, message: status.message });
          if (status.state === "COMPLETED") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setReport(status.result);
            setLoading(false);
          } else if (status.state === "FAILED") {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setError(status.error || "स्क्यान असफल भयो।");
            setLoading(false);
          }
        } catch (pollError: any) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          setError(pollError?.response?.data?.message || "स्क्यान स्थिति लिन सकिएन।");
          setLoading(false);
        }
      }, 1500);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Scan चलाउन सकिएन। Backend log पनि जाँच गर्नुहोस्.",
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Scan चलाउन सकिएन। Backend log पनि जाँच गर्नुहोस्.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-2">
          <ScanSearch className="h-6 w-6" />
          <h1 className="text-2xl font-bold">सुरक्षा स्क्यानर</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          आफ्नो वा स्पष्ट अनुमति भएको website का page, API, data leak risk र performance को read-only audit।
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Website स्क्यान</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_170px_auto]">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
            />
            <Input
              type="number"
              min={1}
              max={2000}
              value={maxPages}
              onChange={(e) => setMaxPages(Math.max(1, Math.min(2000, Number(e.target.value) || 1)))}
              disabled={loading}
            />
            <Button onClick={runScan} disabled={loading || !confirmed}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  स्क्यान हुँदैछ
                </>
              ) : (
                <>
                  <ScanSearch className="mr-2 h-4 w-4" />
                  स्क्यान सुरु गर्नुहोस्
                </>
              )}
            </Button>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={scanAll}
              onChange={(e) => setScanAll(e.target.checked)}
              className="mt-1"
              disabled={loading}
            />
            <span>भेटिएका सबै page scan गर्नुहोस् (सुरक्षा cap: 2000 pages)</span>
          </label>

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

          {loading && progress && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <SummaryCard title="कुल भेटिएका page" value={progress.discoveredPages} />
                <SummaryCard title="स्क्यान भएका" value={progress.scannedPages} />
                <SummaryCard title="बाँकी" value={progress.remainingPages} />
                <SummaryCard title="API भेटिएका" value={progress.scannedApis} />
              </div>
              <p className="text-sm font-medium">{progress.message || "स्क्यान हुँदैछ..."}</p>
              {progress.currentUrl && <p className="break-all text-xs text-muted-foreground">{progress.currentUrl}</p>}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
            <SummaryCard title="जोखिम स्कोर" value={report.summary.riskScore} suffix="/100" />
            <SummaryCard title="कुल भेटिएका page" value={report.summary.pagesDiscovered} />
            <SummaryCard title="स्क्यान भएका page" value={report.summary.pagesScanned} />
            <SummaryCard title="बाँकी page" value={report.summary.pagesRemaining} />
            <SummaryCard title="API" value={report.summary.apisObserved} />
            <SummaryCard title="Critical" value={report.summary.critical} />
            <SummaryCard title="High" value={report.summary.high} />
            <SummaryCard title="Data Theft Risk" value={report.summary.userDataTheftFindings} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {report.summary.critical || report.summary.high ? (
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
                महत्वपूर्ण जोखिमहरू
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
                      {finding.category === "USER_DATA_THEFT" && <Badge variant="outline">User Data Theft Risk</Badge>}
                    </div>
                    <p className="mt-2 break-all text-xs text-muted-foreground">{finding.url}</p>
                    <p className="mt-2 text-sm">{finding.detail}</p>
                    {finding.sampleEvidence && (
                      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                        <strong>Sample Evidence:</strong>
                        <div className="mt-2">Fields: {finding.sampleEvidence.fields.join(", ")}</div>
                        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">{JSON.stringify(finding.sampleEvidence.sample, null, 2)}</pre>
                        <div className="mt-1 text-xs text-muted-foreground">Access: {finding.sampleEvidence.authContext}</div>
                      </div>
                    )}
                    <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                      <strong>समाधान:</strong> {finding.recommendation}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <TimingTable
            title="ढिला Pages"
            rows={report.slowestPages}
          />

          <TimingTable
            title="भेटिएका API Endpoints"
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
