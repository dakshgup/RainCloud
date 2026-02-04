'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import {
  Upload,
  Download,
  FileText,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Loader2,
  Users,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Contact, ContactFormData } from '../lib/ContactManager';
import {
  DataImporter,
  DataExporter,
  ImportResult,
  ImportOptions,
  ExportOptions,
  ImportFileType,
  ExportFileType,
  ImportProgress,
  DuplicateMatch,
  ImportValidationError,
  ImportedContact,
  FieldMapping,
  ConflictResolution,
  readFileAsText,
  detectFileType,
  downloadFile,
  getMimeType,
  DEFAULT_CSV_MAPPINGS,
} from '../lib/DataImportExport';

// ============================================================================
// Props
// ============================================================================

interface DataImportExportProps {
  contacts: Contact[];
  onImport: (contacts: ImportedContact[]) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export default function DataImportExport({ contacts, onImport }: DataImportExportProps) {
  const [showImportSheet, setShowImportSheet] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowImportSheet(true)}
        className="gap-2"
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowExportSheet(true)}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export
      </Button>

      <ImportSheet
        open={showImportSheet}
        onOpenChange={setShowImportSheet}
        existingContacts={contacts}
        onImport={onImport}
      />

      <ExportSheet
        open={showExportSheet}
        onOpenChange={setShowExportSheet}
        contacts={contacts}
      />
    </div>
  );
}

// ============================================================================
// Import Sheet
// ============================================================================

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'results';

interface ImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingContacts: Contact[];
  onImport: (contacts: ImportedContact[]) => void;
}

function ImportSheet({ open, onOpenChange, existingContacts, onImport }: ImportSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileType, setFileType] = useState<ImportFileType>('csv');
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<ConflictResolution>('skip');
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [expandedDuplicates, setExpandedDuplicates] = useState<Set<number>>(new Set());
  const [expandedErrors, setExpandedErrors] = useState(false);

  const resetState = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setFileContent('');
    setDetectedHeaders([]);
    setFieldMappings([]);
    setImportProgress(null);
    setImportResult(null);
    setExpandedDuplicates(new Set());
    setExpandedErrors(false);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Detect file type
    const detected = detectFileType(file.name);
    if (detected) {
      setFileType(detected);
    }

    // Read file content
    try {
      const content = await readFileAsText(file);
      setFileContent(content);

      // Parse headers for CSV - use detected value, not stale state
      const effectiveFileType = detected || fileType;
      if (effectiveFileType === 'csv') {
        const firstLine = content.split('\n')[0];
        const headers = firstLine.split(/[,;\t]/).map(h => h.replace(/"/g, '').trim());
        setDetectedHeaders(headers);

        // Auto-detect mappings
        const autoMappings: FieldMapping[] = [];
        for (const header of headers) {
          const match = DEFAULT_CSV_MAPPINGS.find(
            m => m.sourceField === header.toLowerCase()
          );
          if (match) {
            autoMappings.push({ ...match, sourceField: header });
          }
        }

        setFieldMappings(autoMappings);
      }

      setStep('mapping');
    } catch {
      // File read error - user will see no content loaded
    }
  }, [fileType]);

  const handleMappingChange = useCallback((sourceField: string, targetField: keyof ContactFormData | '') => {
    setFieldMappings(prev => {
      const filtered = prev.filter(m => m.sourceField !== sourceField);
      if (targetField) {
        filtered.push({ sourceField, targetField });
      }
      return filtered;
    });
  }, []);

  const handleImport = useCallback(async () => {
    setStep('importing');

    const options: ImportOptions = {
      fileType,
      fieldMapping: fieldMappings,
      skipFirstRow: true,
      duplicateHandling,
      validateEmails: true,
      validatePhones: true,
      trimWhitespace: true,
      skipEmptyRows: true,
    };

    const importer = new DataImporter(existingContacts, setImportProgress);
    const result = await importer.import(fileContent, options);

    setImportResult(result);
    setStep('results');

    // Import valid contacts even if some rows had errors (partial success)
    if (result.contacts.length > 0) {
      onImport(result.contacts);
    }
  }, [fileType, fieldMappings, duplicateHandling, existingContacts, fileContent, onImport]);

  const toggleDuplicate = useCallback((index: number) => {
    setExpandedDuplicates(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetState();
    }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Contacts
          </SheetTitle>
          <SheetDescription>
            Import contacts from CSV, JSON, or vCard files
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between text-sm">
            <StepIndicator step={1} label="Upload" active={step === 'upload'} completed={step !== 'upload'} />
            <ChevronRight className="h-4 w-4 text-zinc-400" />
            <StepIndicator step={2} label="Map" active={step === 'mapping'} completed={['preview', 'importing', 'results'].includes(step)} />
            <ChevronRight className="h-4 w-4 text-zinc-400" />
            <StepIndicator step={3} label="Import" active={step === 'importing' || step === 'results'} completed={step === 'results'} />
          </div>

          {/* Step Content */}
          {step === 'upload' && (
            <UploadStep
              fileInputRef={fileInputRef}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          )}

          {step === 'mapping' && (
            <MappingStep
              headers={detectedHeaders}
              mappings={fieldMappings}
              duplicateHandling={duplicateHandling}
              onMappingChange={handleMappingChange}
              onDuplicateHandlingChange={setDuplicateHandling}
              onBack={() => setStep('upload')}
              onNext={handleImport}
            />
          )}

          {step === 'importing' && importProgress && (
            <ImportingStep progress={importProgress} />
          )}

          {step === 'results' && importResult && (
            <ResultsStep
              result={importResult}
              expandedDuplicates={expandedDuplicates}
              expandedErrors={expandedErrors}
              onToggleDuplicate={toggleDuplicate}
              onToggleErrors={() => setExpandedErrors(!expandedErrors)}
              onDone={() => {
                onOpenChange(false);
                resetState();
              }}
              onImportAnother={() => resetState()}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Step Components
// ============================================================================

function StepIndicator({ step, label, active, completed }: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
        ${completed ? 'bg-green-500 text-white' : active ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-200 dark:bg-zinc-700'}`}
      >
        {completed ? <CheckCircle className="h-4 w-4" /> : step}
      </div>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

function UploadStep({ fileInputRef, selectedFile, onFileSelect }: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <Card
        className="border-2 border-dashed cursor-pointer hover:border-zinc-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="py-12 text-center">
          <Upload className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
          <p className="text-lg font-medium">Drop file here or click to browse</p>
          <p className="text-sm text-zinc-500 mt-2">
            Supports CSV, JSON, and vCard (.vcf) files
          </p>
          {selectedFile && (
            <p className="text-sm text-green-600 mt-4">
              Selected: {selectedFile.name}
            </p>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.vcf,.vcard,.tsv"
        onChange={onFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-3 gap-4">
        <FormatCard icon={FileSpreadsheet} label="CSV" description="Comma-separated values" />
        <FormatCard icon={FileJson} label="JSON" description="JavaScript Object Notation" />
        <FormatCard icon={FileText} label="vCard" description="Virtual contact file" />
      </div>
    </div>
  );
}

function FormatCard({ icon: Icon, label, description }: {
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Card className="text-center p-4">
      <Icon className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
      <p className="font-medium text-sm">{label}</p>
      <p className="text-xs text-zinc-500">{description}</p>
    </Card>
  );
}

function MappingStep({ headers, mappings, duplicateHandling, onMappingChange, onDuplicateHandlingChange, onBack, onNext }: {
  headers: string[];
  mappings: FieldMapping[];
  duplicateHandling: ConflictResolution;
  onMappingChange: (source: string, target: keyof ContactFormData | '') => void;
  onDuplicateHandlingChange: (handling: ConflictResolution) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const targetFields: (keyof ContactFormData)[] = ['firstName', 'lastName', 'email', 'phone', 'company', 'notes'];

  const getMappedTarget = (source: string): string => {
    const mapping = mappings.find(m => m.sourceField === source);
    return mapping?.targetField || '';
  };

  const requiredMapped = mappings.some(m => m.targetField === 'firstName') &&
    mappings.some(m => m.targetField === 'lastName') &&
    mappings.some(m => m.targetField === 'email');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Field Mapping</CardTitle>
          <CardDescription>
            Map your file columns to contact fields
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {headers.map(header => (
            <div key={header} className="flex items-center gap-3">
              <span className="w-32 text-sm truncate" title={header}>{header}</span>
              <ArrowRight className="h-4 w-4 text-zinc-400 flex-shrink-0" />
              <select
                value={getMappedTarget(header)}
                onChange={(e) => onMappingChange(header, e.target.value as keyof ContactFormData | '')}
                className="flex-1 h-9 rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 text-sm"
              >
                <option value="">-- Skip --</option>
                {targetFields.map(field => (
                  <option key={field} value={field}>
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Duplicate Handling</CardTitle>
          <CardDescription>
            What to do when a contact already exists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { value: 'skip', label: 'Skip duplicates', description: 'Keep existing contacts unchanged' },
              { value: 'overwrite', label: 'Overwrite', description: 'Replace existing contacts with imported data' },
              { value: 'merge', label: 'Merge', description: 'Update empty fields only' },
              { value: 'create_new', label: 'Create new', description: 'Always create new contacts' },
            ].map(option => (
              <label key={option.value} className="flex items-start gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                <input
                  type="radio"
                  name="duplicateHandling"
                  value={option.value}
                  checked={duplicateHandling === option.value}
                  onChange={() => onDuplicateHandlingChange(option.value as ConflictResolution)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-zinc-500">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {!requiredMapped && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Please map firstName, lastName, and email fields</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!requiredMapped} className="flex-1">
          Start Import
        </Button>
      </div>
    </div>
  );
}

function ImportingStep({ progress }: { progress: ImportProgress }) {
  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="py-12 text-center space-y-6">
      <Loader2 className="h-12 w-12 mx-auto text-zinc-400 animate-spin" />
      <div>
        <p className="text-lg font-medium capitalize">{progress.phase.replace(/_/g, ' ')}</p>
        <p className="text-sm text-zinc-500 mt-1">{progress.message}</p>
      </div>
      <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
        <div
          className="bg-zinc-900 dark:bg-zinc-100 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-zinc-500">{percentage}%</p>
    </div>
  );
}

function ResultsStep({ result, expandedDuplicates, expandedErrors, onToggleDuplicate, onToggleErrors, onDone, onImportAnother }: {
  result: ImportResult;
  expandedDuplicates: Set<number>;
  expandedErrors: boolean;
  onToggleDuplicate: (index: number) => void;
  onToggleErrors: () => void;
  onDone: () => void;
  onImportAnother: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className={result.success ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
        <CardContent className="py-6 text-center">
          {result.success ? (
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          ) : (
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          )}
          <p className="text-lg font-medium">
            {result.success ? 'Import Complete' : 'Import Completed with Errors'}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Imported" value={result.importedCount} color="green" />
        <StatCard icon={AlertCircle} label="Errors" value={result.errorCount} color="red" />
        <StatCard icon={RefreshCw} label="Duplicates" value={result.duplicateCount} color="amber" />
        <StatCard icon={FileText} label="Skipped" value={result.skippedCount} color="zinc" />
      </div>

      {/* Errors */}
      {result.errors.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={onToggleErrors}
          >
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Errors ({result.errors.length})
              </span>
              {expandedErrors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {expandedErrors && (
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.errors.map((error, i) => (
                  <ErrorRow key={i} error={error} />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Duplicates */}
      {result.duplicates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-500" />
              Duplicates Found ({result.duplicates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.duplicates.slice(0, 10).map((dup, i) => (
                <DuplicateRow
                  key={i}
                  duplicate={dup}
                  expanded={expandedDuplicates.has(i)}
                  onToggle={() => onToggleDuplicate(i)}
                />
              ))}
              {result.duplicates.length > 10 && (
                <p className="text-sm text-zinc-500 text-center py-2">
                  And {result.duplicates.length - 10} more...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onImportAnother}>Import Another</Button>
        <Button onClick={onDone} className="flex-1">Done</Button>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'green' | 'red' | 'amber' | 'zinc';
}) {
  const colors = {
    green: 'text-green-500',
    red: 'text-red-500',
    amber: 'text-amber-500',
    zinc: 'text-zinc-500',
  };

  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3">
        <Icon className={`h-8 w-8 ${colors[color]}`} />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorRow({ error }: { error: ImportValidationError }) {
  return (
    <div className={`text-sm p-2 rounded ${error.severity === 'error' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
      <div className="flex items-center gap-2">
        {error.severity === 'error' ? (
          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        )}
        <span className="font-medium">Row {error.row}: {error.field}</span>
      </div>
      <p className="text-zinc-600 dark:text-zinc-400 ml-6">{error.message}</p>
    </div>
  );
}

function DuplicateRow({ duplicate, expanded, onToggle }: {
  duplicate: DuplicateMatch;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border rounded-md overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="text-sm font-medium">
            {duplicate.importedContact.firstName} {duplicate.importedContact.lastName}
          </span>
          <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
            {duplicate.confidence}% match
          </span>
        </div>
        <span className="text-xs text-zinc-500">{duplicate.matchType.replace(/_/g, ' ')}</span>
      </div>
      {expanded && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 text-sm border-t">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-zinc-500 mb-1">Imported</p>
              <p>{duplicate.importedContact.email}</p>
              {duplicate.importedContact.company && <p className="text-zinc-500">{duplicate.importedContact.company}</p>}
            </div>
            <div>
              <p className="font-medium text-zinc-500 mb-1">Existing</p>
              <p>{duplicate.existingContact.email}</p>
              {duplicate.existingContact.company && <p className="text-zinc-500">{duplicate.existingContact.company}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export Sheet
// ============================================================================

interface ExportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
}

function ExportSheet({ open, onOpenChange, contacts }: ExportSheetProps) {
  const [fileType, setFileType] = useState<ExportFileType>('csv');
  const [includeFields, setIncludeFields] = useState<Set<keyof Contact>>(
    new Set(['firstName', 'lastName', 'email', 'phone', 'company', 'notes'])
  );
  const [dateFormat, setDateFormat] = useState<'iso' | 'locale' | 'unix'>('iso');
  const [isExporting, setIsExporting] = useState(false);

  const allFields: (keyof Contact)[] = ['id', 'firstName', 'lastName', 'email', 'phone', 'company', 'notes', 'createdAt', 'updatedAt'];

  const toggleField = (field: keyof Contact) => {
    setIncludeFields(prev => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const handleExport = () => {
    setIsExporting(true);

    const options: ExportOptions = {
      fileType,
      includeFields: Array.from(includeFields),
      dateFormat,
      includeHeader: true,
    };

    const exporter = new DataExporter();
    const content = exporter.export(contacts, options);
    const filename = exporter.getFilename(fileType);
    const mimeType = getMimeType(fileType);

    downloadFile(content, filename, mimeType);

    setIsExporting(false);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Contacts
          </SheetTitle>
          <SheetDescription>
            Export {contacts.length} contacts to a file
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Format Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(['csv', 'json', 'vcard'] as ExportFileType[]).map(type => (
                  <Button
                    key={type}
                    variant={fileType === type ? 'default' : 'outline'}
                    onClick={() => setFileType(type)}
                    className="flex-1"
                  >
                    {type.toUpperCase()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Include Fields</CardTitle>
              <CardDescription>Select which fields to export</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {allFields.map(field => (
                  <label key={field} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeFields.has(field)}
                      onChange={() => toggleField(field)}
                      className="rounded"
                    />
                    <span className="text-sm">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Date Format (for CSV/JSON) */}
          {fileType !== 'vcard' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Date Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {([
                    { value: 'iso', label: 'ISO 8601' },
                    { value: 'locale', label: 'Locale' },
                    { value: 'unix', label: 'Unix' },
                  ] as const).map(option => (
                    <Button
                      key={option.value}
                      variant={dateFormat === option.value ? 'default' : 'outline'}
                      onClick={() => setDateFormat(option.value)}
                      size="sm"
                      className="flex-1"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Button */}
          <Button onClick={handleExport} disabled={isExporting || includeFields.size === 0} className="w-full gap-2">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export {contacts.length} Contacts
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
