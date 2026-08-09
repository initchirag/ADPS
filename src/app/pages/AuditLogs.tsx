import { useEffect, useState } from 'react';
import { getAuditLogs } from '../services/dataService';
import { AuditLog } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Search, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    setLogs(getAuditLogs());
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.resource_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;
    const matchesResource = resourceFilter === 'all' || log.resource_type === resourceFilter;
    
    return matchesSearch && matchesAction && matchesResource;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-700';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      case 'TRANSFORM':
        return 'bg-purple-100 text-purple-700';
      case 'VIEW':
        return 'bg-slate-100 text-slate-700';
      case 'DOWNLOAD':
        return 'bg-orange-100 text-orange-700';
      case 'EXPORT':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getResourceColor = (resource: string) => {
    switch (resource) {
      case 'dataset':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'version':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'transformation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'user':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-600 mt-1">Track all system activities and user actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total Actions</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{logs.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Create Actions</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {logs.filter(l => l.action_type === 'CREATE').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Updates</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {logs.filter(l => l.action_type === 'UPDATE').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Transformations</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {logs.filter(l => l.action_type === 'TRANSFORM').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Action Filter */}
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter by action" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="TRANSFORM">Transform</SelectItem>
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="DOWNLOAD">Download</SelectItem>
                <SelectItem value="EXPORT">Export</SelectItem>
              </SelectContent>
            </Select>

            {/* Resource Filter */}
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <SelectValue placeholder="Filter by resource" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="dataset">Dataset</SelectItem>
                <SelectItem value="version">Version</SelectItem>
                <SelectItem value="transformation">Transformation</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Activity Log ({filteredLogs.length})</span>
          </CardTitle>
          <CardDescription>Detailed record of all system activities</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50">
                      <TableCell className="text-sm">
                        <div>
                          <div className="font-medium text-slate-900">
                            {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-xs text-slate-500">
                            {format(new Date(log.timestamp), 'HH:mm:ss')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{log.user_name}</div>
                        <div className="text-xs text-slate-500">ID: {log.user_id}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action_type)}>
                          {log.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline" className={getResourceColor(log.resource_type)}>
                            {log.resource_type}
                          </Badge>
                          <div className="text-sm text-slate-600 mt-1">{log.resource_name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-slate-700">{log.details}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">Audit Log Retention</h4>
              <p className="text-sm text-blue-800 mt-1">
                All audit logs are permanently stored and can be exported for compliance purposes. 
                Logs include user actions, timestamps, and detailed activity information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
