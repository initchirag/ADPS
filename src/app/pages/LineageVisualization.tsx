import { useEffect, useState } from 'react';
import { getDatasets, getLineageRelationships, getTransformations } from '../services/dataService';
import { Dataset, LineageRelationship, Transformation } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { GitBranch, ArrowRight, Database, Workflow } from 'lucide-react';

interface LineageNode {
  dataset: Dataset;
  children: LineageNode[];
  transformation?: Transformation;
}

export function LineageVisualization() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [lineage, setLineage] = useState<LineageRelationship[]>([]);
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [lineageTree, setLineageTree] = useState<LineageNode[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const ds = getDatasets();
    const ln = getLineageRelationships();
    const tf = getTransformations();
    
    setDatasets(ds);
    setLineage(ln);
    setTransformations(tf);
    
    buildLineageTree(ds, ln, tf);
  };

  const buildLineageTree = (
    datasets: Dataset[],
    lineage: LineageRelationship[],
    transformations: Transformation[]
  ) => {
    // Find root datasets (those without parents)
    const parentIds = new Set(lineage.map(l => l.child_dataset_id));
    const roots = datasets.filter(d => !parentIds.has(d.id));
    
    const buildNode = (dataset: Dataset): LineageNode => {
      const children = lineage
        .filter(l => l.parent_dataset_id === dataset.id)
        .map(l => {
          const childDataset = datasets.find(d => d.id === l.child_dataset_id);
          const transformation = transformations.find(t => t.id === l.transformation_id);
          
          if (childDataset) {
            return {
              ...buildNode(childDataset),
              transformation,
            };
          }
          return null;
        })
        .filter((n): n is LineageNode => n !== null);
      
      return {
        dataset,
        children,
      };
    };
    
    const tree = roots.map(buildNode);
    setLineageTree(tree);
  };

  const getTransformColor = (type?: string) => {
    if (!type) return 'bg-slate-100 text-slate-700';
    
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

  const renderLineageNode = (node: LineageNode, level: number = 0) => {
    return (
      <div key={node.dataset.id} className="relative">
        {/* Dataset Card */}
        <div className="flex items-center space-x-4 mb-6">
          {level > 0 && (
            <div className="flex items-center">
              <div className="w-12 border-t-2 border-slate-300"></div>
              <ArrowRight className="w-6 h-6 text-slate-400 -ml-1" />
            </div>
          )}
          
          <Card className={`flex-1 ${level === 0 ? 'border-2 border-blue-500' : 'hover:shadow-md'} transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 ${level === 0 ? 'bg-blue-100' : 'bg-slate-100'} rounded-lg flex items-center justify-center`}>
                    <Database className={`w-5 h-5 ${level === 0 ? 'text-blue-600' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{node.dataset.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{node.dataset.description}</p>
                    <div className="flex items-center space-x-3 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {node.dataset.row_count.toLocaleString()} rows
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        v{node.dataset.current_version}
                      </Badge>
                    </div>
                  </div>
                </div>
                {level === 0 && (
                  <Badge className="bg-blue-100 text-blue-700">Root</Badge>
                )}
              </div>
              
              {/* Transformation Info */}
              {node.transformation && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center space-x-2">
                    <Workflow className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-600">Transformation:</span>
                    <Badge className={getTransformColor(node.transformation.type)}>
                      {node.transformation.type}
                    </Badge>
                    <span className="text-xs text-slate-600">{node.transformation.description}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Children */}
        {node.children.length > 0 && (
          <div className={`${level > 0 ? 'ml-12' : 'ml-0'} space-y-0`}>
            {node.children.map(child => renderLineageNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Data Lineage</h1>
        <p className="text-slate-600 mt-1">Visualize data flow and transformations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Datasets</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{datasets.length}</p>
              </div>
              <Database className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Relationships</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{lineage.length}</p>
              </div>
              <GitBranch className="w-10 h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Transformations</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{transformations.length}</p>
              </div>
              <Workflow className="w-10 h-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lineage Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="w-5 h-5" />
            <span>Lineage Graph</span>
          </CardTitle>
          <CardDescription>Visual representation of data flow and dependencies</CardDescription>
        </CardHeader>
        <CardContent>
          {lineageTree.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No lineage relationships found</p>
              <p className="text-sm text-slate-500 mt-2">
                Create transformations to establish data lineage
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {lineageTree.map(node => renderLineageNode(node))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-base">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-700">Root</Badge>
              <span className="text-slate-600">Original dataset</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-700">clean</Badge>
              <span className="text-slate-600">Data cleaning</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-purple-100 text-purple-700">aggregate</Badge>
              <span className="text-slate-600">Data aggregation</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-700">filter</Badge>
              <span className="text-slate-600">Data filtering</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-orange-100 text-orange-700">merge</Badge>
              <span className="text-slate-600">Data merging</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-pink-100 text-pink-700">sort</Badge>
              <span className="text-slate-600">Data sorting</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
