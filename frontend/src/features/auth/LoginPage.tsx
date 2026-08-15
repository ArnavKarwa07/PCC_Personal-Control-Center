import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Input, Button } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../hooks/useToast';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { toast } = useToast();

  const [email, setEmail] = useState('arnav@pcc.local');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      login(
        {
          id: 'usr-admin',
          name: email.split('@')[0] || 'Arnav',
          email,
          role: 'Admin',
        },
        'token-mock-auth-jwt'
      );
      setLoading(false);
      toast.success('Logged in successfully!');
      navigate('/');
    }, 600);
  };

  return (
    <div className="pcc-auth-page">
      <div className="pcc-auth-container">
        <div className="pcc-auth-header">
          <img src="/logo.png" alt="PCC Logo" className="pcc-auth-logo-img" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'contain', margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 0 16px rgba(99, 102, 241, 0.4))' }} />
          <h1 className="pcc-auth-title">PCC</h1>
          <p className="pcc-auth-subtitle">Sign in to your Personal Control Center</p>
        </div>

        <Card glass padding="lg" className="pcc-auth-card">
          <form onSubmit={handleSubmit} className="pcc-auth-form">
            <Input
              id="login-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="login-password"
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
              Sign In
            </Button>
          </form>

          <div className="pcc-auth-footer">
            <span>Don&apos;t have an account?</span>
            <Link to="/register" className="pcc-auth-link">
              Create one
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
