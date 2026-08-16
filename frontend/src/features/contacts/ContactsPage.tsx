import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import './ContactsPage.css';

export const ContactsPage: React.FC = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState([
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

  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newC = {
      id: String(Date.now()),
      name,
      role: role || 'Contact',
      organization: org || 'Independent',
      email: email || 'n/a',
      phone: 'n/a',
      lastContact: 'Just added',
      status: 'Up to date',
    };

    setContacts([newC, ...contacts]);
    toast.success(`Added contact: "${name}"`);
    setName('');
    setOrg('');
    setRole('');
    setEmail('');
  };

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.organization.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pcc-contacts-page">
      <div className="pcc-contacts-header">
        <div>
          <h1 className="pcc-contacts-title">Personal CRM & Contacts</h1>
          <p className="pcc-contacts-subtitle">Relationship context, interaction history, and catch-up reminders</p>
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
          {filtered.map((c) => {
            const initials = c.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card key={c.id} glass padding="lg" className="pcc-contact-card">
                <div className="pcc-contact-card__header">
                  <div className="pcc-contact-card__user-info">
                    <div className="pcc-contact-card__avatar">{initials}</div>
                    <div className="pcc-contact-card__meta">
                      <h3 className="pcc-contact-card__name">{c.name}</h3>
                      <div className="pcc-contact-card__role">
                        {c.role} @ {c.organization}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={c.status === 'Catch up due' ? 'warning' : 'success'}
                    className="pcc-contact-card__badge"
                  >
                    {c.status}
                  </Badge>
                </div>
                <div className="pcc-contact-card__details">
                  <div><span>Email:</span> {c.email}</div>
                  <div><span>Phone:</span> {c.phone}</div>
                  <div><span>Last sync:</span> {c.lastContact}</div>
                </div>
                <div className="pcc-contact-card__actions">
                  <Button size="sm" variant="outline" onClick={() => toast.info(`Logged catch-up with ${c.name}`)}>
                    Log Catch-Up
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card glass padding="lg" className="pcc-add-contact-card">
          <h2>Add New Contact</h2>
          <form onSubmit={handleAddContact} className="pcc-add-contact-form">
            <Input id="c-name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input id="c-org" label="Organization" value={org} onChange={(e) => setOrg(e.target.value)} />
            <Input id="c-role" label="Role / Title" value={role} onChange={(e) => setRole(e.target.value)} />
            <Input id="c-email" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" variant="primary">Add Contact</Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ContactsPage;
