import { Contact, ContactFormData } from './ContactManager';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type ImportFileType = 'csv' | 'json' | 'vcard';
export type ExportFileType = 'csv' | 'json' | 'vcard';

export interface FieldMapping {
  sourceField: string;
  targetField: keyof ContactFormData;
  transform?: (value: string) => string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface DuplicateMatch {
  importedContact: ParsedContact;
  existingContact: Contact;
  matchType: 'exact_email' | 'similar_name' | 'same_company_name';
  confidence: number; // 0-100
}

export type ConflictResolution = 'skip' | 'overwrite' | 'merge' | 'create_new';

export interface ImportOptions {
  fileType: ImportFileType;
  fieldMapping: FieldMapping[];
  skipFirstRow: boolean;
  duplicateHandling: ConflictResolution;
  validateEmails: boolean;
  validatePhones: boolean;
  trimWhitespace: boolean;
  skipEmptyRows: boolean;
}

export interface ExportOptions {
  fileType: ExportFileType;
  includeFields: (keyof Contact)[];
  dateFormat: 'iso' | 'locale' | 'unix';
  includeHeader: boolean;
}

export interface ParsedContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  rawData: Record<string, string>;
  rowNumber: number;
}

export interface ImportedContact extends ContactFormData {
  existingId?: string; // Set when overwriting/merging an existing contact
  resolution?: ConflictResolution; // How this contact should be handled
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  duplicateCount: number;
  contacts: ImportedContact[];
  errors: ImportValidationError[];
  duplicates: DuplicateMatch[];
  warnings: string[];
}

export interface ImportProgress {
  phase: 'parsing' | 'validating' | 'detecting_duplicates' | 'importing' | 'complete';
  current: number;
  total: number;
  message: string;
}

// ============================================================================
// Default Field Mappings
// ============================================================================

export const DEFAULT_CSV_MAPPINGS: FieldMapping[] = [
  { sourceField: 'first_name', targetField: 'firstName' },
  { sourceField: 'firstname', targetField: 'firstName' },
  { sourceField: 'first name', targetField: 'firstName' },
  { sourceField: 'given_name', targetField: 'firstName' },
  { sourceField: 'last_name', targetField: 'lastName' },
  { sourceField: 'lastname', targetField: 'lastName' },
  { sourceField: 'last name', targetField: 'lastName' },
  { sourceField: 'family_name', targetField: 'lastName' },
  { sourceField: 'surname', targetField: 'lastName' },
  { sourceField: 'email', targetField: 'email' },
  { sourceField: 'email_address', targetField: 'email' },
  { sourceField: 'e-mail', targetField: 'email' },
  { sourceField: 'phone', targetField: 'phone' },
  { sourceField: 'phone_number', targetField: 'phone' },
  { sourceField: 'telephone', targetField: 'phone' },
  { sourceField: 'mobile', targetField: 'phone' },
  { sourceField: 'cell', targetField: 'phone' },
  { sourceField: 'company', targetField: 'company' },
  { sourceField: 'organization', targetField: 'company' },
  { sourceField: 'org', targetField: 'company' },
  { sourceField: 'employer', targetField: 'company' },
  { sourceField: 'notes', targetField: 'notes' },
  { sourceField: 'note', targetField: 'notes' },
  { sourceField: 'comments', targetField: 'notes' },
  { sourceField: 'description', targetField: 'notes' },
];

// ============================================================================
// Validation Utilities
// ============================================================================

export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)\.]+$/,
  name: /^[a-zA-Z\s\-'\.]+$/,
};

export function validateEmail(email: string): boolean {
  return ValidationPatterns.email.test(email);
}

export function validatePhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  return ValidationPatterns.phone.test(phone);
}

export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except + at the start
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    // Format as US number
    return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return hasPlus ? `+${digits}` : digits;
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

// ============================================================================
// CSV Parser
// ============================================================================

export class CSVParser {
  private delimiter: string;
  private quoteChar: string;

  constructor(delimiter: string = ',', quoteChar: string = '"') {
    this.delimiter = delimiter;
    this.quoteChar = quoteChar;
  }

  /**
   * Parse CSV string into array of objects
   */
  parse(csvString: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines = this.splitLines(csvString);
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = this.parseLine(lines[0]).map(h => h.toLowerCase().trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseLine(lines[i]);
      if (values.every(v => v === '')) continue; // Skip empty rows

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return { headers, rows };
  }

  /**
   * Split CSV string into lines, handling quoted newlines
   */
  private splitLines(csvString: string): string[] {
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < csvString.length; i++) {
      const char = csvString[i];
      const nextChar = csvString[i + 1];

      if (char === this.quoteChar) {
        if (inQuotes && nextChar === this.quoteChar) {
          // Escaped quote - add single quote and skip the next one
          currentLine += char;
          i++; // Skip next quote
        } else {
          // Opening or closing quote
          inQuotes = !inQuotes;
          currentLine += char;
        }
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        if (currentLine.trim()) {
          lines.push(currentLine);
        }
        currentLine = '';
        if (char === '\r') i++; // Skip \n in \r\n
      } else if (char !== '\r') {
        currentLine += char;
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Parse a single CSV line into array of values
   */
  private parseLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === this.quoteChar) {
        if (!inQuotes) {
          inQuotes = true;
        } else if (nextChar === this.quoteChar) {
          currentValue += char;
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === this.delimiter && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    values.push(currentValue.trim());
    return values;
  }

  /**
   * Detect the delimiter used in a CSV string
   */
  static detectDelimiter(csvString: string): string {
    const firstLine = csvString.split('\n')[0];
    const delimiters = [',', ';', '\t', '|'];

    let bestDelimiter = ',';
    let maxCount = 0;

    for (const delimiter of delimiters) {
      const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  }
}

// ============================================================================
// JSON Parser
// ============================================================================

export class JSONParser {
  /**
   * Parse JSON string into array of contact objects
   */
  parse(jsonString: string): { contacts: Record<string, unknown>[]; errors: string[] } {
    const errors: string[] = [];

    try {
      const parsed = JSON.parse(jsonString);

      // Handle array of contacts
      if (Array.isArray(parsed)) {
        return { contacts: parsed, errors };
      }

      // Handle object with contacts array
      if (parsed.contacts && Array.isArray(parsed.contacts)) {
        return { contacts: parsed.contacts, errors };
      }

      // Handle object with data array
      if (parsed.data && Array.isArray(parsed.data)) {
        return { contacts: parsed.data, errors };
      }

      // Single contact object
      if (typeof parsed === 'object' && parsed !== null) {
        return { contacts: [parsed], errors };
      }

      errors.push('Invalid JSON structure: expected array or object with contacts');
      return { contacts: [], errors };
    } catch (e) {
      errors.push(`JSON parse error: ${e instanceof Error ? e.message : 'Unknown error'}`);
      return { contacts: [], errors };
    }
  }
}

// ============================================================================
// vCard Parser
// ============================================================================

export class VCardParser {
  /**
   * Parse vCard string into array of contact objects
   */
  parse(vcardString: string): { contacts: Record<string, string>[]; errors: string[] } {
    const contacts: Record<string, string>[] = [];
    const errors: string[] = [];

    // Split into individual vCards
    const vcards = vcardString.split('BEGIN:VCARD').filter(v => v.trim());

    for (let i = 0; i < vcards.length; i++) {
      try {
        const contact = this.parseVCard(vcards[i]);
        if (contact) {
          contacts.push(contact);
        }
      } catch (e) {
        errors.push(`Error parsing vCard ${i + 1}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    return { contacts, errors };
  }

  private parseVCard(vcardContent: string): Record<string, string> | null {
    // Handle vCard line folding (RFC 2425) - lines starting with space/tab are continuations
    const rawLines = vcardContent.split('\n');
    const unfoldedLines: string[] = [];

    for (const line of rawLines) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        // Continuation line - append to previous line (without the leading whitespace)
        if (unfoldedLines.length > 0) {
          unfoldedLines[unfoldedLines.length - 1] += line.slice(1);
        }
      } else {
        const trimmed = line.trim();
        if (trimmed) {
          unfoldedLines.push(trimmed);
        }
      }
    }

    const contact: Record<string, string> = {};

    for (const line of unfoldedLines) {
      if (line.startsWith('END:VCARD')) continue;
      if (line.startsWith('VERSION:')) continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      let key = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);

      // Handle parameters like TEL;TYPE=CELL
      const semicolonIndex = key.indexOf(';');
      if (semicolonIndex !== -1) {
        key = key.substring(0, semicolonIndex);
      }

      switch (key.toUpperCase()) {
        case 'N':
          // N:Last;First;Middle;Prefix;Suffix
          const nameParts = value.split(';');
          contact.lastName = nameParts[0] || '';
          contact.firstName = nameParts[1] || '';
          break;
        case 'FN':
          // Full name - use as fallback
          if (!contact.firstName && !contact.lastName) {
            const names = value.split(' ');
            contact.firstName = names[0] || '';
            contact.lastName = names.slice(1).join(' ') || '';
          }
          break;
        case 'EMAIL':
          contact.email = value;
          break;
        case 'TEL':
          contact.phone = value;
          break;
        case 'ORG':
          contact.company = value.split(';')[0];
          break;
        case 'NOTE':
          contact.notes = value;
          break;
      }
    }

    // Must have at least a name and email
    if ((contact.firstName || contact.lastName) && contact.email) {
      return contact;
    }

    return null;
  }
}

// ============================================================================
// Duplicate Detection
// ============================================================================

export class DuplicateDetector {
  private existingContacts: Contact[];

  constructor(existingContacts: Contact[]) {
    this.existingContacts = existingContacts;
  }

  /**
   * Find potential duplicates for a parsed contact
   */
  findDuplicates(parsedContact: ParsedContact): DuplicateMatch[] {
    const matches: DuplicateMatch[] = [];

    for (const existing of this.existingContacts) {
      // Check exact email match (highest confidence)
      if (this.emailsMatch(parsedContact.email, existing.email)) {
        matches.push({
          importedContact: parsedContact,
          existingContact: existing,
          matchType: 'exact_email',
          confidence: 100,
        });
        continue;
      }

      // Check similar name
      const nameConfidence = this.calculateNameSimilarity(
        parsedContact.firstName,
        parsedContact.lastName,
        existing.firstName,
        existing.lastName
      );

      if (nameConfidence >= 80) {
        matches.push({
          importedContact: parsedContact,
          existingContact: existing,
          matchType: 'similar_name',
          confidence: nameConfidence,
        });
        continue;
      }

      // Check same company + similar name
      if (parsedContact.company && existing.company) {
        const companyMatch = this.companiesMatch(parsedContact.company, existing.company);
        if (companyMatch && nameConfidence >= 60) {
          matches.push({
            importedContact: parsedContact,
            existingContact: existing,
            matchType: 'same_company_name',
            confidence: Math.min(90, nameConfidence + 20),
          });
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  private emailsMatch(email1: string, email2: string): boolean {
    return normalizeEmail(email1) === normalizeEmail(email2);
  }

  private companiesMatch(company1: string, company2: string): boolean {
    const normalize = (s: string) => s.toLowerCase()
      .replace(/\s*(inc|llc|ltd|corp|co|company)\.?\s*/gi, '')
      .replace(/[^a-z0-9]/g, '');
    return normalize(company1) === normalize(company2);
  }

  private calculateNameSimilarity(
    firstName1: string,
    lastName1: string,
    firstName2: string,
    lastName2: string
  ): number {
    const firstNameSim = this.levenshteinSimilarity(
      firstName1.toLowerCase(),
      firstName2.toLowerCase()
    );
    const lastNameSim = this.levenshteinSimilarity(
      lastName1.toLowerCase(),
      lastName2.toLowerCase()
    );

    // Weight last name more heavily
    return Math.round(firstNameSim * 0.4 + lastNameSim * 0.6);
  }

  private levenshteinSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 100;
    if (!s1 || !s2) return 0;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    const distance = this.levenshteinDistance(longer, shorter);
    return Math.round((1 - distance / longer.length) * 100);
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[s1.length][s2.length];
  }
}

// ============================================================================
// Field Mapper
// ============================================================================

export class FieldMapper {
  private mappings: FieldMapping[];

  constructor(mappings: FieldMapping[] = DEFAULT_CSV_MAPPINGS) {
    this.mappings = mappings;
  }

  /**
   * Auto-detect field mappings from headers
   */
  autoDetectMappings(headers: string[]): FieldMapping[] {
    const detected: FieldMapping[] = [];
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

    for (const mapping of this.mappings) {
      const index = normalizedHeaders.indexOf(mapping.sourceField);
      if (index !== -1) {
        detected.push({
          sourceField: headers[index],
          targetField: mapping.targetField,
          transform: mapping.transform,
        });
      }
    }

    return detected;
  }

  /**
   * Map a raw data row to a ContactFormData object
   */
  mapRow(row: Record<string, string>, mappings: FieldMapping[]): Partial<ContactFormData> {
    const contact: Partial<ContactFormData> = {};

    for (const mapping of mappings) {
      const sourceValue = row[mapping.sourceField.toLowerCase()] || row[mapping.sourceField];
      if (sourceValue) {
        const value = mapping.transform ? mapping.transform(sourceValue) : sourceValue;
        (contact as Record<string, string>)[mapping.targetField] = value;
      }
    }

    return contact;
  }

  /**
   * Get suggested target field for an unknown source field
   */
  suggestMapping(sourceField: string): keyof ContactFormData | null {
    const lower = sourceField.toLowerCase();

    if (lower.includes('first') || lower.includes('given')) return 'firstName';
    if (lower.includes('last') || lower.includes('family') || lower.includes('surname')) return 'lastName';
    if (lower.includes('email') || lower.includes('mail')) return 'email';
    if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile') || lower.includes('cell')) return 'phone';
    if (lower.includes('company') || lower.includes('org') || lower.includes('employer')) return 'company';
    if (lower.includes('note') || lower.includes('comment') || lower.includes('description')) return 'notes';

    return null;
  }
}

// ============================================================================
// Data Importer
// ============================================================================

export class DataImporter {
  private csvParser: CSVParser;
  private jsonParser: JSONParser;
  private vcardParser: VCardParser;
  private fieldMapper: FieldMapper;
  private duplicateDetector: DuplicateDetector | null = null;
  private onProgress?: (progress: ImportProgress) => void;

  constructor(existingContacts: Contact[] = [], onProgress?: (progress: ImportProgress) => void) {
    this.csvParser = new CSVParser();
    this.jsonParser = new JSONParser();
    this.vcardParser = new VCardParser();
    this.fieldMapper = new FieldMapper();
    this.duplicateDetector = new DuplicateDetector(existingContacts);
    this.onProgress = onProgress;
  }

  /**
   * Import contacts from file content
   */
  async import(content: string, options: ImportOptions): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      duplicateCount: 0,
      contacts: [],
      errors: [],
      duplicates: [],
      warnings: [],
    };

    try {
      // Phase 1: Parse
      this.reportProgress('parsing', 0, 100, 'Parsing file...');
      const parsed = await this.parseContent(content, options.fileType);
      result.totalRows = parsed.contacts.length;

      if (parsed.errors.length > 0) {
        result.warnings.push(...parsed.errors);
      }

      // Phase 2: Map and Validate
      this.reportProgress('validating', 0, parsed.contacts.length, 'Validating contacts...');
      const parsedContacts: ParsedContact[] = [];

      for (let i = 0; i < parsed.contacts.length; i++) {
        const row = parsed.contacts[i];
        const mapped = this.fieldMapper.mapRow(
          row as Record<string, string>,
          options.fieldMapping.length > 0 ? options.fieldMapping : parsed.mappings
        );

        // Apply transforms
        if (options.trimWhitespace) {
          Object.keys(mapped).forEach(key => {
            const value = (mapped as Record<string, string | undefined>)[key];
            if (typeof value === 'string') {
              (mapped as Record<string, string>)[key] = value.trim();
            }
          });
        }

        // Validate
        const errors = this.validateContact(mapped, i + 1, options);
        result.errors.push(...errors);

        if (errors.some(e => e.severity === 'error')) {
          result.errorCount++;
          continue;
        }

        parsedContacts.push({
          firstName: mapped.firstName || '',
          lastName: mapped.lastName || '',
          email: mapped.email || '',
          phone: mapped.phone,
          company: mapped.company,
          notes: mapped.notes,
          rawData: row as Record<string, string>,
          rowNumber: i + 1,
        });

        this.reportProgress('validating', i + 1, parsed.contacts.length, `Validated ${i + 1} of ${parsed.contacts.length}`);
      }

      // Phase 3: Detect Duplicates and Handle Resolution
      this.reportProgress('detecting_duplicates', 0, parsedContacts.length, 'Detecting duplicates...');

      for (let i = 0; i < parsedContacts.length; i++) {
        const contact = parsedContacts[i];
        const duplicates = this.duplicateDetector?.findDuplicates(contact) || [];

        if (duplicates.length > 0) {
          result.duplicates.push(...duplicates);
          result.duplicateCount++;

          const bestMatch = duplicates[0]; // Highest confidence match

          // Handle based on resolution strategy
          switch (options.duplicateHandling) {
            case 'skip':
              result.skippedCount++;
              continue;

            case 'overwrite':
              // Replace existing contact with imported data
              result.contacts.push({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                company: contact.company,
                notes: contact.notes,
                existingId: bestMatch.existingContact.id,
                resolution: 'overwrite',
              });
              result.importedCount++;
              break;

            case 'merge':
              // Keep existing data, only fill in empty fields
              result.contacts.push({
                firstName: contact.firstName || bestMatch.existingContact.firstName,
                lastName: contact.lastName || bestMatch.existingContact.lastName,
                email: contact.email || bestMatch.existingContact.email,
                phone: contact.phone || bestMatch.existingContact.phone,
                company: contact.company || bestMatch.existingContact.company,
                notes: contact.notes || bestMatch.existingContact.notes,
                existingId: bestMatch.existingContact.id,
                resolution: 'merge',
              });
              result.importedCount++;
              break;

            case 'create_new':
              // Create new contact regardless of duplicate
              result.contacts.push({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email,
                phone: contact.phone,
                company: contact.company,
                notes: contact.notes,
                resolution: 'create_new',
              });
              result.importedCount++;
              break;
          }
        } else {
          // No duplicate - add as new contact
          result.contacts.push({
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            notes: contact.notes,
            resolution: 'create_new',
          });
          result.importedCount++;
        }

        this.reportProgress('detecting_duplicates', i + 1, parsedContacts.length, `Processed ${i + 1} of ${parsedContacts.length}`);
      }

      this.reportProgress('complete', result.importedCount, result.totalRows, 'Import complete');
      // Success means we imported at least one contact (partial success is still success)
      result.success = result.importedCount > 0;

    } catch (error) {
      result.errors.push({
        row: 0,
        field: '',
        value: '',
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    }

    return result;
  }

  private async parseContent(
    content: string,
    fileType: ImportFileType
  ): Promise<{ contacts: Record<string, unknown>[]; mappings: FieldMapping[]; errors: string[] }> {
    switch (fileType) {
      case 'csv': {
        const delimiter = CSVParser.detectDelimiter(content);
        const parser = new CSVParser(delimiter);
        const { headers, rows } = parser.parse(content);
        const mappings = this.fieldMapper.autoDetectMappings(headers);
        return { contacts: rows, mappings, errors: [] };
      }
      case 'json': {
        const { contacts, errors } = this.jsonParser.parse(content);
        const sampleKeys = contacts[0] ? Object.keys(contacts[0]) : [];
        const mappings = this.fieldMapper.autoDetectMappings(sampleKeys);
        return { contacts: contacts as Record<string, unknown>[], mappings, errors };
      }
      case 'vcard': {
        const { contacts, errors } = this.vcardParser.parse(content);
        return { contacts, mappings: [], errors };
      }
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private validateContact(
    contact: Partial<ContactFormData>,
    row: number,
    options: ImportOptions
  ): ImportValidationError[] {
    const errors: ImportValidationError[] = [];

    // Required fields
    if (!contact.firstName?.trim()) {
      errors.push({
        row,
        field: 'firstName',
        value: contact.firstName || '',
        message: 'First name is required',
        severity: 'error',
      });
    }

    if (!contact.lastName?.trim()) {
      errors.push({
        row,
        field: 'lastName',
        value: contact.lastName || '',
        message: 'Last name is required',
        severity: 'error',
      });
    }

    if (!contact.email?.trim()) {
      errors.push({
        row,
        field: 'email',
        value: contact.email || '',
        message: 'Email is required',
        severity: 'error',
      });
    } else if (options.validateEmails && !validateEmail(contact.email)) {
      errors.push({
        row,
        field: 'email',
        value: contact.email,
        message: 'Invalid email format',
        severity: 'error',
      });
    }

    if (options.validatePhones && contact.phone && !validatePhone(contact.phone)) {
      errors.push({
        row,
        field: 'phone',
        value: contact.phone,
        message: 'Invalid phone number format',
        severity: 'warning',
      });
    }

    return errors;
  }

  private reportProgress(
    phase: ImportProgress['phase'],
    current: number,
    total: number,
    message: string
  ): void {
    if (this.onProgress) {
      this.onProgress({ phase, current, total, message });
    }
  }
}

// ============================================================================
// Data Exporter
// ============================================================================

export class DataExporter {
  /**
   * Export contacts to the specified format
   */
  export(contacts: Contact[], options: ExportOptions): string {
    switch (options.fileType) {
      case 'csv':
        return this.exportCSV(contacts, options);
      case 'json':
        return this.exportJSON(contacts, options);
      case 'vcard':
        return this.exportVCard(contacts);
      default:
        throw new Error(`Unsupported export format: ${options.fileType}`);
    }
  }

  private exportCSV(contacts: Contact[], options: ExportOptions): string {
    const lines: string[] = [];
    const fields = options.includeFields;

    // Header
    if (options.includeHeader) {
      lines.push(fields.join(','));
    }

    // Data rows
    for (const contact of contacts) {
      const values = fields.map(field => {
        let value = contact[field];

        // Format dates
        if (value instanceof Date) {
          value = this.formatDate(value, options.dateFormat);
        }

        // Escape CSV values
        value = String(value ?? '');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      });

      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  private exportJSON(contacts: Contact[], options: ExportOptions): string {
    const exportData = contacts.map(contact => {
      const filtered: Record<string, unknown> = {};

      for (const field of options.includeFields) {
        let value: unknown = contact[field];

        if (value instanceof Date) {
          value = this.formatDate(value, options.dateFormat);
        }

        filtered[field] = value;
      }

      return filtered;
    });

    return JSON.stringify({ contacts: exportData, exportedAt: new Date().toISOString() }, null, 2);
  }

  private exportVCard(contacts: Contact[]): string {
    const vcards: string[] = [];

    for (const contact of contacts) {
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${contact.lastName};${contact.firstName};;;`,
        `FN:${contact.firstName} ${contact.lastName}`,
        `EMAIL:${contact.email}`,
      ];

      if (contact.phone) {
        lines.push(`TEL:${contact.phone}`);
      }
      if (contact.company) {
        lines.push(`ORG:${contact.company}`);
      }
      if (contact.notes) {
        lines.push(`NOTE:${contact.notes.replace(/\n/g, '\\n')}`);
      }

      lines.push('END:VCARD');
      vcards.push(lines.join('\n'));
    }

    return vcards.join('\n\n');
  }

  private formatDate(date: Date, format: ExportOptions['dateFormat']): string {
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'locale':
        return date.toLocaleDateString();
      case 'unix':
        return String(Math.floor(date.getTime() / 1000));
      default:
        return date.toISOString();
    }
  }

  /**
   * Generate a download filename with timestamp
   */
  getFilename(fileType: ExportFileType): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `contacts-export-${timestamp}.${fileType}`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a downloadable file blob and trigger download
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Detect file type from extension
 */
export function detectFileType(filename: string): ImportFileType | null {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'csv':
    case 'tsv':
      return 'csv';
    case 'json':
      return 'json';
    case 'vcf':
    case 'vcard':
      return 'vcard';
    default:
      return null;
  }
}

/**
 * Get MIME type for export format
 */
export function getMimeType(fileType: ExportFileType): string {
  switch (fileType) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'vcard':
      return 'text/vcard';
    default:
      return 'text/plain';
  }
}
