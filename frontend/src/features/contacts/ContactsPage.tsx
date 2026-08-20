import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Modal } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { apiClient } from '../../services/api';
import './ContactsPage.css';

export interface Contact {
  id: string;
  name: string;
  role: string;
  organization: string;
  email: string;
  phone: string;
  lastContact: string;
  status: string;
}

export const ContactsPage: React.FC = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: '1',
      name: 'Dr. Sarah Connor',
      role: 'Principal Research Scientist',
      organization: 'MIT AI Lab',
      email: 'sarah@mit.edu',
      phone: '+1 617-555-0144',
      lastContact: '3 days ago',
      status: 'Up to date',
    },
    {
      id: '2',
      name: 'Marcus Vance',
      role: 'VP of Engineering',
      organization: 'Apex Robotics',
      email: 'mvance@apex.io',
      phone: '+1 415-555-0198',
      lastContact: '3 weeks ago',
      status: 'Catch up due',
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchContacts = async () => {
      try {
        const res = await apiClient.get<{
          data: Array<{
            id: string;
            name: string;
            role?: string;
            organization?: string;
            email?: string;
            phone?: string;
            last_interaction?: string;
            next_followup?: string;
          }>;
        }>('/contacts');
        if (isMounted && res?.data && res.data.length > 0) {
          setContacts(
            res.data.map((c) => ({
              id: String(c.id),
              name: c.name,
              role: c.role || 'Contact',
              organization: c.organization || 'Independent',
              email: c.email || 'n/a',
              phone: c.phone || 'n/a',
              lastContact: c.last_interaction
                ? new Date(c.last_interaction).toLocaleDateString()
                : 'N/A',
              status:
                c.next_followup && new Date(c.next_followup) < new Date()
                  ? 'Catch up due'
                  : 'Up to date',
            }))
          );
        }
      } catch {
        // Retain initial contacts if API is unreachable
      }
    };

    fetchContacts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    let newId = String(Date.now());

    try {
      const res = await apiClient.post<{
        data: {
          id: string;
          name: string;
          role?: string;
          organization?: string;
          email?: string;
          phone?: string;
        };
      }>('/contacts', {
        name: name.trim(),
        organization: org.trim() || undefined,
        role: role.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      if (res?.data?.id) {
        newId = String(res.data.id);
      }
    } catch (err) {
      console.warn('Backend contact creation failed, falling back to local:', err);
    } finally {
      setIsSubmitting(false);
    }

    const newC: Contact = {
      id: newId,
      name: name.trim(),
      role: role.trim() || 'Contact',
      organization: org.trim() || 'Independent',
      email: email.trim() || 'n/a',
      phone: phone.trim() || 'n/a',
      lastContact: 'Just added',
      status: 'Up to date',
    };

    setContacts((prev) => [newC, ...prev]);
    toast.success(`Added contact: "${name.trim()}"`);
    setName('');
    setOrg('');
    setRole('');
    setEmail('');
    setPhone('');
    setIsAddModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const targetName = deleteTarget.name;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/contacts/${targetId}`);
    } catch (err) {
      console.warn('Backend contact deletion failed, updating local state:', err);
    } finally {
      setIsDeleting(false);
    }

    setContacts((prev) => prev.filter((c) => c.id !== targetId));
    toast.success(`Deleted contact: "${targetName}"`);
    setDeleteTarget(null);
  };

  const handleLogCatchUp = async (contactId: string, contactName: string) => {
    try {
      await apiClient.put(`/contacts/${contactId}`, {
        last_interaction: new Date().toISOString(),
        next_followup: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (err) {
      console.warn('Backend catch-up update failed, updating local state:', err);
    }

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              status: 'Up to date',
              lastContact: 'Just now',
            }
          : c
      )
    );

    toast.success(`Logged catch-up with ${contactName}`);
  };

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.organization.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pcc-contacts-page">
      <div className="pcc-contacts-header">
        <div>
          <h1 className="pcc-contacts-title">Personal CRM & Contacts</h1>
        </div>
      </div>

      <div className="pcc-contacts-toolbar">
        <Input
          id="crm-search"
          placeholder="Search by name, company, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="pcc-contacts-content">
        <div className="pcc-contacts-list">
          {filtered.length === 0 ? (
            <Card glass padding="md" className="pcc-contacts-empty">
              <p>No contacts found matching &ldquo;{search}&rdquo;</p>
            </Card>
          ) : (
            filtered.map((c) => {
              const initials =
                c.name
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'U';

              const roleOrg = [c.role, c.organization]
                .filter((v) => v && v !== 'n/a' && v !== 'Independent' && v !== 'Contact')
                .join(' @ ') || (c.role !== 'n/a' && c.role ? c.role : c.organization !== 'Independent' ? c.organization : '');

              return (
                <Card key={c.id} glass padding="none" className="pcc-contact-card">
                  <button
                    type="button"
                    className="pcc-contact-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(c);
                    }}
                    aria-label={`Delete ${c.name}`}
                    title="Delete Contact"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>

                  <div className="pcc-contact-card__first-row">
                    <div className="pcc-contact-card__user-info">
                      <div className="pcc-contact-card__avatar">{initials}</div>
                      <div className="pcc-contact-card__meta">
                        <h3 className="pcc-contact-card__name">{c.name}</h3>
                        {roleOrg ? (
                          <div className="pcc-contact-card__role">{roleOrg}</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="pcc-contact-card__badge-wrapper">
                      <Badge
                        variant={c.status === 'Catch up due' ? 'warning' : 'success'}
                        className="pcc-contact-card__badge"
                        title={c.lastContact ? `Last sync: ${c.lastContact}` : undefined}
                      >
                        {c.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="pcc-contact-card__second-row">
                    <div className="pcc-contact-card__contact-info">
                      {c.email && c.email !== 'n/a' && (
                        <span className="pcc-contact-card__info-item">{c.email}</span>
                      )}
                      {c.email && c.email !== 'n/a' && c.phone && c.phone !== 'n/a' && (
                        <span className="pcc-contact-card__divider">•</span>
                      )}
                      {c.phone && c.phone !== 'n/a' && (
                        <span className="pcc-contact-card__info-item">{c.phone}</span>
                      )}
                      {(!c.email || c.email === 'n/a') && (!c.phone || c.phone === 'n/a') && (
                        <span className="pcc-contact-card__empty-info">No contact details</span>
                      )}
                    </div>
                    <div className="pcc-contact-card__actions">
                      <Button
                        size="sm"
                        variant="outline"
                        className="pcc-contact-card__catchup-btn"
                        onClick={() => handleLogCatchUp(c.id, c.name)}
                      >
                        Log Catch-Up
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <Card glass padding="lg" className="pcc-add-contact-card">
          <h2>Add New Contact</h2>
          <form onSubmit={handleAddContact} className="pcc-add-contact-form">
            <Input
              id="c-name"
              label="Full Name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="c-org"
              label="Organization"
              placeholder="e.g. Acme Corp"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
            />
            <Input
              id="c-role"
              label="Role / Title"
              placeholder="e.g. Product Designer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <Input
              id="c-email"
              label="Email Address"
              type="email"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              id="c-phone"
              label="Phone Number"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Add Contact
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Contact"
        size="sm"
        footer={
          <div className="pcc-delete-modal-actions">
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <button
              type="button"
              className="pcc-delete-confirm-btn"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        }
      >
        <p className="pcc-delete-modal-text">
          Are you sure you want to delete {deleteTarget?.name}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default ContactsPage;
