import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getAnalyzedFile } from '../services/fileAnalysisService';
import { AnalyzedFile } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  FileText, 
  Shield, 
  AlertTriangle, 
  GitBranch, 
  TrendingUp, 
  Download,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Hash,
  FileCode,
  Users,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export function FileAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<AnalyzedFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const analyzedFile = getAnalyzedFile(id);
      if (analyzedFile) {
        setFile(analyzedFile);
      } else {
        toast.error('File not found');
        navigate('/dashboard');
      }
    }
    setLoading(false);
  }, [id, navigate]);

  if (loading || !file) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  const { analysis } = file;

  const severityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const statusColors = {
    safe: 'text-green-600 dark:text-green-400',
    moderate: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  const riskData = [
    { name: 'Structural', value: analysis.risks.structural, color: '#3b82f6' },
    { name: 'Security', value: analysis.risks.security, color: '#ef4444' },
    { name: 'Integrity', value: analysis.risks.integrity, color: '#f59e0b' },
  ];

  const handleExportPDF = () => {
    const sevColor: Record<string, string> = {
      low: '#16a34a', medium: '#d97706', high: '#ea580c', critical: '#dc2626',
    };
    const issueRows = analysis.issues.map(i => `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:8px 12px;font-weight:600">${i.title}</td>
        <td style="padding:8px 12px">
          <span style="background:${sevColor[i.severity]}1a;color:${sevColor[i.severity]};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;text-transform:uppercase">${i.severity}</span>
        </td>
        <td style="padding:8px 12px;font-size:13px;color:#374151">${i.description}</td>
        <td style="padding:8px 12px;font-size:13px;color:#1d4ed8">${i.recommendation}</td>
      </tr>`).join('');

    const cveRows = analysis.cves.map(c => `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:8px 12px;font-family:monospace;font-weight:700;color:#dc2626">${c.cve_id}</td>
        <td style="padding:8px 12px">
          <span style="background:${sevColor[c.severity]}1a;color:${sevColor[c.severity]};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;text-transform:uppercase">${c.severity}</span>
        </td>
        <td style="padding:8px 12px;font-size:13px">${c.description}</td>
        <td style="padding:8px 12px;font-size:13px">${c.affected_component}</td>
        <td style="padding:8px 12px;font-size:13px;color:#1d4ed8">${c.fix_recommendation}</td>
      </tr>`).join('');

    const lineageRows = analysis.lineage.map(n => `
      <tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:8px 12px;font-weight:600;text-transform:capitalize">${n.type}</td>
        <td style="padding:8px 12px">${n.name}</td>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280">${new Date(n.timestamp).toLocaleString()}</td>
        <td style="padding:8px 12px;font-size:12px;font-family:monospace;color:#374151">${Object.entries(n.metadata ?? {}).map(([k,v]) => `${k}: ${v}`).join(', ')}</td>
      </tr>`).join('');

    const statusColorMap: Record<string, string> = { safe: '#16a34a', moderate: '#d97706', danger: '#dc2626' };
    const riskColor = statusColorMap[file.status] ?? '#374151';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ADPS File Analysis Report — ${file.name}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;background:#fff;padding:40px}
  h1{font-size:28px;font-weight:700;color:#991b1b}
  h2{font-size:18px;font-weight:700;margin-top:32px;margin-bottom:12px;color:#1f2937;border-bottom:2px solid #fecaca;padding-bottom:6px}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb}
  .meta-item{display:flex;flex-direction:column;gap:4px}
  .meta-label{font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}
  .meta-value{font-size:14px;font-weight:600;color:#111827}
  .hash{font-family:monospace;font-size:12px;word-break:break-all;color:#374151}
  .risk-badge{display:inline-block;padding:4px 14px;border-radius:999px;font-weight:700;font-size:16px;color:#fff;background:${riskColor}}
  table{width:100%;border-collapse:collapse;font-size:14px;margin-top:8px}
  th{background:#f3f4f6;padding:10px 12px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;color:#374151;letter-spacing:.5px}
  tr:nth-child(even){background:#f9fafb}
  .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center}
  @media print{body{padding:20px}@page{margin:1.5cm}}
</style>
</head>
<body>
<h1>🔒 ADPS — File Analysis Report</h1>
<p style="color:#6b7280;margin-top:4px;font-size:14px">Advanced Data Provenance System · Generated ${new Date().toLocaleString()}</p>

<div class="meta">
  <div class="meta-item"><span class="meta-label">File Name</span><span class="meta-value">${file.name}</span></div>
  <div class="meta-item"><span class="meta-label">File Type</span><span class="meta-value">${file.type}</span></div>
  <div class="meta-item"><span class="meta-label">File Size</span><span class="meta-value">${(file.size / 1024).toFixed(2)} KB · ${file.line_count.toLocaleString()} lines</span></div>
  <div class="meta-item"><span class="meta-label">Uploaded By</span><span class="meta-value">${file.uploaded_by}</span></div>
  <div class="meta-item"><span class="meta-label">Analysis Date</span><span class="meta-value">${new Date(file.uploaded_at).toLocaleString()}</span></div>
  <div class="meta-item"><span class="meta-label">Risk Status</span><span class="risk-badge">${file.status.toUpperCase()} · ${file.risk_score}/100</span></div>
  <div class="meta-item" style="grid-column:1/-1"><span class="meta-label">SHA-256 Hash</span><span class="hash">${file.hash}</span></div>
</div>

<h2>📊 Data Quality Summary</h2>
<div class="meta">
  <div class="meta-item"><span class="meta-label">Total Records</span><span class="meta-value">${analysis.content.total_records.toLocaleString()}</span></div>
  <div class="meta-item"><span class="meta-label">Valid Records</span><span class="meta-value" style="color:#16a34a">${analysis.content.valid_records.toLocaleString()}</span></div>
  <div class="meta-item"><span class="meta-label">Invalid Records</span><span class="meta-value" style="color:#dc2626">${analysis.content.invalid_records.toLocaleString()}</span></div>
  <div class="meta-item"><span class="meta-label">Data Quality Score</span><span class="meta-value">${analysis.content.data_quality_score}%</span></div>
  <div class="meta-item"><span class="meta-label">Structural Risk</span><span class="meta-value">${analysis.risks.structural}/100</span></div>
  <div class="meta-item"><span class="meta-label">Integrity Risk</span><span class="meta-value">${analysis.risks.integrity}/100</span></div>
</div>

<h2>⚠️ Security Issues (${analysis.issues.length})</h2>
<table>
  <thead><tr><th>Issue</th><th>Severity</th><th>Description</th><th>Recommendation</th></tr></thead>
  <tbody>${issueRows}</tbody>
</table>

<h2>🛡️ CVE Mappings (${analysis.cves.length})</h2>
<table>
  <thead><tr><th>CVE ID</th><th>Severity</th><th>Description</th><th>Affected Component</th><th>Fix</th></tr></thead>
  <tbody>${cveRows}</tbody>
</table>

<h2>🔗 Data Lineage</h2>
<table>
  <thead><tr><th>Stage</th><th>Name</th><th>Timestamp</th><th>Metadata</th></tr></thead>
  <tbody>${lineageRows}</tbody>
</table>

${analysis.content.anomalies.length > 0 ? `
<h2>🔍 Content Anomalies</h2>
<ul style="padding-left:20px;margin-top:8px">
  ${analysis.content.anomalies.map(a => `<li style="margin-bottom:6px;font-size:14px">${a}</li>`).join('')}
</ul>` : ''}

<div class="footer">
  ADPS · Advanced Data Provenance System · Confidential Security Report<br>
  This report was auto-generated by the ADPS file analysis engine. For questions, contact your security administrator.
</div>
</body>
</html>`;

    const printWin = window.open('', '_blank', 'width=1000,height=800');
    if (!printWin) {
      toast.error('Pop-up blocked. Please allow pop-ups for this site and try again.');
      return;
    }
    printWin.document.write(html);
    printWin.document.close();
    // Let the page render, then trigger print dialog
    printWin.onload = () => {
      printWin.focus();
      printWin.print();
    };
    toast.success('PDF report opened — use your browser\'s print dialog to save as PDF.');
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(file, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name}_analysis.json`;
    link.click();
    toast.success('JSON export completed');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{file.name}</h1>
            <p className="text-sm text-muted-foreground">Comprehensive File Analysis Report</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportJSON} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={handleExportPDF} className="bg-red-600 hover:bg-red-700">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">File Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(file.size / 1024).toFixed(2)} KB</div>
            <p className="text-xs text-muted-foreground">{file.line_count} lines</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statusColors[file.status]}`}>
              {file.risk_score}/100
            </div>
            <p className={`text-xs font-semibold uppercase ${statusColors[file.status]}`}>
              {file.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.content.data_quality_score}%</div>
            <Progress value={analysis.content.data_quality_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.issues.length}</div>
            <p className="text-xs text-muted-foreground">
              {analysis.issues.filter(i => i.severity === 'critical' || i.severity === 'high').length} critical/high
            </p>
          </CardContent>
        </Card>
      </div>

      {/* File Overview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-red-600" />
            <span>File Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileCode className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Technical Details</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File Type:</span>
                  <span className="font-medium">{file.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Encoding:</span>
                  <span className="font-medium">{file.encoding}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Hash (SHA-256):</span>
                  <span className="font-mono text-xs text-right break-all max-w-[60%]">{file.hash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Structure:</span>
                  <span className="font-medium text-right max-w-[60%]">{analysis.overview.parsed_structure}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Upload Information</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uploaded By:</span>
                  <span className="font-medium">{file.uploaded_by}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upload Time:</span>
                  <span className="font-medium">{new Date(file.uploaded_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Records:</span>
                  <span className="font-medium">{analysis.content.total_records.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid Records:</span>
                  <span className="font-medium text-green-600">{analysis.content.valid_records.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {analysis.overview.key_fields.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold mb-2">Key Fields Detected:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.overview.key_fields.map((field, idx) => (
                  <Badge key={idx} variant="secondary">{field}</Badge>
                ))}
              </div>
            </div>
          )}

          {analysis.overview.duplicates > 0 && (
            <div className="mt-4 flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Found {analysis.overview.duplicates} duplicate records</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="issues" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="issues">Issues & Vulnerabilities</TabsTrigger>
          <TabsTrigger value="cves">CVE Mapping</TabsTrigger>
          <TabsTrigger value="lineage">Data Lineage</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
        </TabsList>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span>Security Issues & Vulnerabilities</span>
              </CardTitle>
              <CardDescription>
                Detected {analysis.issues.length} potential issues that require attention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.issues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{issue.title}</h4>
                        <Badge className={severityColors[issue.severity]}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                      <div className="bg-slate-50 dark:bg-gray-800 rounded p-3">
                        <p className="text-xs font-semibold mb-1">Recommendation:</p>
                        <p className="text-sm">{issue.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {analysis.content.anomalies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Anomalies</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.content.anomalies.map((anomaly, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <span className="text-sm">{anomaly}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CVEs Tab */}
        <TabsContent value="cves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-red-600" />
                <span>CVE (Common Vulnerabilities and Exposures) Mapping</span>
              </CardTitle>
              <CardDescription>
                {analysis.cves.length} CVEs mapped to components in this file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.cves.map((cve) => (
                <div key={cve.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono font-bold text-red-600">{cve.cve_id}</span>
                        <Badge className={severityColors[cve.severity]}>
                          {cve.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{cve.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Affected Component</p>
                      <p>{cve.affected_component}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Published</p>
                      <p>{new Date(cve.published_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3">
                    <p className="text-xs font-semibold mb-1 text-blue-900 dark:text-blue-200">Fix Recommendation</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">{cve.fix_recommendation}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lineage Tab */}
        <TabsContent value="lineage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GitBranch className="h-5 w-5 text-red-600" />
                <span>Data Lineage Visualization</span>
              </CardTitle>
              <CardDescription>
                Complete data journey from source to output
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.lineage.map((node, idx) => (
                  <div key={node.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        node.type === 'source' ? 'bg-green-100 dark:bg-green-900' :
                        node.type === 'transformation' ? 'bg-blue-100 dark:bg-blue-900' :
                        node.type === 'storage' ? 'bg-purple-100 dark:bg-purple-900' :
                        'bg-red-100 dark:bg-red-900'
                      }`}>
                        {node.type === 'source' && <FileText className="h-5 w-5" />}
                        {node.type === 'transformation' && <TrendingUp className="h-5 w-5" />}
                        {node.type === 'storage' && <Shield className="h-5 w-5" />}
                        {node.type === 'output' && <Download className="h-5 w-5" />}
                      </div>
                      {idx < analysis.lineage.length - 1 && (
                        <div className="w-0.5 h-16 bg-slate-300 dark:bg-gray-700" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{node.name}</h4>
                        <Badge variant="outline" className="uppercase text-xs">{node.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(node.timestamp).toLocaleString()}
                      </p>
                      {node.metadata && (
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(node.metadata).map(([key, value]) => (
                            <span key={key} className="mr-4">
                              {key}: <strong>{JSON.stringify(value)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={riskData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Structural Risk</span>
                    <span className="text-sm font-bold">{analysis.risks.structural}/100</span>
                  </div>
                  <Progress value={analysis.risks.structural} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Data format and schema issues</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Security Risk</span>
                    <span className="text-sm font-bold">{analysis.risks.security}/100</span>
                  </div>
                  <Progress value={analysis.risks.security} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Vulnerabilities and threats</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Integrity Risk</span>
                    <span className="text-sm font-bold">{analysis.risks.integrity}/100</span>
                  </div>
                  <Progress value={analysis.risks.integrity} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Data consistency and completeness</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold">Overall Risk Score</span>
                    <span className={`text-lg font-bold ${statusColors[file.status]}`}>
                      {analysis.risks.overall}/100
                    </span>
                  </div>
                  <Progress value={analysis.risks.overall} className="h-3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-red-600" />
                <span>Version History & Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.history.map((version, idx) => (
                  <div key={idx} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center font-semibold text-sm">
                        {version.version}
                      </div>
                      {idx < analysis.history.length - 1 && (
                        <div className="w-0.5 h-16 bg-slate-300 dark:bg-gray-700" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{version.changes}</h4>
                        <Badge variant="outline">{version.version}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Modified by <strong>{version.modified_by}</strong> on {new Date(version.modified_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}