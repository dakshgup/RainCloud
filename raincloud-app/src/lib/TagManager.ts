import { Contact } from './ContactManager';

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
  createdAt: Date;
}

export type TagColor =
  | 'gray'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink';

export const TAG_COLORS: Record<TagColor, { bg: string; text: string; border: string }> = {
  gray: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-300', border: 'border-zinc-300 dark:border-zinc-600' },
  red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
};

export interface ContactTag {
  contactId: string;
  tagId: string;
}

export interface SuggestedTag {
  name: string;
  confidence: number;
  reason: string;
}

// Keywords that suggest specific tags
const TAG_KEYWORDS: Record<string, string[]> = {
  'Lead': ['lead', 'prospect', 'potential', 'interested'],
  'Client': ['client', 'customer', 'active', 'paying'],
  'VIP': ['vip', 'important', 'priority', 'key account', 'enterprise'],
  'Technical': ['developer', 'engineer', 'technical', 'devops', 'cto', 'head of engineering'],
  'Executive': ['ceo', 'cto', 'cfo', 'vp', 'director', 'founder', 'president', 'chief'],
  'Startup': ['startup', 'early-stage', 'growth', 'founder', 'series'],
  'Enterprise': ['enterprise', 'corporate', 'large', 'fortune'],
  'AI/ML': ['ai', 'ml', 'machine learning', 'artificial intelligence', 'data science'],
  'Cloud': ['cloud', 'aws', 'azure', 'gcp', 'infrastructure', 'saas'],
  'Fintech': ['fintech', 'finance', 'banking', 'payment', 'financial'],
  'Mobile': ['mobile', 'ios', 'android', 'app'],
  'Blockchain': ['blockchain', 'crypto', 'web3', 'decentralized'],
  'Consultant': ['consultant', 'freelance', 'contractor', 'agency'],
  'Follow Up': ['follow up', 'callback', 'reach out', 'schedule'],
  'Hot Lead': ['urgent', 'asap', 'hot', 'ready to buy', 'closing'],
};

// Role-based keyword patterns
const ROLE_PATTERNS: Record<string, RegExp> = {
  'C-Suite': /\b(ceo|cto|cfo|coo|cio|cmo)\b/i,
  'VP': /\b(vp|vice president)\b/i,
  'Director': /\bdirector\b/i,
  'Manager': /\bmanager\b/i,
  'Developer': /\b(developer|engineer|programmer)\b/i,
  'Designer': /\b(designer|creative|ux|ui)\b/i,
};

export class TagManager {
  private tags: Tag[] = [
    { id: '1', name: 'Lead', color: 'blue', createdAt: new Date() },
    { id: '2', name: 'Client', color: 'green', createdAt: new Date() },
    { id: '3', name: 'VIP', color: 'purple', createdAt: new Date() },
    { id: '4', name: 'Technical', color: 'orange', createdAt: new Date() },
    { id: '5', name: 'Follow Up', color: 'yellow', createdAt: new Date() },
  ];

  private contactTags: ContactTag[] = [];

  // Tag CRUD operations
  createTag(name: string, color: TagColor = 'gray'): Tag {
    const tag: Tag = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
      createdAt: new Date(),
    };
    this.tags.push(tag);
    return tag;
  }

  updateTag(id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>): Tag | null {
    const tagIndex = this.tags.findIndex(t => t.id === id);
    if (tagIndex === -1) return null;

    this.tags[tagIndex] = {
      ...this.tags[tagIndex],
      ...updates,
    };
    return this.tags[tagIndex];
  }

  deleteTag(id: string): boolean {
    const tagIndex = this.tags.findIndex(t => t.id === id);
    if (tagIndex === -1) return false;

    this.tags.splice(tagIndex, 1);
    // Remove all associations with this tag
    this.contactTags = this.contactTags.filter(ct => ct.tagId !== id);
    return true;
  }

  getTag(id: string): Tag | null {
    return this.tags.find(t => t.id === id) || null;
  }

  getAllTags(): Tag[] {
    return [...this.tags];
  }

  getTagByName(name: string): Tag | null {
    return this.tags.find(t => t.name.toLowerCase() === name.toLowerCase()) || null;
  }

  // Contact-Tag associations
  addTagToContact(contactId: string, tagId: string): boolean {
    // Check if association already exists
    const exists = this.contactTags.some(
      ct => ct.contactId === contactId && ct.tagId === tagId
    );
    if (exists) return false;

    this.contactTags.push({ contactId, tagId });
    return true;
  }

  removeTagFromContact(contactId: string, tagId: string): boolean {
    const index = this.contactTags.findIndex(
      ct => ct.contactId === contactId && ct.tagId === tagId
    );
    if (index === -1) return false;

    this.contactTags.splice(index, 1);
    return true;
  }

  getTagsForContact(contactId: string): Tag[] {
    const tagIds = this.contactTags
      .filter(ct => ct.contactId === contactId)
      .map(ct => ct.tagId);
    return this.tags.filter(t => tagIds.includes(t.id));
  }

  getContactsForTag(tagId: string): string[] {
    return this.contactTags
      .filter(ct => ct.tagId === tagId)
      .map(ct => ct.contactId);
  }

  // Smart tag suggestions
  suggestTags(contact: Contact): SuggestedTag[] {
    const suggestions: SuggestedTag[] = [];
    const searchText = [
      contact.notes || '',
      contact.company || '',
      contact.firstName,
      contact.lastName,
    ].join(' ').toLowerCase();

    // Check keyword matches
    for (const [tagName, keywords] of Object.entries(TAG_KEYWORDS)) {
      const matchedKeywords = keywords.filter(kw => searchText.includes(kw));
      if (matchedKeywords.length > 0) {
        const confidence = Math.min(matchedKeywords.length * 30 + 20, 95);
        suggestions.push({
          name: tagName,
          confidence,
          reason: `Contains: ${matchedKeywords.slice(0, 3).join(', ')}`,
        });
      }
    }

    // Check role patterns
    for (const [roleName, pattern] of Object.entries(ROLE_PATTERNS)) {
      if (pattern.test(searchText)) {
        suggestions.push({
          name: roleName,
          confidence: 85,
          reason: `Role detected in notes/title`,
        });
      }
    }

    // Check email domain for suggestions
    const emailDomain = contact.email.split('@')[1]?.toLowerCase() || '';
    if (emailDomain.includes('startup') || emailDomain.endsWith('.io')) {
      suggestions.push({
        name: 'Startup',
        confidence: 60,
        reason: 'Email domain suggests startup',
      });
    }
    if (emailDomain.includes('enterprise') || emailDomain.includes('corp')) {
      suggestions.push({
        name: 'Enterprise',
        confidence: 65,
        reason: 'Email domain suggests enterprise',
      });
    }

    // Suggest "Incomplete" if missing fields
    if (!contact.phone || !contact.company || !contact.notes?.trim()) {
      suggestions.push({
        name: 'Needs Update',
        confidence: 90,
        reason: 'Missing profile information',
      });
    }

    // Sort by confidence and deduplicate
    const seen = new Set<string>();
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .filter(s => {
        if (seen.has(s.name)) return false;
        seen.add(s.name);
        return true;
      })
      .slice(0, 5);
  }

  // Bulk operations
  suggestTagsForAllContacts(contacts: Contact[]): Map<string, SuggestedTag[]> {
    const result = new Map<string, SuggestedTag[]>();
    contacts.forEach(contact => {
      result.set(contact.id, this.suggestTags(contact));
    });
    return result;
  }

  // Get or create tag by name
  getOrCreateTag(name: string, color: TagColor = 'gray'): Tag {
    const existing = this.getTagByName(name);
    if (existing) return existing;
    return this.createTag(name, color);
  }

  // Apply suggested tag to contact
  applySuggestedTag(contactId: string, suggestion: SuggestedTag): Tag {
    // Determine color based on tag name
    const colorMap: Record<string, TagColor> = {
      'Lead': 'blue',
      'Client': 'green',
      'VIP': 'purple',
      'Technical': 'orange',
      'Executive': 'purple',
      'C-Suite': 'purple',
      'Startup': 'green',
      'Enterprise': 'blue',
      'AI/ML': 'orange',
      'Cloud': 'blue',
      'Fintech': 'green',
      'Mobile': 'pink',
      'Blockchain': 'orange',
      'Consultant': 'gray',
      'Follow Up': 'yellow',
      'Hot Lead': 'red',
      'Needs Update': 'yellow',
      'VP': 'purple',
      'Director': 'purple',
      'Manager': 'blue',
      'Developer': 'orange',
      'Designer': 'pink',
    };

    const color = colorMap[suggestion.name] || 'gray';
    const tag = this.getOrCreateTag(suggestion.name, color);
    this.addTagToContact(contactId, tag.id);
    return tag;
  }

  // Search tags
  searchTags(query: string): Tag[] {
    const lowerQuery = query.toLowerCase();
    return this.tags.filter(t => t.name.toLowerCase().includes(lowerQuery));
  }

  // Get tag usage statistics
  getTagStats(): { tag: Tag; count: number }[] {
    return this.tags.map(tag => ({
      tag,
      count: this.contactTags.filter(ct => ct.tagId === tag.id).length,
    })).sort((a, b) => b.count - a.count);
  }
}
