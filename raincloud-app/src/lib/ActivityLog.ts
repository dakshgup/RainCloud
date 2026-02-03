import { Contact } from './ContactManager';

export type ActivityType =
  | 'contact_created'
  | 'contact_updated'
  | 'contact_deleted'
  | 'contact_viewed'
  | 'note_added'
  | 'email_sent'
  | 'call_logged'
  | 'meeting_scheduled'
  | 'tag_added'
  | 'tag_removed'
  | 'bulk_import'
  | 'bulk_export';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  timestamp: Date;
  contactId?: string;
  contactName?: string;
  description: string;
  metadata?: Record<string, unknown>;
  changes?: FieldChange[];
}

export interface FieldChange {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface ActivityFilter {
  types?: ActivityType[];
  contactId?: string;
  startDate?: Date;
  endDate?: Date;
  searchQuery?: string;
}

export interface ActivityStats {
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByDay: { date: string; count: number }[];
  mostActiveContacts: { contactId: string; contactName: string; count: number }[];
}

// Activity type metadata
export const ACTIVITY_TYPE_INFO: Record<ActivityType, { label: string; icon: string; color: string }> = {
  contact_created: { label: 'Contact Created', icon: 'UserPlus', color: 'green' },
  contact_updated: { label: 'Contact Updated', icon: 'Edit', color: 'blue' },
  contact_deleted: { label: 'Contact Deleted', icon: 'Trash2', color: 'red' },
  contact_viewed: { label: 'Contact Viewed', icon: 'Eye', color: 'gray' },
  note_added: { label: 'Note Added', icon: 'FileText', color: 'purple' },
  email_sent: { label: 'Email Sent', icon: 'Mail', color: 'blue' },
  call_logged: { label: 'Call Logged', icon: 'Phone', color: 'green' },
  meeting_scheduled: { label: 'Meeting Scheduled', icon: 'Calendar', color: 'orange' },
  tag_added: { label: 'Tag Added', icon: 'Tag', color: 'purple' },
  tag_removed: { label: 'Tag Removed', icon: 'TagX', color: 'gray' },
  bulk_import: { label: 'Bulk Import', icon: 'Upload', color: 'blue' },
  bulk_export: { label: 'Bulk Export', icon: 'Download', color: 'blue' },
};

export class ActivityLog {
  private activities: ActivityEntry[] = [];
  private maxEntries: number = 1000;

  constructor() {
    // Initialize with some sample activities
    this.seedSampleActivities();
  }

  private seedSampleActivities(): void {
    const now = new Date();
    const sampleActivities: Omit<ActivityEntry, 'id'>[] = [
      {
        type: 'contact_created',
        timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 mins ago
        contactId: '1',
        contactName: 'Alex Chen',
        description: 'Created new contact Alex Chen',
      },
      {
        type: 'contact_updated',
        timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 mins ago
        contactId: '2',
        contactName: 'Sarah Johnson',
        description: 'Updated contact Sarah Johnson',
        changes: [
          { field: 'phone', oldValue: null, newValue: '+1-555-0456' },
          { field: 'notes', oldValue: 'CTO', newValue: 'CTO, looking for scalable infrastructure' },
        ],
      },
      {
        type: 'email_sent',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 mins ago
        contactId: '3',
        contactName: 'Marcus Rodriguez',
        description: 'Sent follow-up email to Marcus Rodriguez',
        metadata: { subject: 'Partnership Opportunity' },
      },
      {
        type: 'note_added',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        contactId: '4',
        contactName: 'Emily Park',
        description: 'Added note to Emily Park',
        metadata: { preview: 'Interested in collaboration tools for design team' },
      },
      {
        type: 'call_logged',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        contactId: '5',
        contactName: 'David Kumar',
        description: 'Logged call with David Kumar',
        metadata: { duration: '15 min', outcome: 'Scheduled demo' },
      },
      {
        type: 'meeting_scheduled',
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
        contactId: '6',
        contactName: 'Jennifer Martinez',
        description: 'Scheduled meeting with Jennifer Martinez',
        metadata: { date: 'Tomorrow at 2 PM', type: 'Product Demo' },
      },
      {
        type: 'tag_added',
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
        contactId: '7',
        contactName: 'Michael Thompson',
        description: 'Added tag "VIP" to Michael Thompson',
        metadata: { tag: 'VIP' },
      },
      {
        type: 'contact_created',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        contactId: '8',
        contactName: 'Lisa Wang',
        description: 'Created new contact Lisa Wang',
      },
      {
        type: 'contact_updated',
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
        contactId: '9',
        contactName: 'Robert Davis',
        description: 'Updated contact Robert Davis',
        changes: [
          { field: 'company', oldValue: 'StartupXYZ', newValue: 'Startup123' },
        ],
      },
      {
        type: 'bulk_import',
        timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000), // 3 days ago
        description: 'Imported 5 contacts from CSV',
        metadata: { count: 5, source: 'contacts.csv' },
      },
    ];

    sampleActivities.forEach(activity => {
      this.activities.push({
        ...activity,
        id: crypto.randomUUID(),
      });
    });
  }

  /**
   * Log a new activity
   */
  log(entry: Omit<ActivityEntry, 'id' | 'timestamp'>): ActivityEntry {
    const activity: ActivityEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.activities.unshift(activity);

    // Trim old entries if exceeding max
    if (this.activities.length > this.maxEntries) {
      this.activities = this.activities.slice(0, this.maxEntries);
    }

    return activity;
  }

  /**
   * Log contact creation
   */
  logContactCreated(contact: Contact): ActivityEntry {
    return this.log({
      type: 'contact_created',
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      description: `Created new contact ${contact.firstName} ${contact.lastName}`,
    });
  }

  /**
   * Log contact update with field changes
   */
  logContactUpdated(contact: Contact, changes: FieldChange[]): ActivityEntry {
    const changedFields = changes.map(c => c.field).join(', ');
    return this.log({
      type: 'contact_updated',
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      description: `Updated ${changedFields} for ${contact.firstName} ${contact.lastName}`,
      changes,
    });
  }

  /**
   * Log contact deletion
   */
  logContactDeleted(contact: Contact): ActivityEntry {
    return this.log({
      type: 'contact_deleted',
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      description: `Deleted contact ${contact.firstName} ${contact.lastName}`,
    });
  }

  /**
   * Log tag added to contact
   */
  logTagAdded(contact: Contact, tagName: string): ActivityEntry {
    return this.log({
      type: 'tag_added',
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      description: `Added tag "${tagName}" to ${contact.firstName} ${contact.lastName}`,
      metadata: { tag: tagName },
    });
  }

  /**
   * Log tag removed from contact
   */
  logTagRemoved(contact: Contact, tagName: string): ActivityEntry {
    return this.log({
      type: 'tag_removed',
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      description: `Removed tag "${tagName}" from ${contact.firstName} ${contact.lastName}`,
      metadata: { tag: tagName },
    });
  }

  /**
   * Log email sent
   */
  logEmailSent(contact: Contact, subject: string): ActivityEntry {
    return this.log({
      type: 'email_sent',
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      description: `Sent email to ${contact.firstName} ${contact.lastName}`,
      metadata: { subject },
    });
  }

  /**
   * Log call
   */
  logCall(contact: Contact, duration: string, outcome: string): ActivityEntry {
    return this.log({
      type: 'call_logged',
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      description: `Logged call with ${contact.firstName} ${contact.lastName}`,
      metadata: { duration, outcome },
    });
  }

  /**
   * Get all activities
   */
  getAll(): ActivityEntry[] {
    return [...this.activities];
  }

  /**
   * Get activities with filtering
   */
  getFiltered(filter: ActivityFilter): ActivityEntry[] {
    let result = [...this.activities];

    if (filter.types && filter.types.length > 0) {
      result = result.filter(a => filter.types!.includes(a.type));
    }

    if (filter.contactId) {
      result = result.filter(a => a.contactId === filter.contactId);
    }

    if (filter.startDate) {
      result = result.filter(a => a.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      result = result.filter(a => a.timestamp <= filter.endDate!);
    }

    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      result = result.filter(a =>
        a.description.toLowerCase().includes(query) ||
        a.contactName?.toLowerCase().includes(query)
      );
    }

    return result;
  }

  /**
   * Get recent activities (last N entries)
   */
  getRecent(count: number = 10): ActivityEntry[] {
    return this.activities.slice(0, count);
  }

  /**
   * Get activities for a specific contact
   */
  getForContact(contactId: string): ActivityEntry[] {
    return this.activities.filter(a => a.contactId === contactId);
  }

  /**
   * Get activity statistics
   */
  getStats(days: number = 30): ActivityStats {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentActivities = this.activities.filter(a => a.timestamp >= cutoffDate);

    // Count by type
    const activitiesByType = {} as Record<ActivityType, number>;
    const allTypes: ActivityType[] = Object.keys(ACTIVITY_TYPE_INFO) as ActivityType[];
    allTypes.forEach(type => {
      activitiesByType[type] = recentActivities.filter(a => a.type === type).length;
    });

    // Count by day
    const dayMap = new Map<string, number>();
    recentActivities.forEach(a => {
      const day = a.timestamp.toISOString().split('T')[0];
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });
    const activitiesByDay = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Most active contacts
    const contactMap = new Map<string, { name: string; count: number }>();
    recentActivities.forEach(a => {
      if (a.contactId && a.contactName) {
        const existing = contactMap.get(a.contactId);
        if (existing) {
          existing.count++;
        } else {
          contactMap.set(a.contactId, { name: a.contactName, count: 1 });
        }
      }
    });
    const mostActiveContacts = Array.from(contactMap.entries())
      .map(([contactId, { name, count }]) => ({ contactId, contactName: name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalActivities: recentActivities.length,
      activitiesByType,
      activitiesByDay,
      mostActiveContacts,
    };
  }

  /**
   * Get grouped activities by date
   */
  getGroupedByDate(): Map<string, ActivityEntry[]> {
    const groups = new Map<string, ActivityEntry[]>();

    this.activities.forEach(activity => {
      const date = this.getRelativeDateLabel(activity.timestamp);
      const existing = groups.get(date) || [];
      existing.push(activity);
      groups.set(date, existing);
    });

    return groups;
  }

  /**
   * Get relative date label (Today, Yesterday, This Week, etc.)
   */
  private getRelativeDateLabel(date: Date): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (activityDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (activityDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if (activityDate >= weekAgo) {
      return 'This Week';
    } else if (activityDate >= monthAgo) {
      return 'This Month';
    } else {
      return 'Older';
    }
  }

  /**
   * Clear all activities
   */
  clear(): void {
    this.activities = [];
  }

  /**
   * Export activities as JSON
   */
  export(): string {
    return JSON.stringify(this.activities, null, 2);
  }
}
