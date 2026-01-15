import { Contact } from './ContactManager';

const STORAGE_KEY = 'raincloud_contacts';

export const storage = {
  getContacts: (): Contact[] => {
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data) as Array<Record<string, unknown>>;
      return parsed.map((contact) => ({
        ...contact,
        createdAt: new Date(contact.createdAt as string),
        updatedAt: new Date(contact.updatedAt as string),
      })) as Contact[];
    } catch (error) {
      console.error('Failed to load contacts from storage:', error);
      return [];
    }
  },

  saveContacts: (contacts: Contact[]): void => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (error) {
      console.error('Failed to save contacts to storage:', error);
    }
  },

  clearContacts: (): void => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear contacts:', error);
    }
  },

  hasExistingData: (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
  },
};
