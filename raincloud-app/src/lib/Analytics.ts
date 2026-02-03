import { Contact } from './ContactManager';

export interface ContactGrowthData {
  date: string;
  count: number;
}

export interface CompanyDistribution {
  company: string;
  count: number;
  percentage: number;
}

export interface CompletenessMetrics {
  complete: number;
  missingPhone: number;
  missingCompany: number;
  missingNotes: number;
  totalIncomplete: number;
}

export interface TimeBasedMetrics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  thisQuarter: number;
  thisYear: number;
}

export interface EngagementScore {
  contactId: string;
  name: string;
  score: number;
  factors: {
    hasPhone: boolean;
    hasCompany: boolean;
    hasNotes: boolean;
    notesLength: number;
    recentlyUpdated: boolean;
  };
}

export interface AnalyticsSummary {
  totalContacts: number;
  growthRate: number;
  completenessScore: number;
  avgEngagementScore: number;
  topCompanies: CompanyDistribution[];
  recentActivity: TimeBasedMetrics;
}

export class AnalyticsEngine {
  /**
   * Calculate contact growth over time
   */
  static calculateGrowthData(contacts: Contact[], days: number = 30): ContactGrowthData[] {
    const data: ContactGrowthData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = contacts.filter(c => {
        const createdAt = new Date(c.createdAt);
        return createdAt <= nextDate;
      }).length;

      data.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return data;
  }

  /**
   * Get company distribution statistics
   */
  static getCompanyDistribution(contacts: Contact[]): CompanyDistribution[] {
    const companyMap = new Map<string, number>();

    contacts.forEach(contact => {
      const company = contact.company || 'Unassigned';
      companyMap.set(company, (companyMap.get(company) || 0) + 1);
    });

    const total = contacts.length;
    const distribution = Array.from(companyMap.entries())
      .map(([company, count]) => ({
        company,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return distribution;
  }

  /**
   * Calculate data completeness metrics
   */
  static getCompletenessMetrics(contacts: Contact[]): CompletenessMetrics {
    let missingPhone = 0;
    let missingCompany = 0;
    let missingNotes = 0;

    contacts.forEach(contact => {
      if (!contact.phone) missingPhone++;
      if (!contact.company) missingCompany++;
      if (!contact.notes?.trim()) missingNotes++;
    });

    const complete = contacts.filter(c =>
      c.phone && c.company && c.notes?.trim()
    ).length;

    return {
      complete,
      missingPhone,
      missingCompany,
      missingNotes,
      totalIncomplete: contacts.length - complete,
    };
  }

  /**
   * Get time-based activity metrics
   */
  static getTimeBasedMetrics(contacts: Contact[]): TimeBasedMetrics {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return {
      today: contacts.filter(c => new Date(c.createdAt) >= startOfDay).length,
      thisWeek: contacts.filter(c => new Date(c.createdAt) >= startOfWeek).length,
      thisMonth: contacts.filter(c => new Date(c.createdAt) >= startOfMonth).length,
      thisQuarter: contacts.filter(c => new Date(c.createdAt) >= startOfQuarter).length,
      thisYear: contacts.filter(c => new Date(c.createdAt) >= startOfYear).length,
    };
  }

  /**
   * Calculate engagement score for each contact
   */
  static calculateEngagementScores(contacts: Contact[]): EngagementScore[] {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return contacts.map(contact => {
      const factors = {
        hasPhone: !!contact.phone,
        hasCompany: !!contact.company,
        hasNotes: !!contact.notes?.trim(),
        notesLength: contact.notes?.length || 0,
        recentlyUpdated: new Date(contact.updatedAt) >= thirtyDaysAgo,
      };

      // Calculate score (0-100)
      let score = 0;
      if (factors.hasPhone) score += 20;
      if (factors.hasCompany) score += 20;
      if (factors.hasNotes) score += 20;
      if (factors.notesLength > 50) score += 10;
      if (factors.notesLength > 100) score += 10;
      if (factors.recentlyUpdated) score += 20;

      return {
        contactId: contact.id,
        name: `${contact.firstName} ${contact.lastName}`,
        score,
        factors,
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate growth rate percentage
   */
  static calculateGrowthRate(contacts: Contact[], days: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const previousCutoff = new Date(cutoffDate);
    previousCutoff.setDate(previousCutoff.getDate() - days);

    const currentPeriod = contacts.filter(c =>
      new Date(c.createdAt) >= cutoffDate
    ).length;

    const previousPeriod = contacts.filter(c => {
      const created = new Date(c.createdAt);
      return created >= previousCutoff && created < cutoffDate;
    }).length;

    if (previousPeriod === 0) return currentPeriod > 0 ? 100 : 0;
    return Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100);
  }

  /**
   * Get complete analytics summary
   */
  static getSummary(contacts: Contact[]): AnalyticsSummary {
    const completeness = this.getCompletenessMetrics(contacts);
    const engagementScores = this.calculateEngagementScores(contacts);

    const completenessScore = contacts.length > 0
      ? Math.round((completeness.complete / contacts.length) * 100)
      : 0;

    const avgEngagementScore = engagementScores.length > 0
      ? Math.round(engagementScores.reduce((sum, e) => sum + e.score, 0) / engagementScores.length)
      : 0;

    return {
      totalContacts: contacts.length,
      growthRate: this.calculateGrowthRate(contacts),
      completenessScore,
      avgEngagementScore,
      topCompanies: this.getCompanyDistribution(contacts).slice(0, 5),
      recentActivity: this.getTimeBasedMetrics(contacts),
    };
  }

  /**
   * Get contacts needing attention (low engagement score)
   */
  static getContactsNeedingAttention(contacts: Contact[], threshold: number = 50): EngagementScore[] {
    return this.calculateEngagementScores(contacts).filter(e => e.score < threshold);
  }

  /**
   * Calculate weekly activity heatmap data
   */
  static getWeeklyHeatmap(contacts: Contact[]): { day: string; hour: number; count: number }[] {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmap: { day: string; hour: number; count: number }[] = [];

    // Initialize all slots
    days.forEach(day => {
      for (let hour = 0; hour < 24; hour++) {
        heatmap.push({ day, hour, count: 0 });
      }
    });

    // Count contacts by creation time
    contacts.forEach(contact => {
      const created = new Date(contact.createdAt);
      const dayIndex = created.getDay();
      const hour = created.getHours();
      const index = dayIndex * 24 + hour;
      if (heatmap[index]) {
        heatmap[index].count++;
      }
    });

    return heatmap;
  }
}
