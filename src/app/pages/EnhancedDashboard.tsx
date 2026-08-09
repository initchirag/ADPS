import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getDashboardStats, getCurrentUser } from '../services/dataService';
import { analyzeFile, getAnalyzedFiles } from '../services/fileAnalysisService';
import { DashboardStats, AnalyzedFile } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Database, GitBranch, FileText, Users, Upload, FileSearch, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Chatbot } from '../components/Chatbot';
import { Progress } from '../components/ui/progress';

const SUPPORTED_FORMATS = ['.json', '.csv', '.txt', '.xml', '.pdf', '.log', '.yaml', '.ini'];

export function EnhancedDashboard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyzedFiles, setAnalyzedFiles] = useState<AnalyzedFile[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setStats(getDashboardStats());
    setAnalyzedFiles(getAnalyzedFiles());
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!SUPPORTED_FORMATS.includes(fileExtension)) {
      toast.error(`Unsupported file format. Supported: ${SUPPORTED_FORMATS.join(', ')}`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const analyzedFile = await analyzeFile(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploading(false);
        setUploadProgress(0);
        toast.success('File analyzed successfully!');
        navigate(`/dashboard/analysis/${analyzedFile.id}`);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
      toast.error('Failed to analyze file. Please try again.');
    }
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Datasets',
      value: stats.total_datasets,
      icon: Database,
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Data Versions',
      value: stats.total_versions,
      icon: GitBranch,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Files Analyzed',
      value: analyzedFiles.length,
      icon: FileSearch,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Active Users',
      value: stats.total_users,
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'DELETE':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'TRANSFORM':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'VIEW':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'moderate':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'danger':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {currentUser?.name}</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700">
              <Upload className="h-5 w-5 mr-2" />
              Analyze File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload File for Analysis</DialogTitle>
              <DialogDescription>
                Upload a file to get comprehensive security analysis, risk scores, and CVE mappings
              </DialogDescription>
            </DialogHeader>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? 'border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-slate-300 dark:border-gray-700'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="space-y-4">
                  <div className="animate-spin h-12 w-12 border-4 border-red-600 border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm font-medium">Analyzing file...</p>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">{uploadProgress}% complete</p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm font-medium mb-2">Drag and drop your file here</p>
                  <p className="text-xs text-muted-foreground mb-4">or</p>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button asChild variant="outline">
                      <span>Browse Files</span>
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileInput}
                      accept={SUPPORTED_FORMATS.join(',')}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported: {SUPPORTED_FORMATS.join(', ')}
                  </p>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent File Analyses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSearch className="h-5 w-5 text-red-600" />
              <span>Recent File Analyses</span>
            </CardTitle>
            <CardDescription>Latest files analyzed with risk scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyzedFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSearch className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No files analyzed yet</p>
                  <p className="text-xs">Click "Analyze File" to get started</p>
                </div>
              ) : (
                analyzedFiles.slice(0, 5).map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboard/analysis/${file.id}`)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {getStatusIcon(file.status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(file.uploaded_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={file.status === 'safe' ? 'secondary' : file.status === 'moderate' ? 'outline' : 'destructive'}>
                        Risk: {file.risk_score}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-red-600" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest actions across the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_activity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Badge className={`${getActionColor(log.action_type)} text-xs`}>
                    {log.action_type}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{log.resource_name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{log.details}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.user_name} • {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)} className="h-auto py-6 flex-col">
              <FileSearch className="h-8 w-8 mb-2 text-red-600" />
              <span>Analyze File</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard/datasets')} className="h-auto py-6 flex-col">
              <Database className="h-8 w-8 mb-2 text-blue-600" />
              <span>View Datasets</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard/lineage')} className="h-auto py-6 flex-col">
              <GitBranch className="h-8 w-8 mb-2 text-green-600" />
              <span>Data Lineage</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/dashboard/logs')} className="h-auto py-6 flex-col">
              <FileText className="h-8 w-8 mb-2 text-purple-600" />
              <span>Audit Logs</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chatbot - Only for users */}
      {currentUser?.role === 'user' && <Chatbot />}
    </div>
  );
}