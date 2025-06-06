'use client';

import { useState, useEffect } from 'react';
import { ContactManager, Contact, ContactFormData } from '../lib/ContactManager';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Search, Plus, Edit2, Trash2, Mail, Phone, Building2, FileText, Filter, X } from 'lucide-react';

const contactManager = new ContactManager();

export default function CRM() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'incomplete'>('all');
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  useEffect(() => {
    setContacts(contactManager.getAllContacts());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingContact) {
      const updated = contactManager.updateContact(editingContact.id, formData);
      if (updated) {
        setContacts(contactManager.getAllContacts());
      }
      setShowEditDrawer(false);
    } else {
      contactManager.addContact(formData);
      setContacts(contactManager.getAllContacts());
      setShowForm(false);
    }
    
    resetForm();
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      notes: contact.notes || '',
    });
    setShowEditDrawer(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      contactManager.deleteContact(id);
      setContacts(contactManager.getAllContacts());
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      notes: '',
    });
    setEditingContact(null);
    setShowForm(false);
    setShowEditDrawer(false);
  };

  const getFilteredContacts = () => {
    let result = contacts;
    
    if (activeFilter === 'recent') {
      result = contactManager.getRecentContacts(30);
    } else if (activeFilter === 'incomplete') {
      result = contactManager.getContactsWithMissingInfo();
    }
    
    if (searchQuery) {
      result = contactManager.searchContacts(searchQuery);
    }
    
    return result;
  };

  const filteredContacts = getFilteredContacts();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col gap-4 slide-in-from-left">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "outline" : "default"}
            className="w-full sm:w-auto animate-stagger-1 scale-in"
          >
            {showForm ? (
              <>Cancel</>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </>
            )}
          </Button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="group"
          >
            <Filter className="mr-1 h-3 w-3 group-hover:rotate-12 transition-transform" />
            All ({contacts.length})
          </Button>
          <Button
            variant={activeFilter === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('recent')}
            className="group"
          >
            Recent ({contactManager.getRecentContacts(30).length})
          </Button>
          <Button
            variant={activeFilter === 'incomplete' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('incomplete')}
            className="group"
          >
            Incomplete ({contactManager.getContactsWithMissingInfo().length})
          </Button>
          {(searchQuery || activeFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="group text-zinc-500"
            >
              <X className="mr-1 h-3 w-3 group-hover:rotate-90 transition-transform" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="scale-in">
          <CardHeader className="fade-in-down">
            <CardTitle>
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </CardTitle>
            <CardDescription>
              {editingContact ? 'Update contact information' : 'Enter contact details below'}
            </CardDescription>
          </CardHeader>
          <CardContent className="fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  type="text"
                  placeholder="Company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <Textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 sm:flex-none">
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Contacts Grid */}
      <div className="grid gap-4 fade-in-up animate-stagger-2">
        {filteredContacts.length === 0 ? (
          <Card className="scale-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center text-zinc-500">
                {searchQuery ? (
                  <>
                    <Search className="mx-auto h-12 w-12 mb-4 opacity-50 pulse" />
                    <p className="text-lg fade-in-up">No contacts found</p>
                    <p className="text-sm animate-stagger-1 fade-in-up">Try adjusting your search</p>
                  </>
                ) : (
                  <>
                    <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50 bounce-in" />
                    <p className="text-lg fade-in-up">No contacts yet</p>
                    <p className="text-sm animate-stagger-1 fade-in-up">Add your first contact to get started</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map((contact, index) => (
              <Card 
                key={contact.id} 
                className={`hover:shadow-md transition-shadow scale-in animate-stagger-${Math.min(index + 1, 6)}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {contact.firstName} {contact.lastName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Mail className="h-3 w-3 group-hover:scale-110 transition-transform" />
                    {contact.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600 group">
                      <Phone className="h-3 w-3 group-hover:rotate-12 transition-transform" />
                      {contact.phone}
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600 group">
                      <Building2 className="h-3 w-3 group-hover:scale-110 transition-transform" />
                      {contact.company}
                    </div>
                  )}
                  {contact.notes && (
                    <div className="flex items-start gap-2 text-sm text-zinc-600 group">
                      <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
                      <span className="line-clamp-2">{contact.notes}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(contact)}
                      className="flex-1 group"
                    >
                      <Edit2 className="mr-1 h-3 w-3 group-hover:rotate-12 transition-transform" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(contact.id)}
                      className="flex-1 group"
                    >
                      <Trash2 className="mr-1 h-3 w-3 group-hover:scale-110 transition-transform" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Contact Drawer */}
      <Sheet open={showEditDrawer} onOpenChange={setShowEditDrawer}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="fade-in-down">
            <SheetTitle>Edit Contact</SheetTitle>
            <SheetDescription>
              Update contact information
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6 fade-in-up animate-stagger-1">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
              <Input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <Input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <Textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Update Contact
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowEditDrawer(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}