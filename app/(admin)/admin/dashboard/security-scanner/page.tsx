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
  evidencePolicy?: string;
  pageAudits?: Array<{ url: string; method: string; status: number; scannedAt: string; findingCount: number; tests: Array<{ name: string; status: 'CHECKED' | 'SKIPPED'; findingCount: number; reason?: string }> }>;

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
  const [history, setHistory] = useState<Array<{ id: string; target: string; state: string; scannedPages: number; createdAt: string }>>([]);
  const [historyError, setHistoryError] = useState('');
  const [pageFilter, setPageFilter] = useState('');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [advancedResult, setAdvancedResult] = useState<any>(null);
  const [tokenA, setTokenA] = useState("");
  const [tokenB, setTokenB] = useState("");
  const [paths, setPaths] = useState("/api/user/profile\n/api/messages");
  const [wsUrl, setWsUrl] = useState("");
  const [artifactText, setArtifactText] = useState("");
  const [progress, setProgress] = useState<{ scannedPages: number; discoveredPages: number; remainingPages: number; scannedApis: number; currentUrl?: string; message?: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    privateApi.get('/admin/security-scanner/history?limit=25')
      .then(r => setHistory(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => setHistoryError('Scan history अहिले उपलब्ध छैन। Backend update लागू भएको छ कि जाँच्नुहोस्।'));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

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


      <Card>
        <CardHeader><CardTitle>Previous scan history</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {historyError && <p className="text-sm text-muted-foreground">{historyError}</p>}
          {history.length === 0 && !historyError && <p className="text-sm text-muted-foreground">No stored scans found.</p>}
          {history.map(job => <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-xs">
            <span className="break-all">{job.target} · {job.scannedPages} pages · {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'Unknown date'}</span>
            <div className="flex items-center gap-2"><Badge variant="outline">{job.state}</Badge>{job.state === 'COMPLETED' && <Button size="sm" variant="outline" onClick={async () => { try { setError(''); const response = await privateApi.get(`/admin/security-scanner/status/${encodeURIComponent(job.id)}`); if (response.data?.data?.result) setReport(response.data.data.result); else setError('Report उपलब्ध छैन।'); } catch (e: any) { setError(e?.response?.data?.message || 'Previous report खोल्न सकिएन।'); } }}>View report</Button>}</div>
          </div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Defensive Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            यी checks आफ्नो RoomKhoj वा स्पष्ट अनुमति भएको system मा मात्र चलाउनुहोस्। Production मा destructive exploit वा brute-force चल्दैन।
          </div>

          <div className="space-y-2">
            <p className="font-medium">Two-account IDOR/BOLA check</p>
            <div className="grid gap-2 md:grid-cols-2">
              <Input value={tokenA} onChange={(e) => setTokenA(e.target.value)} placeholder="Test account A bearer token" type="password" />
              <Input value={tokenB} onChange={(e) => setTokenB(e.target.value)} placeholder="Test account B bearer token" type="password" />
            </div>
            <textarea
              className="min-h-24 w-full rounded-md border bg-background p-3 text-sm"
              value={paths}
              onChange={(e) => setPaths(e.target.value)}
              placeholder="/api/user/profile"
            />
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  setError("");
                  const r = await privateApi.post("/admin/security-scanner/authorized-access", {
                    baseUrl: url.trim(),
                    tokenA,
                    tokenB,
                    paths: paths.split("\n").map((x) => x.trim()).filter(Boolean),
                  });
                  setAdvancedResult(r.data.data);
                } catch (e: any) {
                  setError(e?.response?.data?.message || e?.message || "Authorized audit असफल भयो।");
                }
              }}
              disabled={!url.trim() || !tokenA || !tokenB}
            >
              IDOR/BOLA सुरक्षित जाँच
            </Button>
          </div>

          <div className="space-y-2">
            <p className="font-medium">WebSocket / Socket endpoint audit</p>
            <div className="flex gap-2">
              <Input value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} placeholder="wss://example.com/socket.io/" />
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setError("");
                    const r = await privateApi.post("/admin/security-scanner/websocket", { url: wsUrl });
                    setAdvancedResult(r.data.data);
                  } catch (e: any) {
                    setError(e?.response?.data?.message || e?.message || "WebSocket audit असफल भयो।");
                  }
                }}
                disabled={!wsUrl.trim()}
              >
                WebSocket जाँच
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Source / OpenAPI / Mobile traffic / VPS config audit</p>
            <textarea
              className="min-h-40 w-full rounded-md border bg-background p-3 text-sm"
              value={artifactText}
              onChange={(e) => setArtifactText(e.target.value)}
              placeholder="यहाँ source snippet, package.json/lockfile, OpenAPI/Har text, वा Nginx/Redis/PostgreSQL config paste गर्नुहोस्"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={async () => {
                const r = await privateApi.post("/admin/security-scanner/artifacts", { sourceText: artifactText });
                setAdvancedResult(r.data.data);
              }} disabled={!artifactText.trim()}>Source audit</Button>
              <Button variant="outline" onClick={async () => {
                const r = await privateApi.post("/admin/security-scanner/artifacts", { manifestText: artifactText, lockText: artifactText });
                setAdvancedResult(r.data.data);
              }} disabled={!artifactText.trim()}>Dependency/CVE hints</Button>
              <Button variant="outline" onClick={async () => {
                const r = await privateApi.post("/admin/security-scanner/artifacts", { openApiText: artifactText, mobileTrafficText: artifactText });
                setAdvancedResult(r.data.data);
              }} disabled={!artifactText.trim()}>OpenAPI/Mobile audit</Button>
              <Button variant="outline" onClick={async () => {
                const r = await privateApi.post("/admin/security-scanner/artifacts", { infraText: artifactText });
                setAdvancedResult(r.data.data);
              }} disabled={!artifactText.trim()}>VPS/Nginx/DB config audit</Button>
            </div>
          </div>

          {advancedResult && (
            <pre className="max-h-[420px] overflow-auto rounded-lg border bg-muted/40 p-3 text-xs">
              {JSON.stringify(advancedResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {report && (
        <>
          <Card>
            <CardHeader><CardTitle>Evidence and report export</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{report.evidencePolicy || 'Read-only results are preliminary observations, not verified exploit proofs.'}</p>
              <Button variant="outline" onClick={() => {
                const rows = [
                  ['URL','Method','HTTP Status','Scanned At','Finding Count','Test','Test Status','Test Finding Count','Skip Reason'],
                  ...(report.pageAudits || []).flatMap(page => page.tests.map(test => [
                    page.url, page.method, String(page.status), page.scannedAt, String(page.findingCount),
                    test.name, test.status, String(test.findingCount), test.reason || ''
                  ]))
                ];
                const csv = rows.map(row => row.map(value => {
                  const safe = /^[=+@\-\t\r]/.test(String(value)) ? "'" + value : String(value);
                  return '"' + safe.replace(/"/g, '""') + '"';
                }).join(',')).join('\r\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                const href = URL.createObjectURL(blob);
                const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'security-page-tests.csv'; anchor.click();
                URL.revokeObjectURL(href);
              }} disabled={!report.pageAudits?.length}>Download per-page CSV</Button>
              <Button variant="outline" onClick={() => {
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const href = URL.createObjectURL(blob);
                const anchor = document.createElement('a'); anchor.href = href; anchor.download = 'security-scan-report.json'; anchor.click();
                URL.revokeObjectURL(href);
              }}>Download JSON report</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Page-by-page test evidence ({report.pageAudits?.length ?? 0})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={pageFilter} onChange={e => setPageFilter(e.target.value)} placeholder="Search scanned URL" />
              <div className="max-h-[520px] space-y-2 overflow-y-auto">
                {(report.pageAudits || []).filter(p => p.url.toLowerCase().includes(pageFilter.toLowerCase())).slice(0, 500).map(page => (
                  <div key={page.url} className="rounded-md border p-3">
                    <button type="button" onClick={() => setSelectedPage(selectedPage === page.url ? null : page.url)} className="w-full break-all text-left text-sm font-medium underline-offset-2 hover:underline">{page.status || 'FAILED'} · {page.url} · {page.findingCount} observations</button>
                    {selectedPage === page.url && <div className="mt-3 space-y-2 text-xs">
                      <p className="text-muted-foreground">GET · {page.scannedAt}</p>
                      {page.tests.map((test, i) => <div key={i} className="rounded bg-muted/40 p-2"><strong>{test.status}</strong> · {test.name} · {test.findingCount} observations{test.reason ? ` · ${test.reason}` : ''}</div>)}
                    </div>}
                  </div>
                ))}
              </div>
              {(report.pageAudits?.length ?? 0) > 500 && <p className="text-xs text-muted-foreground">Showing first 500 matching pages. Download JSON to inspect the complete report.</p>}
            </CardContent>
          </Card>
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
