import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getDataset, getVersions, getTransformations, createVersion, createTransformation, getCurrentUser } from '../services/dataService';
import { Dataset, DataVersion, Transformation } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { ArrowLeft, GitBranch, Workflow, FileText, Plus, Database } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

export function DatasetDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [versions, setVersions] = useState<DataVersion[]>([]);
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showTransformDialog, setShowTransformDialog] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [transformType, setTransformType] = useState<Transformation['type']>('filter');
  const [transformDescription, setTransformDescription] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = () => {
    if (!id) return;
    
    const ds = getDataset(id);
    setDataset(ds || null);
    setVersions(getVersions(id));
    setTransformations(getTransformations(id));
  };

  const handleCreateVersion = () => {
    if (!id || !dataset) return;
    
    const user = getCurrentUser();
    if (!user) return;

    const newVersion = createVersion({
      dataset_id: id,
      version_number: dataset.current_version + 1,
      data: [],
      columns: [],
      created_by: user.id,
      change_summary: changeSummary,
    });

    loadData();
    setShowVersionDialog(false);
    setChangeSummary('');
    toast.success('New version created successfully');
  };

  const handleCreateTransformation = () => {
    if (!id || !dataset) return;
    
    const user = getCurrentUser();
    if (!user) return;

    createTransformation({
      dataset_id: id,
      version_id: versions[0]?.id || '',
      type: transformType,
      description: transformDescription,
      parameters: {},
      created_by: user.id,
    });

    loadData();
    setShowTransformDialog(false);
    setTransformDescription('');
    toast.success('Transformation applied successfully');
  };

  if (!dataset) {
    return (
      <div className="text-center py-12">
        <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">Dataset not found</p>
        <Button onClick={() => navigate('/dashboard/datasets')} className="mt-4">
          Back to Datasets
        </Button>
      </div>
    );
  }

  const getTransformColor = (type: string) => {
    switch (type) {
      case 'filter':
        return 'bg-blue-100 text-blue-700';
      case 'clean':
        return 'bg-green-100 text-green-700';
      case 'aggregate':
        return 'bg-purple-100 text-purple-700';
      case 'merge':
        return 'bg-orange-100 text-orange-700';
      case 'sort':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/datasets')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Datasets
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{dataset.name}</h1>
            <p className="text-slate-600 mt-1">{dataset.description}</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Version {dataset.current_version}
          </Badge>
        </div>
      </div>

      {/* Dataset Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Dataset Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Source Type</p>
              <Badge className="mt-1 capitalize">{dataset.source_type}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600">Rows</p>
              <p className="text-lg font-semibold mt-1">{dataset.row_count.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Columns</p>
              <p className="text-lg font-semibold mt-1">{dataset.column_count}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">File Type</p>
              <p className="text-lg font-semibold mt-1 uppercase">{dataset.file_type || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="versions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="versions" className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4" />
            <span>Versions</span>
          </TabsTrigger>
          <TabsTrigger value="transformations" className="flex items-center space-x-2">
            <Workflow className="w-4 h-4" />
            <span>Transformations</span>
          </TabsTrigger>
        </TabsList>

        {/* Versions Tab */}
        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Version History</CardTitle>
                  <CardDescription>Track all changes made to this dataset</CardDescription>
                </div>
                <Button onClick={() => setShowVersionDialog(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Version
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <div className="text-center py-8">
                  <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No versions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-bold">v{version.version_number}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{version.change_summary || 'No summary'}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {version.columns.length} columns
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {format(new Date(version.created_at), 'PPpp')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transformations Tab */}
        <TabsContent value="transformations">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Transformations</CardTitle>
                  <CardDescription>Data processing operations applied</CardDescription>
                </div>
                <Button onClick={() => setShowTransformDialog(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Transformation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transformations.length === 0 ? (
                <div className="text-center py-8">
                  <Workflow className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No transformations yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transformations.map((transform) => (
                        <TableRow key={transform.id}>
                          <TableCell>
                            <Badge className={getTransformColor(transform.type)}>
                              {transform.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{transform.description}</TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            {formatDistanceToNow(new Date(transform.created_at), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new version of this dataset to track changes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Change Summary</Label>
              <Textarea
                placeholder="Describe what changed in this version..."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateVersion}>Create Version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Transformation Dialog */}
      <Dialog open={showTransformDialog} onOpenChange={setShowTransformDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Transformation</DialogTitle>
            <DialogDescription>
              Apply a data transformation operation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Transformation Type</Label>
              <Select value={transformType} onValueChange={(value: any) => setTransformType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filter">Filter</SelectItem>
                  <SelectItem value="clean">Clean</SelectItem>
                  <SelectItem value="aggregate">Aggregate</SelectItem>
                  <SelectItem value="merge">Merge</SelectItem>
                  <SelectItem value="sort">Sort</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the transformation..."
                value={transformDescription}
                onChange={(e) => setTransformDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransformDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransformation}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}