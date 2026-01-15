import { describe, it, expect, beforeEach } from 'vitest';
import { ContactManager, Contact, ContactFormData } from '../ContactManager';

describe('ContactManager', () => {
  let manager: ContactManager;

  beforeEach(() => {
    manager = new ContactManager([]);
  });

  describe('addContact', () => {
    it('should add a new contact', () => {
      const formData: ContactFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const contact = manager.addContact(formData);

      expect(contact).toBeDefined();
      expect(contact.id).toBeDefined();
      expect(contact.firstName).toBe('John');
      expect(contact.lastName).toBe('Doe');
      expect(contact.email).toBe('john@example.com');
      expect(contact.createdAt).toBeInstanceOf(Date);
      expect(contact.updatedAt).toBeInstanceOf(Date);
    });

    it('should add contact with all optional fields', () => {
      const formData: ContactFormData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '+1-555-0123',
        company: 'TechCorp',
        notes: 'Important client',
      };

      const contact = manager.addContact(formData);

      expect(contact.phone).toBe('+1-555-0123');
      expect(contact.company).toBe('TechCorp');
      expect(contact.notes).toBe('Important client');
    });

    it('should generate unique IDs for each contact', () => {
      const contact1 = manager.addContact({
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
      });

      const contact2 = manager.addContact({
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob@example.com',
      });

      expect(contact1.id).not.toBe(contact2.id);
    });
  });

  describe('getContact', () => {
    it('should retrieve a contact by ID', () => {
      const added = manager.addContact({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      });

      const retrieved = manager.getContact(added.id);

      expect(retrieved).toEqual(added);
    });

    it('should return null for non-existent contact', () => {
      const result = manager.getContact('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getAllContacts', () => {
    it('should return empty array initially', () => {
      const contacts = manager.getAllContacts();
      expect(contacts).toEqual([]);
    });

    it('should return all added contacts', () => {
      manager.addContact({
        firstName: 'Alice',
        lastName: 'A',
        email: 'alice@example.com',
      });
      manager.addContact({
        firstName: 'Bob',
        lastName: 'B',
        email: 'bob@example.com',
      });

      const contacts = manager.getAllContacts();
      expect(contacts.length).toBe(2);
    });

    it('should return a copy of the contacts array', () => {
      manager.addContact({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      });

      const contacts1 = manager.getAllContacts();
      const contacts2 = manager.getAllContacts();

      expect(contacts1).not.toBe(contacts2);
      expect(contacts1).toEqual(contacts2);
    });
  });

  describe('updateContact', () => {
    it('should update an existing contact', () => {
      const added = manager.addContact({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      const updated = manager.updateContact(added.id, {
        firstName: 'Jonathan',
        company: 'NewCorp',
      });

      expect(updated).toBeDefined();
      expect(updated!.firstName).toBe('Jonathan');
      expect(updated!.lastName).toBe('Doe');
      expect(updated!.company).toBe('NewCorp');
    });

    it('should return null for non-existent contact', () => {
      const result = manager.updateContact('non-existent-id', {
        firstName: 'New',
      });

      expect(result).toBeNull();
    });

    it('should update partial fields', () => {
      const added = manager.addContact({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+1-555-0000',
      });

      manager.updateContact(added.id, {
        phone: '+1-555-1111',
      });

      const updated = manager.getContact(added.id);
      expect(updated!.phone).toBe('+1-555-1111');
      expect(updated!.firstName).toBe('Test');
    });
  });

  describe('deleteContact', () => {
    it('should delete an existing contact', () => {
      const added = manager.addContact({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      const result = manager.deleteContact(added.id);

      expect(result).toBe(true);
      expect(manager.getContact(added.id)).toBeNull();
    });

    it('should return false for non-existent contact', () => {
      const result = manager.deleteContact('non-existent-id');
      expect(result).toBe(false);
    });

    it('should remove contact from getAllContacts', () => {
      const contact1 = manager.addContact({
        firstName: 'Alice',
        lastName: 'A',
        email: 'alice@example.com',
      });
      const contact2 = manager.addContact({
        firstName: 'Bob',
        lastName: 'B',
        email: 'bob@example.com',
      });

      manager.deleteContact(contact1.id);

      const remaining = manager.getAllContacts();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(contact2.id);
    });
  });

  describe('searchContacts', () => {
    beforeEach(() => {
      manager.addContact({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        company: 'TechCorp',
      });
      manager.addContact({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        company: 'DataSys',
      });
      manager.addContact({
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob@example.com',
      });
    });

    it('should search by first name', () => {
      const results = manager.searchContacts('John');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.firstName === 'John')).toBe(true);
    });

    it('should search by last name', () => {
      const results = manager.searchContacts('Smith');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.lastName === 'Smith')).toBe(true);
    });

    it('should search by email', () => {
      const results = manager.searchContacts('jane@example.com');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.email === 'jane@example.com')).toBe(true);
    });

    it('should search by company', () => {
      const results = manager.searchContacts('TechCorp');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.company === 'TechCorp')).toBe(true);
    });

    it('should be case insensitive', () => {
      const results = manager.searchContacts('john');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = manager.searchContacts('NonExistent');
      expect(results.length).toBe(0);
    });
  });

  describe('getRecentContacts', () => {
    it('should return contacts created within the specified days', () => {
      manager.addContact({
        firstName: 'Recent',
        lastName: 'Contact',
        email: 'recent@example.com',
      });

      const recent = manager.getRecentContacts(30);
      expect(recent.length).toBeGreaterThan(0);
    });

    it('should respect the days parameter', () => {
      manager.addContact({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      });

      const recent = manager.getRecentContacts(1);
      expect(recent.length).toBeGreaterThan(0);
    });
  });

  describe('getContactsWithMissingInfo', () => {
    beforeEach(() => {
      manager.addContact({
        firstName: 'Complete',
        lastName: 'User',
        email: 'complete@example.com',
        phone: '+1-555-0123',
        company: 'Corp',
        notes: 'All fields',
      });

      manager.addContact({
        firstName: 'Incomplete',
        lastName: 'User',
        email: 'incomplete@example.com',
      });

      manager.addContact({
        firstName: 'Missing',
        lastName: 'Phone',
        email: 'nophone@example.com',
        company: 'Corp',
      });
    });

    it('should identify contacts missing phone', () => {
      const missing = manager.getContactsWithMissingInfo();
      expect(missing.some((c) => c.email === 'incomplete@example.com')).toBe(
        true
      );
    });

    it('should identify contacts missing company', () => {
      const missing = manager.getContactsWithMissingInfo();
      expect(missing.some((c) => c.email === 'incomplete@example.com')).toBe(
        true
      );
    });

    it('should identify contacts missing notes', () => {
      const missing = manager.getContactsWithMissingInfo();
      expect(missing.length).toBeGreaterThan(0);
    });

    it('should not include complete contacts', () => {
      const missing = manager.getContactsWithMissingInfo();
      expect(missing.some((c) => c.email === 'complete@example.com')).toBe(
        false
      );
    });
  });

  describe('getContactsByCompany', () => {
    beforeEach(() => {
      manager.addContact({
        firstName: 'Alice',
        lastName: 'A',
        email: 'alice@example.com',
        company: 'TechCorp',
      });
      manager.addContact({
        firstName: 'Bob',
        lastName: 'B',
        email: 'bob@example.com',
        company: 'TechCorp',
      });
      manager.addContact({
        firstName: 'Charlie',
        lastName: 'C',
        email: 'charlie@example.com',
        company: 'DataSys',
      });
    });

    it('should group contacts by company', () => {
      const byCompany = manager.getContactsByCompany();

      expect(byCompany['TechCorp']).toBeDefined();
      expect(byCompany['TechCorp'].length).toBe(2);
      expect(byCompany['DataSys']).toBeDefined();
      expect(byCompany['DataSys'].length).toBe(1);
    });

    it('should only include companies with contacts', () => {
      const byCompany = manager.getContactsByCompany();
      expect(byCompany['NonExistent']).toBeUndefined();
    });
  });

  describe('filterContactsByTags', () => {
    beforeEach(() => {
      manager.addContact({
        firstName: 'Alice',
        lastName: 'A',
        email: 'alice@example.com',
        company: 'TechCorp',
        notes: 'developer backend',
      });
      manager.addContact({
        firstName: 'Bob',
        lastName: 'B',
        email: 'bob@example.com',
        company: 'DataSys',
        notes: 'designer frontend',
      });
    });

    it('should filter by company tag', () => {
      const results = manager.filterContactsByTags(['TechCorp']);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.company === 'TechCorp')).toBe(true);
    });

    it('should return all contacts for empty tag array', () => {
      const results = manager.filterContactsByTags([]);
      expect(results.length).toBe(2);
    });

    it('should be case insensitive', () => {
      const results = manager.filterContactsByTags(['techcorp']);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('initialization with contacts', () => {
    it('should initialize with provided contacts', () => {
      const initialContacts: Contact[] = [
        {
          id: '1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const m = new ContactManager(initialContacts);
      const contacts = m.getAllContacts();

      expect(contacts.length).toBe(1);
      expect(contacts[0].email).toBe('test@example.com');
    });
  });
});
