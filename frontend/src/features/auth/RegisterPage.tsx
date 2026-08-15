import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Input, Button } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../hooks/useToast';
import './AuthPages.css';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const [name, setName] = useState('Arnav');
  const [email, setEmail] = useState('arnav@pcc.local');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      login(
        {
          id: 'usr-new',
          name,
          email,
          role: 'Admin',
        },
        'token-mock-auth-jwt'
      );
      setLoading(false);
      toast.success('Account created successfully!');
      navigate('/');
    }, 600);
  };

  return (
    <div className="pcc-auth-page">
      <div className="pcc-auth-container">
        <div className="pcc-auth-header">
          <img src="/logo.png" alt="PCC Logo" className="pcc-auth-logo-img" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'contain', margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 0 16px rgba(99, 102, 241, 0.4))' }} />
          <h1 className="pcc-auth-title">PCC</h1>
          <p className="pcc-auth-subtitle">Create your personal operating system account</p>
        </div>

        <Card glass padding="lg" className="pcc-auth-card">
          <form onSubmit={handleSubmit} className="pcc-auth-form">
            <Input
              id="reg-name"
              label="Your Name"
              placeholder="e.g. Arnav"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              id="reg-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="reg-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Get Started
            </Button>
          </form>

          <div className="pcc-auth-footer">
            <span>Already have an account?</span>
            <Link to="/login" className="pcc-auth-link">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
