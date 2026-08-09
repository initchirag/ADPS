import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Image,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ScanLine,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import * as exifr from 'exifr';

// ─── types ────────────────────────────────────────────────────────────────────

interface ToolResult {
  id: string;
  name: string;
  status: 'clean' | 'suspicious' | 'found' | 'skipped';
  summary: string;
  details: { label: string; value: string; flag?: boolean }[];
  riskContribution: number;
}

interface ScanReport {
  filename: string;
  filesize: number;
  filetype: string;
  dimensions?: string;
  scannedAt: string;
  riskScore: number;
  riskLevel: 'safe' | 'moderate' | 'critical';
  tools: ToolResult[];
}

// ─── real analysis functions ──────────────────────────────────────────────────

const MAGIC_SIGNATURES: { name: string; bytes: number[]; desc: string }[] = [
  { name: 'JPEG', bytes: [0xff, 0xd8, 0xff], desc: 'Nested JPEG image' },
  { name: 'PNG', bytes: [0x89, 0x50, 0x4e, 0x47], desc: 'Nested PNG image' },
  { name: 'ZIP', bytes: [0x50, 0x4b, 0x03, 0x04], desc: 'ZIP archive' },
  { name: 'PDF', bytes: [0x25, 0x50, 0x44, 0x46], desc: 'PDF document' },
  { name: 'GZIP', bytes: [0x1f, 0x8b], desc: 'GZIP archive' },
  { name: 'RAR', bytes: [0x52, 0x61, 0x72, 0x21], desc: 'RAR archive' },
  { name: '7-Zip', bytes: [0x37, 0x7a, 0xbc, 0xaf], desc: '7-Zip archive' },
  { name: 'EXE/DLL', bytes: [0x4d, 0x5a], desc: 'Windows executable' },
  { name: 'ELF', bytes: [0x7f, 0x45, 0x4c, 0x46], desc: 'Linux ELF executable' },
  { name: 'SQLite', bytes: [0x53, 0x51, 0x4c, 0x69], desc: 'SQLite database' },
];

async function runExifAnalysis(file: File): Promise<ToolResult> {
  try {
    const data = await exifr.parse(file, {
      tiff: true, exif: true, gps: true, iptc: true, xmp: true, icc: true,
    });

    if (!data || Object.keys(data).length === 0) {
      return {
        id: 'exif', name: 'EXIF & Metadata', status: 'clean', riskContribution: 0,
        summary: 'No embedded metadata found in this file.',
        details: [{ label: 'Result', value: 'No EXIF/IPTC/XMP metadata present' }],
      };
    }

    const details: { label: string; value: string; flag?: boolean }[] = [];
    let risk = 0;

    const sensitiveKeys = ['GPS', 'Latitude', 'Longitude', 'Author', 'Creator', 'Software', 'Artist', 'Copyright', 'Comment', 'UserComment'];

    for (const [key, val] of Object.entries(data)) {
      if (val === null || val === undefined) continue;
      let strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (strVal.length > 120) strVal = strVal.slice(0, 120) + '…';
      const isSensitive = sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()));
      if (isSensitive) risk += 10;
      details.push({ label: key, value: strVal, flag: isSensitive });
    }

    const hasGPS = 'latitude' in data || 'longitude' in data || 'GPSLatitude' in data;
    if (hasGPS) risk += 20;

    risk = Math.min(risk, 60);

    return {
      id: 'exif', name: 'EXIF & Metadata',
      status: risk > 15 ? 'suspicious' : 'clean',
      riskContribution: risk,
      summary: `${details.length} metadata fields extracted.${hasGPS ? ' GPS location data present — privacy risk.' : ''}`,
      details,
    };
  } catch {
    return {
      id: 'exif', name: 'EXIF & Metadata', status: 'clean', riskContribution: 0,
      summary: 'Could not parse metadata (format may not support EXIF).',
      details: [{ label: 'Note', value: 'Format does not contain parseable EXIF data' }],
    };
  }
}

async function runBinaryAnalysis(file: File): Promise<ToolResult> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const found: { type: string; offset: string; desc: string }[] = [];

  // Search for embedded signatures (skip the first header bytes of the file itself)
  const skipBytes = 16;
  for (const sig of MAGIC_SIGNATURES) {
    outer: for (let i = skipBytes; i < bytes.length - sig.bytes.length; i++) {
      if (bytes[i] !== sig.bytes[0]) continue;
      for (let j = 1; j < sig.bytes.length; j++) {
        if (bytes[i + j] !== sig.bytes[j]) continue outer;
      }
      found.push({
        type: sig.name,
        offset: `0x${i.toString(16).toUpperCase()}`,
        desc: sig.desc,
      });
      i += sig.bytes.length;
    }
  }

  // Check for data appended after JPEG EOI marker (0xFF 0xD9)
  let appendedBytes = 0;
  if (file.type === 'image/jpeg') {
    for (let i = bytes.length - 2; i >= 0; i--) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
        appendedBytes = bytes.length - i - 2;
        break;
      }
    }
  }

  const riskContribution = found.length * 20 + (appendedBytes > 0 ? 25 : 0);
  const details: { label: string; value: string; flag?: boolean }[] = [];

  if (found.length === 0 && appendedBytes === 0) {
    details.push({ label: 'Result', value: 'No embedded file signatures detected' });
    details.push({ label: 'Bytes scanned', value: `${bytes.length.toLocaleString()} bytes` });
    details.push({ label: 'Signatures checked', value: `${MAGIC_SIGNATURES.length} known file types` });
  } else {
    found.forEach(f => details.push({ label: `${f.type} at ${f.offset}`, value: f.desc, flag: true }));
    if (appendedBytes > 0) {
      details.push({ label: 'Appended data after EOF', value: `${appendedBytes} bytes found after JPEG EOI marker`, flag: true });
    }
    details.push({ label: 'Bytes scanned', value: `${bytes.length.toLocaleString()} bytes` });
  }

  return {
    id: 'binary', name: 'Embedded File Detection',
    status: found.length > 0 || appendedBytes > 0 ? 'found' : 'clean',
    riskContribution: Math.min(riskContribution, 70),
    summary: found.length > 0 || appendedBytes > 0
      ? `${found.length} embedded signature(s) detected.${appendedBytes > 0 ? ` ${appendedBytes} bytes appended after EOF.` : ''}`
      : 'No embedded files or appended data detected.',
    details,
  };
}

async function runEntropyAnalysis(file: File): Promise<ToolResult> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const freq = new Array(256).fill(0);
  for (const b of bytes) freq[b]++;

  let entropy = 0;
  const len = bytes.length;
  for (const f of freq) {
    if (f > 0) {
      const p = f / len;
      entropy -= p * Math.log2(p);
    }
  }
  entropy = Math.round(entropy * 10000) / 10000;

  // Count zero bytes (can indicate padding or embedded data)
  const zeroBytePct = Math.round((freq[0] / len) * 10000) / 100;

  const suspicious = entropy > 7.95;
  const riskContribution = suspicious ? 35 : entropy > 7.8 ? 15 : 0;

  const interpretation = entropy > 7.95
    ? 'Near-maximum entropy — strongly suggests encrypted or compressed hidden payload'
    : entropy > 7.8
    ? 'High entropy — possibly contains compressed image data or minor anomaly'
    : entropy > 6.5
    ? 'Normal entropy for a compressed image format'
    : 'Low entropy — simple or uniform image content';

  return {
    id: 'entropy', name: 'Entropy Analysis',
    status: suspicious ? 'suspicious' : 'clean',
    riskContribution,
    summary: `Shannon entropy: ${entropy} / 8.0 bits. ${interpretation.split(' — ')[0]}.`,
    details: [
      { label: 'Shannon Entropy', value: `${entropy} / 8.0 bits`, flag: suspicious },
      { label: 'Interpretation', value: interpretation },
      { label: 'Zero bytes', value: `${zeroBytePct}% of file` },
      { label: 'File size', value: `${len.toLocaleString()} bytes` },
      { label: 'Unique byte values', value: `${freq.filter(f => f > 0).length} / 256` },
    ],
  };
}

async function runLSBAnalysis(file: File): Promise<ToolResult> {
  // LSB analysis is meaningful for lossless formats (PNG, BMP)
  // For JPEG it's inconclusive due to DCT compression
  const isLossless = file.type === 'image/png' || file.type === 'image/bmp' || file.type === 'image/tiff';

  if (!isLossless) {
    return {
      id: 'lsb', name: 'LSB Steganography',
      status: 'skipped', riskContribution: 0,
      summary: `LSB pixel analysis is not applicable to ${file.type.split('/')[1].toUpperCase()} (lossy format). Upload a PNG or BMP for this test.`,
      details: [{ label: 'Status', value: 'Skipped — JPEG DCT compression randomizes LSBs, making this test unreliable for this format' }],
    };
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const maxPx = 800;
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.floor(img.width * scale);
      const h = Math.floor(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      // Chi-square test: for each channel, count even/odd value pair frequencies
      // Natural images: unequal (high chi2); stego images: equalized (low chi2)
      let totalChi2 = 0;
      let dfTotal = 0;

      for (let ch = 0; ch < 3; ch++) {
        const pairs = new Array(128).fill(0).map(() => [0, 0]);
        for (let i = ch; i < data.length; i += 4) {
          const v = data[i];
          pairs[Math.floor(v / 2)][v % 2]++;
        }
        for (const [a, b] of pairs) {
          const total = a + b;
          if (total === 0) continue;
          const expected = total / 2;
          totalChi2 += (Math.pow(a - expected, 2) + Math.pow(b - expected, 2)) / expected;
          dfTotal++;
        }
      }

      const normalizedChi2 = dfTotal > 0 ? totalChi2 / dfTotal : 1;

      // Very low chi2 = suspicious (LSBs too uniform = stego)
      const suspicious = normalizedChi2 < 0.05;
      const riskContribution = suspicious ? 50 : normalizedChi2 < 0.15 ? 20 : 0;

      URL.revokeObjectURL(url);
      resolve({
        id: 'lsb', name: 'LSB Steganography',
        status: suspicious ? 'found' : 'clean',
        riskContribution,
        summary: suspicious
          ? `Chi-square statistic ${normalizedChi2.toFixed(4)} — abnormally low, strongly suggests LSB payload embedding.`
          : `Chi-square statistic ${normalizedChi2.toFixed(4)} — within normal range for a natural image.`,
        details: [
          { label: 'Chi-square (normalized)', value: normalizedChi2.toFixed(6), flag: suspicious },
          { label: 'Threshold for suspicion', value: '< 0.05 per degree of freedom' },
          { label: 'Verdict', value: suspicious ? 'LSB manipulation detected' : 'No LSB manipulation detected', flag: suspicious },
          { label: 'Pixels analyzed', value: `${(w * h).toLocaleString()} (sampled at ${Math.round(scale * 100)}%)` },
          { label: 'Channels tested', value: 'Red, Green, Blue (3 channels)' },
        ],
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        id: 'lsb', name: 'LSB Steganography', status: 'skipped', riskContribution: 0,
        summary: 'Image could not be loaded for pixel-level analysis.',
        details: [{ label: 'Error', value: 'Failed to load image for canvas pixel extraction' }],
      });
    };
    img.src = url;
  });
}

async function runFileIntegrityCheck(file: File): Promise<ToolResult> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const details: { label: string; value: string; flag?: boolean }[] = [];
  let risk = 0;

  details.push({ label: 'Filename', value: file.name });
  details.push({ label: 'MIME type (browser)', value: file.type || 'unknown' });
  details.push({ label: 'File size', value: `${(file.size / 1024).toFixed(2)} KB` });
  details.push({ label: 'Last modified', value: new Date(file.lastModified).toLocaleString() });

  // Check extension vs actual magic bytes
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const firstBytes = Array.from(bytes.slice(0, 4));

  const extToMagic: Record<string, number[]> = {
    jpg: [0xff, 0xd8, 0xff],
    jpeg: [0xff, 0xd8, 0xff],
    png: [0x89, 0x50, 0x4e, 0x47],
    bmp: [0x42, 0x4d],
    gif: [0x47, 0x49, 0x46, 0x38],
    webp: [0x52, 0x49, 0x46, 0x46],
    tiff: [0x49, 0x49, 0x2a, 0x00],
  };

  const expectedMagic = extToMagic[ext];
  let extensionMismatch = false;
  if (expectedMagic) {
    extensionMismatch = !expectedMagic.every((b, i) => firstBytes[i] === b);
    if (extensionMismatch) {
      risk += 30;
      details.push({ label: 'Extension vs header', value: `Mismatch — .${ext} extension but file header is 0x${firstBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`, flag: true });
    } else {
      details.push({ label: 'Extension vs header', value: 'Matches — file extension is consistent with binary header' });
    }
  }

  // JPEG: check if EOI marker is at expected position
  if (ext === 'jpg' || ext === 'jpeg') {
    const hasEOI = bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
    if (!hasEOI) {
      risk += 15;
      details.push({ label: 'JPEG integrity', value: 'EOI marker (0xFF 0xD9) not found at end of file — file may be truncated or modified', flag: true });
    } else {
      details.push({ label: 'JPEG integrity', value: 'EOI marker (0xFF 0xD9) present at end of file' });
    }
  }

  // PNG: check for IEND chunk
  if (ext === 'png') {
    const iend = [0x49, 0x45, 0x4e, 0x44];
    let hasIEND = false;
    for (let i = bytes.length - 12; i < bytes.length - 4; i++) {
      if (iend.every((b, j) => bytes[i + j] === b)) { hasIEND = true; break; }
    }
    if (!hasIEND) {
      risk += 15;
      details.push({ label: 'PNG integrity', value: 'IEND chunk not found at expected position — file structure may be modified', flag: true });
    } else {
      details.push({ label: 'PNG integrity', value: 'IEND chunk present — file structure is intact' });
    }
  }

  return {
    id: 'integrity', name: 'File Integrity',
    status: risk > 0 ? 'suspicious' : 'clean',
    riskContribution: Math.min(risk, 40),
    summary: extensionMismatch
      ? 'Extension/header mismatch detected — file may be disguised.'
      : 'File extension and binary structure are consistent.',
    details,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/bmp', 'image/gif', 'image/tiff', 'image/webp'];

function fmtBytes(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function RiskBadge({ level }: { level: ScanReport['riskLevel'] }) {
  const map = {
    safe: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };
  return <Badge className={`${map[level]} font-semibold capitalize`}>{level}</Badge>;
}

function StatusIcon({ status }: { status: ToolResult['status'] }) {
  if (status === 'clean') return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
  if (status === 'found') return <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
  if (status === 'suspicious') return <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
  return <div className="h-4 w-4 rounded-full bg-muted flex-shrink-0" />;
}

function StatusBadge({ status }: { status: ToolResult['status'] }) {
  const map: Record<string, string> = {
    clean: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    found: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    suspicious: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    skipped: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  const label = { clean: 'Clean', found: 'Found', suspicious: 'Suspicious', skipped: 'Skipped' }[status] ?? status;
  return <Badge className={`${map[status]} text-xs`}>{label}</Badge>;
}

const TOOLS = [
  { id: 'exif', label: 'EXIF & Metadata', desc: 'GPS, author, software, camera info' },
  { id: 'binary', label: 'Embedded Files', desc: 'Magic byte signatures inside binary' },
  { id: 'entropy', label: 'Entropy Analysis', desc: 'Shannon entropy anomaly detection' },
  { id: 'lsb', label: 'LSB Steganography', desc: 'Pixel chi-square test (PNG/BMP)' },
  { id: 'integrity', label: 'File Integrity', desc: 'Header vs extension + structure check' },
];

// ─── component ────────────────────────────────────────────────────────────────

export function AuditImage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set(TOOLS.map(t => t.id)));
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [report, setReport] = useState<ScanReport | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const onFile = (f: File) => {
    if (!SUPPORTED_TYPES.includes(f.type)) {
      toast.error('Unsupported format. Upload JPEG, PNG, BMP, GIF, TIFF, or WEBP');
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setReport(null);
  };

  const toggleTool = (id: string) => {
    setSelectedTools(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const runScan = async () => {
    if (!file) return;
    setAnalyzing(true);
    setProgress(0);
    setReport(null);

    const steps: Array<{ id: string; fn: (f: File) => Promise<ToolResult>; label: string }> = [
      { id: 'exif', fn: runExifAnalysis, label: 'Extracting EXIF metadata…' },
      { id: 'binary', fn: runBinaryAnalysis, label: 'Scanning binary signatures…' },
      { id: 'entropy', fn: runEntropyAnalysis, label: 'Computing Shannon entropy…' },
      { id: 'lsb', fn: runLSBAnalysis, label: 'Running LSB chi-square test…' },
      { id: 'integrity', fn: runFileIntegrityCheck, label: 'Checking file integrity…' },
    ];

    const activeSteps = steps.filter(s => selectedTools.has(s.id));
    const results: ToolResult[] = [];

    for (let i = 0; i < activeSteps.length; i++) {
      const step = activeSteps[i];
      setProgressLabel(step.label);
      setProgress(Math.round((i / activeSteps.length) * 100));
      const result = await step.fn(file);
      results.push(result);
    }

    // Add "skipped" entries for deselected tools
    for (const tool of TOOLS) {
      if (!selectedTools.has(tool.id)) {
        results.push({
          id: tool.id, name: tool.label, status: 'skipped', riskContribution: 0,
          summary: 'This tool was not selected for this scan.',
          details: [],
        });
      }
    }

    const totalRisk = Math.min(100, results.reduce((sum, r) => sum + r.riskContribution, 0));
    const riskLevel: ScanReport['riskLevel'] = totalRisk >= 60 ? 'critical' : totalRisk >= 25 ? 'moderate' : 'safe';

    // Get image dimensions
    let dimensions: string | undefined;
    if (previewUrl) {
      try {
        const img = new window.Image();
        await new Promise<void>(res => { img.onload = () => res(); img.src = previewUrl; });
        dimensions = `${img.naturalWidth} × ${img.naturalHeight} px`;
      } catch { /* ignore */ }
    }

    setProgress(100);
    setProgressLabel('Complete');
    setReport({
      filename: file.name,
      filesize: file.size,
      filetype: file.type,
      dimensions,
      scannedAt: new Date().toLocaleString(),
      riskScore: totalRisk,
      riskLevel,
      tools: results,
    });

    // Auto-open sections with findings
    const toOpen = new Set(results.filter(r => r.status !== 'clean' && r.status !== 'skipped').map(r => r.id));
    setOpenSections(toOpen);
    setAnalyzing(false);
    toast.success('Forensic scan complete');
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `image_forensic_${report.filename.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    a.click();
    toast.success('Report exported');
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setReport(null);
    setProgress(0);
    setProgressLabel('');
  };

  const flaggedCount = report?.tools.filter(t => t.status !== 'clean' && t.status !== 'skipped').length ?? 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image className="h-6 w-6 text-red-600" />
            Audit Image
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deep forensic analysis — EXIF, steganography, embedded files, entropy
          </p>
        </div>
        {report && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> New Scan
            </Button>
            <Button size="sm" onClick={downloadReport} className="bg-red-600 hover:bg-red-700 text-white">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export JSON
            </Button>
          </div>
        )}
      </div>

      {/* Upload + Configure */}
      {!report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Drop zone */}
          <div className="md:col-span-2">
            <div
              className={`border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                drag ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-border hover:border-red-400'
              } ${file ? 'p-4' : 'p-12'}`}
              onDragEnter={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={e => { e.preventDefault(); setDrag(false); }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
              onClick={() => !file && fileRef.current?.click()}
            >
              {analyzing ? (
                <div className="space-y-3 text-center py-4">
                  <ScanLine className="h-8 w-8 mx-auto text-red-600 animate-pulse" />
                  <p className="text-sm font-medium">{progressLabel}</p>
                  <Progress value={progress} className="max-w-xs mx-auto" />
                  <p className="text-xs text-muted-foreground">{progress}%</p>
                </div>
              ) : file && previewUrl ? (
                <div className="flex items-center gap-4">
                  <img src={previewUrl} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-border flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{fmtBytes(file.size)} · {file.type}</p>
                    <button
                      className="text-xs text-red-600 hover:underline mt-1"
                      onClick={e => { e.stopPropagation(); reset(); fileRef.current?.click(); }}
                    >
                      Change file
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Drop image here or click to browse</p>
                  <p className="text-xs text-muted-foreground">JPEG · PNG · BMP · GIF · TIFF · WEBP</p>
                </div>
              )}
              <input ref={fileRef} type="file" className="hidden" accept={SUPPORTED_TYPES.join(',')}
                onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); e.target.value = ''; }} />
            </div>
          </div>

          {/* Tool selector */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Select Tools</p>
            {TOOLS.map(tool => (
              <label key={tool.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                selectedTools.has(tool.id)
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                  : 'border-border hover:bg-muted/50'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedTools.has(tool.id)}
                  onChange={() => toggleTool(tool.id)}
                  className="mt-0.5 accent-red-600"
                />
                <div>
                  <p className="text-xs font-semibold leading-tight">{tool.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{tool.desc}</p>
                </div>
              </label>
            ))}
            <Button
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 mt-1"
              onClick={runScan}
              disabled={!file || analyzing || selectedTools.size === 0}
            >
              <ScanLine className="h-4 w-4 mr-2" />
              {analyzing ? 'Scanning…' : 'Run Scan'}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {report && (
        <div className="space-y-4">
          {/* Summary bar */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {previewUrl && (
                    <img src={previewUrl} alt="scan" className="h-12 w-12 rounded-lg object-cover border border-border flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-sm truncate max-w-[200px]">{report.filename}</p>
                    <p className="text-xs text-muted-foreground">{fmtBytes(report.filesize)}{report.dimensions ? ` · ${report.dimensions}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums">{report.riskScore}<span className="text-sm text-muted-foreground">/100</span></p>
                    <p className="text-xs text-muted-foreground">Risk Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{flaggedCount}</p>
                    <p className="text-xs text-muted-foreground">Flagged</p>
                  </div>
                  <RiskBadge level={report.riskLevel} />
                </div>
              </div>
              <Progress value={report.riskScore} className="mt-3 h-2" />
            </CardContent>
          </Card>

          {/* Tool results accordion */}
          <div className="space-y-2">
            {report.tools.map(tool => (
              <div key={tool.id} className={`border rounded-xl overflow-hidden transition-colors ${
                tool.status === 'found' ? 'border-red-200 dark:border-red-900/50' :
                tool.status === 'suspicious' ? 'border-yellow-200 dark:border-yellow-900/50' :
                'border-border'
              }`}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                  onClick={() => toggleSection(tool.id)}
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon status={tool.status} />
                    <div>
                      <p className="text-sm font-semibold">{tool.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{tool.summary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={tool.status} />
                    {openSections.has(tool.id)
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {openSections.has(tool.id) && tool.details.length > 0 && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3">
                    <div className="divide-y divide-border/50">
                      {tool.details.map((d, i) => (
                        <div key={i} className={`flex justify-between items-start py-2 gap-4 text-sm ${d.flag ? 'text-red-700 dark:text-red-300' : ''}`}>
                          <span className={`font-medium flex-shrink-0 ${d.flag ? '' : 'text-muted-foreground'}`}>{d.label}</span>
                          <span className="text-right break-words max-w-[60%]">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
