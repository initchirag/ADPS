import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getUsers, getCurrentUser, getDatasets, getAuditLogs } from '../services/dataService';
import { getAnalyzedFiles } from '../services/fileAnalysisService';
import { User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Shield, Users, Database, Activity, AlertTriangle, MessageCircle, Bell, TrendingUp, FileText, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export function EnhancedAdminPanel() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [chatbotSettings, setChatbotSettings] = useState<Record<string, { enabled: boolean; mode: string }>>({});

  useEffect(() => {
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    loadUsers();
    loadChatbotSettings();
  }, [currentUser, navigate]);

  const loadUsers = () => {
    const allUsers = getUsers();
    setUsers(allUsers);
  };

  const loadChatbotSettings = () => {
    const settings: Record<string, { enabled: boolean; mode: string }> = {};
    const allUsers = getUsers();
    allUsers.forEach(user => {
      settings[user.id] = {
        enabled: user.chatbot_enabled !== false,
        mode: 'normal'
      };
    });
    setChatbotSettings(settings);
  };

  const toggleChatbot = (userId: string) => {
    setChatbotSettings(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        enabled: !prev[userId].enabled
      }
    }));
    toast.success('Chatbot settings updated');
  };

  const updateChatbotMode = (userId: string, mode: string) => {
    setChatbotSettings(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        mode
      }
    }));
    toast.success(`Chatbot mode set to ${mode}`);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const datasets = getDatasets();
  const logs = getAuditLogs();
  const analyzedFiles = getAnalyzedFiles();
  const recentLogs = logs.slice(0, 15);

  const userActivity = users.map(user => ({
    user,
    actionCount: logs.filter(l => l.user_id === user.id).length,
    lastActivity: logs.find(l => l.user_id === user.id)?.timestamp,
  }));

  // Risk analytics data
  const riskData = analyzedFiles.map(file => ({
    name: file.name.substring(0, 20),
    risk: file.risk_score
  })).slice(0, 10);

  // Activity trend data (mock)
  const activityData = [
    { date: '03/25', actions: 45 },
    { date: '03/26', actions: 52 },
    { date: '03/27', actions: 38 },
    { date: '03/28', actions: 65 },
    { date: '03/29', actions: 58 },
    { date: '03/30', actions: logs.length },
  ];

  // Alerts
  const criticalFiles = analyzedFiles.filter(f => f.status === 'danger').length;
  const suspiciousActivity = logs.filter(l => l.action_type === 'DELETE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <Card className="border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-200">Administrator Access</h4>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                You have full access to all system resources, users, and logs. Use this privilege responsibly.
              </p>
            </div>
            {(criticalFiles > 0 || suspiciousActivity > 0) && (
              <div className="flex items-center space-x-4">
                {criticalFiles > 0 && (
                  <Badge variant="destructive">{criticalFiles} High Risk Files</Badge>
                )}
                {suspiciousActivity > 0 && (
                  <Badge variant="outline" className="border-red-500 text-red-600">
                    {suspiciousActivity} Deletions
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold mt-2">{users.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Datasets</p>
                <p className="text-3xl font-bold mt-2">{datasets.length}</p>
              </div>
              <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <Database className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Files Analyzed</p>
                <p className="text-3xl font-bold mt-2">{analyzedFiles.length}</p>
              </div>
              <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Events</p>
                <p className="text-3xl font-bold mt-2">{logs.length}</p>
              </div>
              <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Trend</CardTitle>
            <CardDescription>System activity over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activityData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="actions" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Analytics</CardTitle>
            <CardDescription>Risk scores of analyzed files</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={riskData}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="risk" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot Controls</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* User Management Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userActivity.map(({ user, actionCount, lastActivity }) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{actionCount}</TableCell>
                      <TableCell>
                        {lastActivity ? format(new Date(lastActivity), 'MMM dd, HH:mm') : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Active
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chatbot Controls Tab */}
        <TabsContent value="chatbot">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-red-600" />
                <span>Chatbot Management</span>
              </CardTitle>
              <CardDescription>
                Control chatbot access and security modes for individual users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Chatbot Status</TableHead>
                    <TableHead>Security Mode</TableHead>
                    <TableHead>Query Logs</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter(u => u.role !== 'admin').map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={chatbotSettings[user.id]?.enabled !== false}
                            onCheckedChange={() => toggleChatbot(user.id)}
                          />
                          <span className="text-sm">
                            {chatbotSettings[user.id]?.enabled !== false ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={chatbotSettings[user.id]?.mode || 'normal'}
                          onValueChange={(value) => updateChatbotMode(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="restricted">Restricted</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Logs
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600">
                          Block User
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Suspicious Query Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Unusual query pattern detected</p>
                      <p className="text-xs text-muted-foreground">User attempted to extract sensitive data</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Review</Button>
                </div>
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No other suspicious activities detected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Logs</CardTitle>
              <CardDescription>Complete audit trail of all system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogs.map(log => (
                  <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={
                          log.action_type === 'CREATE' ? 'bg-green-100 text-green-700' :
                          log.action_type === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                          log.action_type === 'DELETE' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }>
                          {log.action_type}
                        </Badge>
                        <span className="font-medium text-sm">{log.resource_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.user_name} • {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <div className="space-y-4">
            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <Bell className="h-5 w-5" />
                  <span>Critical Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticalFiles > 0 && (
                  <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900 dark:text-red-200">High-Risk Files Detected</p>
                      <p className="text-sm text-red-800 dark:text-red-300">
                        {criticalFiles} files have critical security issues requiring immediate attention
                      </p>
                      <Button size="sm" className="mt-2" variant="destructive">
                        View Files
                      </Button>
                    </div>
                  </div>
                )}
                
                {suspiciousActivity > 0 && (
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900 dark:text-yellow-200">Unusual Delete Activity</p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        {suspiciousActivity} datasets were deleted recently. Review if necessary.
                      </p>
                      <Button size="sm" className="mt-2" variant="outline">
                        Review Activity
                      </Button>
                    </div>
                  </div>
                )}

                {criticalFiles === 0 && suspiciousActivity === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No critical alerts at this time</p>
                    <p className="text-xs">System is operating normally</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Status</span>
                    <Badge className="bg-green-100 text-green-700">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">API Response Time</span>
                    <span className="text-sm text-muted-foreground">125ms avg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Usage</span>
                    <span className="text-sm text-muted-foreground">45% of 100GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Sessions</span>
                    <span className="text-sm text-muted-foreground">{users.length} users</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}