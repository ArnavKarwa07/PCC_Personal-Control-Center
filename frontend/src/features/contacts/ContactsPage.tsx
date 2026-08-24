import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Modal, EmptyState } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { contactsApi } from '../../services/api';
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
      try {
        const res = await contactsApi.getAll();
        const rawList = (res as any)?.data || (Array.isArray(res) ? res : []);
        if (isMounted && Array.isArray(rawList) && rawList.length > 0) {
          const mapped = rawList.map((c: any) => ({
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
          }));
          setContacts(mapped);
          try {
            localStorage.setItem('pcc_contacts', JSON.stringify(mapped));
          } catch {
            // ignore
          }
          if (isMounted) setIsLoading(false);
          return;
        }
      } catch {
        // Fallback to localStorage
      }

      try {
        const stored = localStorage.getItem('pcc_contacts');
        if (stored && isMounted) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setContacts(parsed);
          }
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setIsLoading(false);
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
      const res = await contactsApi.create({
        name: name.trim(),
        role: role.trim() || undefined,
        organization: org.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      const created = (res as any)?.data || res;
      if (created && created.id) {
        newId = String(created.id);
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
      await contactsApi.delete(targetId);
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
      await contactsApi.update(contactId, {
        last_interaction: new Date().toISOString(),
        next_followup: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any);
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
          <h1 className="pcc-contacts-title">Contacts</h1>
        </div>
      </div>

      <div className="pcc-contacts-toolbar">
        <Input
          id="crm-search"
          placeholder="Search by name, company, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant="primary"
          className="pcc-add-contact-btn"
          onClick={() => setIsAddModalOpen(true)}
          icon={
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          Add Contact
        </Button>
      </div>

      <div className="pcc-contacts-content">
        <div className="pcc-contacts-list">
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    height: '110px',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-lg)',
                    opacity: 0.6,
                  }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No Contacts Found"
              description={
                search
                  ? `No contacts match "${search}". Try clearing search.`
                  : 'Your personal contacts directory is empty.'
              }
              actionLabel="Add Contact"
              onAction={() => setIsAddModalOpen(true)}
            />
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
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Contact"
        size="md"
      >
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
          <div className="pcc-add-contact-modal-footer">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Add Contact
            </Button>
          </div>
        </form>
      </Modal>

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
