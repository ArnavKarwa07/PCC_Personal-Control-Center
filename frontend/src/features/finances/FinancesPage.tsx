import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import './FinancesPage.css';

export const FinancesPage: React.FC = () => {
  const { toast } = useToast();
  const [income, setIncome] = useState(185000);
  const [expenses, setExpenses] = useState(42000);
  const [subscriptions] = useState([
    { id: '1', name: 'Cloud Server Cluster', amount: 3500.0, cycle: 'Monthly', category: 'Infrastructure' },
    { id: '2', name: 'AI Copilot Suite', amount: 1500.0, cycle: 'Monthly', category: 'Productivity' },
    { id: '3', name: 'Health Club Membership', amount: 4500.0, cycle: 'Monthly', category: 'Fitness' },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');

  const netWorth = income - expenses;

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAmount) return;
    const val = parseFloat(newAmount);
    if (isNaN(val)) return;

    if (newType === 'income') {
      setIncome((prev) => prev + val);
      toast.success(`Recorded Income: +₹${val.toLocaleString('en-IN')} (${newTitle})`);
    } else {
      setExpenses((prev) => prev + val);
      toast.success(`Recorded Expense: -₹${val.toLocaleString('en-IN')} (${newTitle})`);
    }
    setNewTitle('');
    setNewAmount('');
  };

  return (
    <div className="pcc-finances-page">
      <div className="pcc-finances-header">
        <div>
          <h1 className="pcc-finances-title">Personal Finance Engine</h1>
          <p className="pcc-finances-subtitle">Real-time cashflow analytics, budget gauges, and subscription telemetry (INR ₹)</p>
        </div>
      </div>

      <div className="pcc-finances-grid">
        <Card glass padding="lg" className="pcc-finance-card pcc-finance-card--networth">
          <span className="pcc-finance-card__label">Net Worth Balance</span>
          <div className="pcc-finance-card__value">₹{netWorth.toLocaleString('en-IN')}</div>
          <Badge variant="success" size="sm">+12.4% this month</Badge>
        </Card>

        <Card glass padding="lg" className="pcc-finance-card pcc-finance-card--income">
          <span className="pcc-finance-card__label">Monthly Income</span>
          <div className="pcc-finance-card__value" style={{ color: 'var(--color-success)' }}>
            +₹{income.toLocaleString('en-IN')}
          </div>
          <span className="pcc-finance-card__subtext">3 recurring sources</span>
        </Card>

        <Card glass padding="lg" className="pcc-finance-card pcc-finance-card--expenses">
          <span className="pcc-finance-card__label">Monthly Expenses</span>
          <div className="pcc-finance-card__value" style={{ color: 'var(--color-error)' }}>
            -₹{expenses.toLocaleString('en-IN')}
          </div>
          <span className="pcc-finance-card__subtext">22.7% burn rate</span>
        </Card>
      </div>

      <div className="pcc-finances-content">
        <Card glass padding="lg" className="pcc-finances-form-card">
          <h2>Record Transaction</h2>
          <form onSubmit={handleAddTransaction} className="pcc-finances-form">
            <div className="pcc-finances-form__row">
              <Input
                id="fin-title"
                label="Description"
                placeholder="e.g. Client Invoice, Groceries"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <Input
                id="fin-amount"
                label="Amount (₹)"
                type="number"
                step="1"
                placeholder="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
              />
            </div>
            <div className="pcc-finances-form__actions">
              <div className="pcc-type-toggle">
                <Button
                  type="button"
                  variant={newType === 'expense' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setNewType('expense')}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={newType === 'income' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setNewType('income')}
                >
                  Income
                </Button>
              </div>
              <Button type="submit" variant="primary">Record</Button>
            </div>
          </form>
        </Card>

        <Card glass padding="lg" className="pcc-subscriptions-card">
          <h2>Active Subscriptions</h2>
          <div className="pcc-subscriptions-list">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="pcc-subscription-item">
                <div>
                  <div className="pcc-subscription-name">{sub.name}</div>
                  <div className="pcc-subscription-cat">{sub.category} • {sub.cycle}</div>
                </div>
                <div className="pcc-subscription-amount">₹{sub.amount.toLocaleString('en-IN')}/mo</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinancesPage;
