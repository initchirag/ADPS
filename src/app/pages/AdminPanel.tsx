import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getUsers, getCurrentUser, getDatasets, getAuditLogs } from '../services/dataService';
import { User } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Shield, Users, Database, Activity, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export function AdminPanel() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Check if user is admin
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    loadUsers();
  }, [currentUser, navigate]);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const datasets = getDatasets();
  const logs = getAuditLogs();
  const recentLogs = logs.slice(0, 10);

  const userActivity = users.map(user => ({
    user,
    actionCount: logs.filter(l => l.user_id === user.id).length,
    lastActivity: logs.find(l => l.user_id === user.id)?.timestamp,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-600">System overview and user management</p>
        </div>
      </div>

      {/* Alert */}
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Administrator Access</h4>
              <p className="text-sm text-red-800 mt-1">
                You have full access to all system resources, users, and logs. Use this privilege responsibly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{users.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Datasets</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{datasets.length}</p>
              </div>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
                <Database className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Audit Logs</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{logs.length}</p>
              </div>
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Admin Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>User Management</span>
          </CardTitle>
          <CardDescription>View and manage system users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions Count</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userActivity.map(({ user, actionCount, lastActivity }) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{actionCount} actions</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {lastActivity ? format(new Date(lastActivity), 'MMM dd, HH:mm') : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent System Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Recent System Activity</span>
          </CardTitle>
          <CardDescription>Latest actions across all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Badge className={
                    log.action_type === 'CREATE' ? 'bg-green-100 text-green-700' :
                    log.action_type === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                    log.action_type === 'DELETE' ? 'bg-red-100 text-red-700' :
                    log.action_type === 'TRANSFORM' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }>
                    {log.action_type}
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-900">{log.resource_name}</p>
                    <p className="text-sm text-slate-600">{log.details}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {log.user_name} • {format(new Date(log.timestamp), 'PPpp')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dataset Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Datasets by Source Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['file', 'api', 'manual'].map(type => {
                const count = datasets.filter(d => d.source_type === type).length;
                const percentage = datasets.length > 0 ? (count / datasets.length) * 100 : 0;
                
                return (
                  <div key={type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-slate-700">{type}</span>
                      <span className="font-medium text-slate-900">{count} datasets</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          type === 'file' ? 'bg-blue-600' :
                          type === 'api' ? 'bg-green-600' :
                          'bg-purple-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Database Status</span>
                <Badge className="bg-green-100 text-green-700">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">API Status</span>
                <Badge className="bg-green-100 text-green-700">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Storage Usage</span>
                <Badge variant="outline">12.5 MB</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Last Backup</span>
                <span className="text-sm text-slate-600">Today, 00:00</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}