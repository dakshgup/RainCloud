import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storage } from '../storage';
import { Contact } from '../ContactManager';

describe('storage', () => {
  const mockContacts: Contact[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1-555-0123',
      company: 'TechCorp',
      notes: 'Test contact',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getContacts', () => {
    it('should return empty array when no data stored', () => {
      const contacts = storage.getContacts();
      expect(contacts).toEqual([]);
    });

    it('should retrieve saved contacts', () => {
      localStorage.setItem(
        'raincloud_contacts',
        JSON.stringify(mockContacts)
      );

      const contacts = storage.getContacts();

      expect(contacts.length).toBe(2);
      expect(contacts[0].firstName).toBe('John');
      expect(contacts[1].email).toBe('jane@example.com');
    });

    it('should properly deserialize dates', () => {
      localStorage.setItem(
        'raincloud_contacts',
        JSON.stringify(mockContacts)
      );

      const contacts = storage.getContacts();

      expect(contacts[0].createdAt).toBeInstanceOf(Date);
      expect(contacts[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('raincloud_contacts', 'invalid json');

      const contacts = storage.getContacts();

      expect(contacts).toEqual([]);
    });

    it('should handle null data gracefully', () => {
      localStorage.setItem('raincloud_contacts', 'null');

      const contacts = storage.getContacts();

      expect(Array.isArray(contacts)).toBe(true);
    });
  });

  describe('saveContacts', () => {
    it('should save contacts to localStorage', () => {
      storage.saveContacts(mockContacts);

      const stored = localStorage.getItem('raincloud_contacts');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.length).toBe(2);
      expect(parsed[0].firstName).toBe('John');
    });

    it('should overwrite existing data', () => {
      const firstBatch: Contact[] = [
        {
          id: '1',
          firstName: 'First',
          lastName: 'Batch',
          email: 'first@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      storage.saveContacts(firstBatch);
      storage.saveContacts(mockContacts);

      const contacts = storage.getContacts();
      expect(contacts.length).toBe(2);
      expect(contacts[0].firstName).toBe('John');
    });

    it('should handle empty array', () => {
      storage.saveContacts([]);

      const stored = localStorage.getItem('raincloud_contacts');
      const parsed = JSON.parse(stored!);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });

    it('should properly serialize dates', () => {
      const contact: Contact = {
        id: '1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        createdAt: new Date('2024-01-15T10:30:00Z'),
        updatedAt: new Date('2024-01-15T11:45:00Z'),
      };

      storage.saveContacts([contact]);

      const stored = localStorage.getItem('raincloud_contacts');
      const parsed = JSON.parse(stored!);

      expect(parsed[0].createdAt).toContain('2024-01-15');
    });
  });

  describe('clearContacts', () => {
    it('should remove data from localStorage', () => {
      storage.saveContacts(mockContacts);

      storage.clearContacts();

      const stored = localStorage.getItem('raincloud_contacts');
      expect(stored).toBeNull();
    });

    it('should handle clearing when no data exists', () => {
      expect(() => {
        storage.clearContacts();
      }).not.toThrow();
    });

    it('should result in empty array from getContacts', () => {
      storage.saveContacts(mockContacts);
      storage.clearContacts();

      const contacts = storage.getContacts();
      expect(contacts).toEqual([]);
    });
  });

  describe('hasExistingData', () => {
    it('should return false when no data exists', () => {
      const hasData = storage.hasExistingData();
      expect(hasData).toBe(false);
    });

    it('should return true when data exists', () => {
      storage.saveContacts(mockContacts);

      const hasData = storage.hasExistingData();
      expect(hasData).toBe(true);
    });

    it('should return false after clearing', () => {
      storage.saveContacts(mockContacts);
      storage.clearContacts();

      const hasData = storage.hasExistingData();
      expect(hasData).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle save and retrieve cycle', () => {
      const contact: Contact = {
        id: '1',
        firstName: 'Integration',
        lastName: 'Test',
        email: 'integration@example.com',
        phone: '+1-555-9999',
        company: 'TestCorp',
        notes: 'Integration test contact',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      };

      storage.saveContacts([contact]);
      const retrieved = storage.getContacts();

      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe('1');
      expect(retrieved[0].firstName).toBe('Integration');
      expect(retrieved[0].email).toBe('integration@example.com');
    });

    it('should handle multiple save operations', () => {
      const batch1 = [mockContacts[0]];
      const batch2 = mockContacts;

      storage.saveContacts(batch1);
      expect(storage.getContacts().length).toBe(1);

      storage.saveContacts(batch2);
      expect(storage.getContacts().length).toBe(2);
    });

    it('should preserve all contact fields', () => {
      const contact = mockContacts[0];
      storage.saveContacts([contact]);

      const retrieved = storage.getContacts();

      expect(retrieved[0].id).toBe(contact.id);
      expect(retrieved[0].firstName).toBe(contact.firstName);
      expect(retrieved[0].lastName).toBe(contact.lastName);
      expect(retrieved[0].email).toBe(contact.email);
      expect(retrieved[0].phone).toBe(contact.phone);
      expect(retrieved[0].company).toBe(contact.company);
      expect(retrieved[0].notes).toBe(contact.notes);
    });
  });
});
