import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getDashboardStats } from '../services/dataService';
import { DashboardStats } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Database, GitBranch, FileText, Users, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    setStats(getDashboardStats());
  }, []);

  if (!stats) {
    return <div>Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Datasets',
      value: stats.total_datasets,
      icon: Database,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Data Versions',
      value: stats.total_versions,
      icon: GitBranch,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Transformations',
      value: stats.total_transformations,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Active Users',
      value: stats.total_users,
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

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
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your data provenance tracking system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center`}>
                  <stat.icon className={`w-7 h-7 ${stat.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>Latest actions performed in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recent_activity.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => navigate('/logs')}
              >
                <div className="flex items-center space-x-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action_type)}`}>
                    {log.action_type}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{log.resource_name}</p>
                    <p className="text-sm text-slate-600">{log.details}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      by {log.user_name} • {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
          onClick={() => navigate('/upload')}
        >
          <CardContent className="p-6 text-center">
            <Database className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900">Upload Dataset</h3>
            <p className="text-sm text-slate-600 mt-1">Create a new dataset</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
          onClick={() => navigate('/lineage')}
        >
          <CardContent className="p-6 text-center">
            <GitBranch className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900">View Lineage</h3>
            <p className="text-sm text-slate-600 mt-1">Track data relationships</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
          onClick={() => navigate('/logs')}
        >
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-900">Audit Logs</h3>
            <p className="text-sm text-slate-600 mt-1">View system activity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
