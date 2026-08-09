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
    toast.success('PDF report generation started. Download will begin shortly.');
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