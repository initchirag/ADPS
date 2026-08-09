import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createDataset, createVersion, getCurrentUser } from '../services/dataService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function UploadDataset() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'file' | 'api' | 'manual'>('file');
  const [fileType, setFileType] = useState<'csv' | 'json'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = getCurrentUser();
    if (!user) {
      toast.error('You must be logged in to upload datasets');
      setLoading(false);
      return;
    }

    // Simulate file processing
    setTimeout(() => {
      // Create mock dataset
      const rowCount = Math.floor(Math.random() * 1000) + 100;
      const columnCount = Math.floor(Math.random() * 10) + 5;

      const newDataset = createDataset({
        name,
        description,
        source_id: `s${Date.now()}`,
        source_type: sourceType,
        created_by: user.id,
        current_version: 1,
        row_count: rowCount,
        column_count: columnCount,
        file_type: fileType,
      });

      // Create initial version
      const columns = Array.from({ length: columnCount }, (_, i) => `column_${i + 1}`);
      createVersion({
        dataset_id: newDataset.id,
        version_number: 1,
        data: [],
        columns,
        created_by: user.id,
        change_summary: 'Initial upload',
      });

      setLoading(false);
      setUploadSuccess(true);
      toast.success('Dataset uploaded successfully!');

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/datasets/${newDataset.id}`);
      }, 2000);
    }, 1500);
  };

  if (uploadSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-green-500">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Successful!</h2>
            <p className="text-slate-600">Your dataset has been created and is being processed.</p>
            <p className="text-sm text-slate-500 mt-2">Redirecting to dataset details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Upload Dataset</h1>
        <p className="text-slate-600 mt-1">Create a new dataset to track its provenance</p>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Dataset Information</CardTitle>
            <CardDescription>Provide details about your dataset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Dataset Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Dataset Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Sales Data Q1 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the contents and purpose of this dataset..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Source Type */}
            <div className="space-y-2">
              <Label htmlFor="source">Source Type *</Label>
              <Select value={sourceType} onValueChange={(value: any) => setSourceType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="api">API Import</SelectItem>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Type */}
            <div className="space-y-2">
              <Label htmlFor="filetype">File Type *</Label>
              <Select value={fileType} onValueChange={(value: any) => setFileType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* File Upload */}
            {sourceType === 'file' && (
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-slate-500 mb-4">
                    CSV or JSON files only
                  </p>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.json"
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto"
                  />
                  {file && (
                    <div className="mt-4 flex items-center justify-center space-x-2 text-sm">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-700">{file.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/datasets')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Dataset
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Tips for Uploading</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Ensure your CSV file has headers in the first row</li>
            <li>• JSON files should be an array of objects with consistent structure</li>
            <li>• Large files may take longer to process</li>
            <li>• Version history will be automatically tracked for all updates</li>
            <li>• You can apply transformations after upload to clean or process the data</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}