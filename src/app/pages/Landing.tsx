import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Database, Shield, GitBranch, FileText, ChevronRight, Sparkles } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-50 dark:from-gray-950 dark:via-red-950/10 dark:to-gray-950">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
              Data Provenance
            </span>
          </div>
          <Button
            onClick={() => navigate('/login')}
            variant="ghost"
            className="text-sm font-medium hover:text-red-600 dark:hover:text-red-400"
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-950/30 rounded-full border border-red-200 dark:border-red-900">
            <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Enterprise Data Tracking
            </span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Track, Trace, Trust
              </span>
              <br />
              <span className="text-foreground">Your Data Journey</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A comprehensive platform for tracking data lineage, monitoring transformations, 
              and ensuring compliance across your entire data ecosystem.
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Button
              onClick={() => navigate('/login')}
              size="lg"
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              Get Started
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
            <div className="p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-800 transition-colors">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <GitBranch className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Data Lineage</h3>
              <p className="text-sm text-muted-foreground">
                Visualize complete data transformation paths
              </p>
            </div>

            <div className="p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-800 transition-colors">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Security Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Identify vulnerabilities and CVEs instantly
              </p>
            </div>

            <div className="p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-800 transition-colors">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/30 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Audit Logs</h3>
              <p className="text-sm text-muted-foreground">
                Complete activity tracking and compliance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Data Provenance System. All rights reserved.
        </div>
      </div>
    </div>
  );
}
