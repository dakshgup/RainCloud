export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ContactFormData = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>;

export class ContactManager {
  private contacts: Contact[] = [
    {
      id: "1",
      firstName: "Alex",
      lastName: "Chen",
      email: "alex.chen@acme.com",
      phone: "+1-555-0123",
      company: "ACME Corp",
      notes: "Lead developer, interested in cloud solutions",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "s.johnson@techflow.io",
      phone: "+1-555-0456",
      company: "TechFlow",
      notes: "CTO, looking for scalable infrastructure",
      createdAt: new Date("2024-02-03"),
      updatedAt: new Date("2024-02-10"),
    },
    {
      id: "3",
      firstName: "Marcus",
      lastName: "Rodriguez",
      email: "mrodriguez@startupx.com",
      phone: "+1-555-0789",
      company: "StartupX",
      notes: "Founder, rapid growth phase",
      createdAt: new Date("2024-02-20"),
      updatedAt: new Date("2024-02-20"),
    },
    {
      id: "4",
      firstName: "Emily",
      lastName: "Park",
      email: "emily@designstudio.co",
      phone: "+1-555-0321",
      company: "Design Studio",
      notes: "Creative director, needs collaboration tools",
      createdAt: new Date("2024-03-01"),
      updatedAt: new Date("2024-03-05"),
    },
    {
      id: "5",
      firstName: "David",
      lastName: "Kumar",
      email: "d.kumar@enterprise.net",
      phone: "+1-555-0654",
      company: "Enterprise Solutions",
      notes: "VP Engineering, enterprise client",
      createdAt: new Date("2024-03-10"),
      updatedAt: new Date("2024-03-10"),
    },
    {
      id: "6",
      firstName: "Jennifer",
      lastName: "Martinez",
      email: "jmartinez@globaltechcorp.com",
      phone: "+1-555-0987",
      company: "GlobalTech Corp",
      notes: "Product Manager, mobile-first strategy",
      createdAt: new Date("2024-11-15"),
      updatedAt: new Date("2024-11-15"),
    },
    {
      id: "7",
      firstName: "Michael",
      lastName: "Thompson",
      email: "mthompson@cloudsync.io",
      company: "CloudSync",
      notes: "CEO, needs integration solutions",
      createdAt: new Date("2024-11-20"),
      updatedAt: new Date("2024-11-20"),
    },
    {
      id: "8",
      firstName: "Lisa",
      lastName: "Wang",
      email: "lwang@innovatetech.com",
      phone: "+1-555-0234",
      company: "InnovateTech",
      notes: "Head of Engineering, AI/ML focus",
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2024-12-01"),
    },
    {
      id: "9",
      firstName: "Robert",
      lastName: "Davis",
      email: "rdavis@startup123.com",
      phone: "+1-555-0567",
      company: "Startup123",
      notes: "CTO, early-stage company",
      createdAt: new Date("2024-12-05"),
      updatedAt: new Date("2024-12-05"),
    },
    {
      id: "10",
      firstName: "Amanda",
      lastName: "Lee",
      email: "alee@digitalventures.net",
      phone: "+1-555-0890",
      company: "Digital Ventures",
      notes: "Director of Technology, fintech background",
      createdAt: new Date("2024-12-10"),
      updatedAt: new Date("2024-12-10"),
    },
    {
      id: "11",
      firstName: "Carlos",
      lastName: "Garcia",
      email: "cgarcia@megacorp.com",
      phone: "+1-555-0345",
      company: "MegaCorp",
      createdAt: new Date("2024-12-12"),
      updatedAt: new Date("2024-12-12"),
    },
    {
      id: "12",
      firstName: "Nina",
      lastName: "Patel",
      email: "npatel@techsolutions.org",
      company: "TechSolutions",
      notes: "Senior Developer, DevOps specialist",
      createdAt: new Date("2024-12-15"),
      updatedAt: new Date("2024-12-15"),
    },
    {
      id: "13",
      firstName: "Kevin",
      lastName: "Brown",
      email: "kbrown@futuretech.io",
      phone: "+1-555-0678",
      notes: "Freelance consultant, blockchain expert",
      createdAt: new Date("2024-12-18"),
      updatedAt: new Date("2024-12-18"),
    }
  ];

  addContact(contactData: ContactFormData): Contact {
    const contact: Contact = {
      id: crypto.randomUUID(),
      ...contactData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contacts.push(contact);
    return contact;
  }

  updateContact(id: string, contactData: Partial<ContactFormData>): Contact | null {
    const contactIndex = this.contacts.findIndex(c => c.id === id);
    if (contactIndex === -1) return null;

    this.contacts[contactIndex] = {
      ...this.contacts[contactIndex],
      ...contactData,
      updatedAt: new Date(),
    };
    return this.contacts[contactIndex];
  }

  deleteContact(id: string): boolean {
    const contactIndex = this.contacts.findIndex(c => c.id === id);
    if (contactIndex === -1) return false;

    this.contacts.splice(contactIndex, 1);
    return true;
  }

  getContact(id: string): Contact | null {
    return this.contacts.find(c => c.id === id) || null;
  }

  getAllContacts(): Contact[] {
    return [...this.contacts];
  }

  searchContacts(query: string): Contact[] {
    const lowercaseQuery = query.toLowerCase();
    return this.contacts.filter(contact =>
      contact.firstName.toLowerCase().includes(lowercaseQuery) ||
      contact.lastName.toLowerCase().includes(lowercaseQuery) ||
      contact.email.toLowerCase().includes(lowercaseQuery) ||
      contact.company?.toLowerCase().includes(lowercaseQuery)
    );
  }

  getContactsByCompany(): { [company: string]: Contact[] } {
    const companies = [...new Set(this.contacts.map(c => c.company).filter(Boolean))];
    return companies.reduce((acc, company) => {
      acc[company!] = this.contacts.filter(c => c.company === company);
      return acc;
    }, {} as { [company: string]: Contact[] });
  }

  getRecentContacts(days: number = 30): Contact[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const recentContacts: Contact[] = [];
    for (const contact of this.contacts) {
      if (contact.createdAt >= cutoffDate) {
        recentContacts.push(contact);
      }
    }
    return recentContacts;
  }

  getContactsWithMissingInfo(): Contact[] {
    return this.contacts.filter(contact => 
      !contact.phone || 
      !contact.company || 
      !contact.notes?.trim()
    );
  }

  filterContactsByTags(tags: string[]): Contact[] {
    if (tags.length === 0) return this.contacts;
    return this.contacts.filter(contact => {
      const contactTags = [
        contact.company?.toLowerCase(),
        ...contact.notes?.toLowerCase().split(' ') || []
      ].filter(Boolean);
      return tags.some(tag => contactTags.includes(tag.toLowerCase()));
    });
  }
}