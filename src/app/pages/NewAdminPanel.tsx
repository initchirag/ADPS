import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getUsers, getCurrentUser, getDatasets, getAuditLogs, getUserSessions } from '../services/dataService';
import { getAnalyzedFiles } from '../services/fileAnalysisService';
import { User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
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
import { Shield, Users, Database, Activity, AlertTriangle, MessageCircle, Lock, Unlock, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface UserStatus {
  blocked: boolean;
  chatbotEnabled: boolean;
  chatbotMode: string;
}

export function NewAdminPanel() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});

  useEffect(() => {
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    loadUsers();
    loadUserStatuses();
  }, [currentUser, navigate]);

  const loadUsers = () => {
    const allUsers = getUsers();
    setUsers(allUsers);
  };

  const loadUserStatuses = () => {
    const statuses: Record<string, UserStatus> = {};
    const storedStatuses = localStorage.getItem('user_statuses');
    const parsed = storedStatuses ? JSON.parse(storedStatuses) : {};
    
    const allUsers = getUsers();
    allUsers.forEach(user => {
      statuses[user.id] = parsed[user.id] || {
        blocked: false,
        chatbotEnabled: true,
        chatbotMode: 'normal'
      };
    });
    setUserStatuses(statuses);
  };

  const saveUserStatuses = (newStatuses: Record<string, UserStatus>) => {
    localStorage.setItem('user_statuses', JSON.stringify(newStatuses));
  };

  const toggleBlockUser = (userId: string) => {
    const newStatuses = {
      ...userStatuses,
      [userId]: {
        ...userStatuses[userId],
        blocked: !userStatuses[userId].blocked
      }
    };
    setUserStatuses(newStatuses);
    saveUserStatuses(newStatuses);
    
    const user = users.find(u => u.id === userId);
    const isBlocked = newStatuses[userId].blocked;
    toast.success(`${user?.name} has been ${isBlocked ? 'blocked' : 'unblocked'}`);
  };

  const toggleChatbot = (userId: string) => {
    const newStatuses = {
      ...userStatuses,
      [userId]: {
        ...userStatuses[userId],
        chatbotEnabled: !userStatuses[userId].chatbotEnabled
      }
    };
    setUserStatuses(newStatuses);
    saveUserStatuses(newStatuses);
    toast.success('Chatbot settings updated');
  };

  const updateChatbotMode = (userId: string, mode: string) => {
    const newStatuses = {
      ...userStatuses,
      [userId]: {
        ...userStatuses[userId],
        chatbotMode: mode
      }
    };
    setUserStatuses(newStatuses);
    saveUserStatuses(newStatuses);
    toast.success(`Chatbot mode set to ${mode}`);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const datasets = getDatasets();
  const logs = getAuditLogs();
  const analyzedFiles = getAnalyzedFiles();
  const userSessions = getUserSessions();

  // Calculate metrics
  const activeUsers = users.filter(u => u.role !== 'admin' && !userStatuses[u.id]?.blocked).length;
  const blockedUsers = users.filter(u => userStatuses[u.id]?.blocked).length;
  const totalSystemEvents = logs.length;
  const criticalFiles = analyzedFiles.filter(f => f.status === 'danger').length;

  // User activity data for charts
  const userActivityData = users.filter(u => u.role !== 'admin').map(user => {
    const userLogs = logs.filter(l => l.user_id === user.id);
    const session = userSessions[user.id];
    return {
      name: user.name.split(' ')[0],
      actions: userLogs.length,
      uptime: Math.floor((session?.totalUptime || 0) / 3600), // hours
      sessions: session?.sessionCount || 0,
    };
  });

  // Activity trend over last 7 days
  const activityTrendData = [
    { date: 'Day 1', users: 8, actions: 45, threats: 2 },
    { date: 'Day 2', users: 9, actions: 52, threats: 1 },
    { date: 'Day 3', users: 7, actions: 38, threats: 3 },
    { date: 'Day 4', users: 10, actions: 65, threats: 1 },
    { date: 'Day 5', users: 9, actions: 58, threats: 4 },
    { date: 'Day 6', users: 8, actions: 48, threats: 2 },
    { date: 'Day 7', users: activeUsers, actions: logs.slice(0, 30).length, threats: criticalFiles },
  ];

  // Threat distribution
  const threatDistributionData = [
    { name: 'Critical', value: criticalFiles, color: '#dc2626' },
    { name: 'High', value: analyzedFiles.filter(f => f.status === 'warning').length, color: '#ea580c' },
    { name: 'Medium', value: analyzedFiles.filter(f => f.status === 'success').length, color: '#ca8a04' },
    { name: 'Safe', value: analyzedFiles.filter(f => !f.status || f.status === 'success').length, color: '#16a34a' },
  ];

  // User status distribution
  const userStatusData = [
    { name: 'Active', value: activeUsers, color: '#16a34a' },
    { name: 'Blocked', value: blockedUsers, color: '#dc2626' },
    { name: 'Inactive', value: users.filter(u => u.role !== 'admin').length - activeUsers - blockedUsers, color: '#71717a' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Controls</h1>
            <p className="text-muted-foreground">System management and user administration</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <Card className="border-2 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-200">Administrator Access</h4>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                You have full access to all system resources, users, and logs. Use this privilege responsibly.
              </p>
            </div>
            {criticalFiles > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {criticalFiles} Critical Threats
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active Users</p>
                <p className="text-3xl font-bold mt-2">{activeUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">of {users.filter(u => u.role !== 'admin').length} total</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/30 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Datasets</p>
                <p className="text-3xl font-bold mt-2">{datasets.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{analyzedFiles.length} analyzed</p>
              </div>
              <div className="w-14 h-14 bg-green-100 dark:bg-green-950/30 rounded-xl flex items-center justify-center">
                <Database className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">System Events</p>
                <p className="text-3xl font-bold mt-2">{totalSystemEvents}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </div>
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/30 rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Critical Threats</p>
                <p className="text-3xl font-bold mt-2">{criticalFiles}</p>
                <p className="text-xs text-muted-foreground mt-1">Require attention</p>
              </div>
              <div className="w-14 h-14 bg-red-100 dark:bg-red-950/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span>System Activity Trend</span>
            </CardTitle>
            <CardDescription>User activity and threat detection over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityTrendData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" name="Active Users" />
                <Area type="monotone" dataKey="actions" stroke="#10b981" fillOpacity={1} fill="url(#colorActions)" name="Actions" />
                <Area type="monotone" dataKey="threats" stroke="#dc2626" fillOpacity={1} fill="url(#colorThreats)" name="Threats" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Activity Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-red-600" />
              <span>User Activity Metrics</span>
            </CardTitle>
            <CardDescription>Actions and session data per user</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="actions" fill="#dc2626" name="Actions" radius={[8, 8, 0, 0]} />
                <Bar dataKey="sessions" fill="#3b82f6" name="Sessions" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Threat Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Threat Distribution</span>
            </CardTitle>
            <CardDescription>Security risk levels across analyzed files</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threatDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-red-600" />
              <span>User Status Overview</span>
            </CardTitle>
            <CardDescription>Current user status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Management & Bond Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-600" />
            <span>User Management & Bond Controls</span>
          </CardTitle>
          <CardDescription>Manage users, control access, and configure Bond (AI assistant) settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Uptime</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Bond</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.filter(u => u.role !== 'admin').map(user => {
                const session = userSessions[user.id] || {};
                const userLogs = logs.filter(l => l.user_id === user.id);
                const lastActive = session.lastActive || (userLogs[0]?.timestamp);
                const isBlocked = userStatuses[user.id]?.blocked || false;
                
                return (
                  <TableRow key={user.id} className={isBlocked ? 'opacity-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{session.sessionCount || 0} sessions</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{Math.floor((session.totalUptime || 0) / 3600)}h {Math.floor(((session.totalUptime || 0) % 3600) / 60)}m</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {lastActive ? format(new Date(lastActive), 'MMM dd, HH:mm') : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={userStatuses[user.id]?.chatbotEnabled !== false}
                          onCheckedChange={() => toggleChatbot(user.id)}
                          disabled={isBlocked}
                        />
                        <MessageCircle className={`w-4 h-4 ${userStatuses[user.id]?.chatbotEnabled !== false ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userStatuses[user.id]?.chatbotMode || 'normal'}
                        onValueChange={(value) => updateChatbotMode(user.id, value)}
                        disabled={isBlocked}
                      >
                        <SelectTrigger className="w-28">
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
                      <Button
                        variant={isBlocked ? 'default' : 'destructive'}
                        size="sm"
                        onClick={() => toggleBlockUser(user.id)}
                        className="flex items-center space-x-1"
                      >
                        {isBlocked ? (
                          <>
                            <Unlock className="w-3 h-3" />
                            <span>Unblock</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>Block</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent System Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-red-600" />
            <span>Recent System Activity</span>
          </CardTitle>
          <CardDescription>Latest 15 system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.slice(0, 15).map(log => (
              <div key={log.id} className="flex items-start justify-between p-3 border dark:border-gray-800 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={
                      log.action_type === 'CREATE' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900' :
                      log.action_type === 'UPDATE' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900' :
                      log.action_type === 'DELETE' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    } variant="outline">
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
    </div>
  );
}