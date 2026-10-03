import { useState } from 'react';

import SearchIcon from '../../assets/search-icon.png';
import Viewdetails from '../../assets/view-details-icon.png';

import { formatMoney, formatDate } from './recordsHelpers';
import { TransactionBreakdown, DeductionBreakdown } from './RecordModals';
import '../components-css/recordsview.css';

// Temporary sample data. Later this comes from the API.
const sampleEmployees = [
    {
        id: 1,
        code: 'EMP-001',
        name: 'Maria Reyes',
        employmentStatus: 'Regular',
        accountStatus: 'Active',
        transactions: [
            { id: 101, date: '2026-09-28', status: 'Pending', items: [{ name: 'Product 1', qty: 2, price: 50 }, { name: 'Product 3', qty: 1, price: 75 }] },
            { id: 102, date: '2026-09-20', status: 'Pending', items: [{ name: 'Product 2', qty: 3, price: 62.5 }] },
            { id: 103, date: '2026-09-12', status: 'Paid', items: [{ name: 'Product 4', qty: 1, price: 87.5 }, { name: 'Product 5', qty: 1, price: 100 }] },
            { id: 104, date: '2026-09-03', status: 'Paid', items: [{ name: 'Product 6', qty: 2, price: 112.5 }] },
        ],
        deductions: [
            { id: 201, date: '2026-09-15', periodStart: '2026-09-01', periodEnd: '2026-09-15', entries: [{ date: '2026-09-03', amount: 225 }, { date: '2026-09-12', amount: 187.5 }] },
            { id: 202, date: '2026-08-31', periodStart: '2026-08-16', periodEnd: '2026-08-31', entries: [{ date: '2026-08-22', amount: 150 }] },
        ],
    },
    {
        id: 2,
        code: 'EMP-002',
        name: 'Mark Santos',
        employmentStatus: 'Regular',
        accountStatus: 'Active',
        transactions: [
            { id: 301, date: '2026-09-25', status: 'Pending', items: [{ name: 'Product 7', qty: 1, price: 125 }] },
            { id: 302, date: '2026-09-10', status: 'Paid', items: [{ name: 'Product 1', qty: 4, price: 50 }] },
        ],
        deductions: [
            { id: 401, date: '2026-09-15', periodStart: '2026-09-01', periodEnd: '2026-09-15', entries: [{ date: '2026-09-10', amount: 200 }] },
        ],
    },
    {
        id: 3,
        code: 'EMP-003',
        name: 'Maricel Cruz',
        employmentStatus: 'Probationary',
        accountStatus: 'Restricted',
        transactions: [
            { id: 501, date: '2026-09-18', status: 'Pending', items: [{ name: 'Product 2', qty: 2, price: 62.5 }, { name: 'Product 8', qty: 1, price: 137.5 }] },
        ],
        deductions: [],
    },
];

const sumItems = (items) => items.reduce((sum, i) => sum + i.qty * i.price, 0);

function RecordsView() {
    const [query, setQuery] = useState('');
    const [employee, setEmployee] = useState(null);
    const [statusFilter, setStatusFilter] = useState(''); // '' = all

    const [viewTransaction, setViewTransaction] = useState(null);
    const [viewDeduction, setViewDeduction] = useState(null);

    // Suggestions while typing (hidden once an employee is chosen)
    const suggestions =
        query.trim() && !employee
            ? sampleEmployees
                  .filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
                  .slice(0, 6)
            : [];

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setEmployee(null); // typing again means the old choice no longer applies
        setStatusFilter('');
    };

    const handleSelect = (emp) => {
        setEmployee(emp);
        setQuery(emp.name);
        setStatusFilter('');
    };

    // Newest first
    const byDateDesc = (a, b) => b.date.localeCompare(a.date);

    const transactions = employee
        ? employee.transactions
              .filter((t) => !statusFilter || t.status === statusFilter)
              .sort(byDateDesc)
        : [];

    const deductions = employee ? [...employee.deductions].sort(byDateDesc) : [];

    // Balance = everything still Pending (change this rule if yours is different)
    const balance = employee
        ? employee.transactions
              .filter((t) => t.status === 'Pending')
              .reduce((sum, t) => sum + sumItems(t.items), 0)
        : null;

    return (
        <div className="records-page">
            <div className="records-topbar">
                <h2 className="records-title">Records</h2>

                <div className="records-search-area">
                    <span className="records-search-label">Search Employee</span>

                    <div className="records-search">
                        <img src={SearchIcon} alt="" className="records-search-icon" />
                        <input
                            type="text"
                            value={query}
                            onChange={handleQueryChange}
                            placeholder="Enter Employee Name....."
                        />

                        {suggestions.length > 0 && (
                            <ul className="rec-suggestions">
                                {suggestions.map((emp) => (
                                    <li key={emp.id} onClick={() => handleSelect(emp)}>
                                        <span>{emp.name}</span>
                                        <span className={`rec-badge rec-${emp.accountStatus.toLowerCase()}`}>
                                            {emp.accountStatus}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {query.trim() && !employee && suggestions.length === 0 && (
                            <ul className="rec-suggestions">
                                <li className="rec-no-match">No employee found.</li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <div className="records-layout">
                {/* ---------- Left column ---------- */}
                <div className="records-side">
                  <section className="rec-card">
                      <h3 className="rec-card-header rec-card-header-small">Employee Information</h3>
                      <div className="rec-card-body rec-info">
                          <p className="rec-info-code">
                              EMPLOYEE CODE: <span className="rec-value">{employee?.code}</span>
                          </p>
                          <p>
                              Employee Name: <span className="rec-value">{employee?.name}</span>
                          </p>
                          <p>
                              Employment Status: <span className="rec-value">{employee?.employmentStatus}</span>
                          </p>
                          <p>
                              Account Status:{' '}
                              {employee && (
                                  <span className={`rec-badge rec-${employee.accountStatus.toLowerCase()}`}>
                                      {employee.accountStatus}
                                  </span>
                              )}
                          </p>
                      </div>
                  </section>

                    <section className="rec-card">
                        <h3 className="rec-card-header">Current Balance</h3>
                        <div className="rec-card-body rec-balance">
                            {employee ? formatMoney(balance) : ''}
                        </div>
                    </section>
                </div>

                {/* ---------- Deduction History ---------- */}
                <section className="rec-card rec-panel">
                    <h3 className="rec-card-header">Deduction History</h3>

                    <div className="rec-card-body rec-panel-body">
                        <div className="rec-row rec-deduction-cols rec-head-row">
                            <span>Date</span>
                            <span>Period Covered</span>
                            <span>Total Amount</span>
                            <span>No. of Transactions</span>
                            <span></span>
                        </div>

                        <div className="rec-list">
                            {!employee && <p className="rec-empty">Search an employee to see records.</p>}
                            {employee && deductions.length === 0 && (
                                <p className="rec-empty">No deductions yet.</p>
                            )}

                            {deductions.map((d) => (
                                <div className="rec-row rec-deduction-cols rec-item" key={d.id}>
                                    <span>{formatDate(d.date)}</span>
                                    <span>
                                        {formatDate(d.periodStart)} - {formatDate(d.periodEnd)}
                                    </span>
                                    <span>{formatMoney(d.entries.reduce((s, e) => s + e.amount, 0))}</span>
                                    <span>{d.entries.length}</span>
                                    <button
                                        type="button"
                                        className="rec-icon-btn"
                                        onClick={() => setViewDeduction(d)}
                                        aria-label="View deduction details"
                                    >
                                        <img src={Viewdetails} alt="" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------- Transaction History ---------- */}
                <section className="rec-card rec-panel">
                    <h3 className="rec-card-header">Transaction History</h3>

                    <div className="rec-card-body rec-panel-body">
                        <div className="rec-row rec-transaction-cols rec-head-row">
                            <span>DATE</span>
                            <span>TOTAL PRICE</span>
                            <span>STATUS</span>
                            <select
                                className="rec-status-filter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                aria-label="Filter by status"
                            >
                                <option value="">All</option>
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>

                        <div className="rec-list">
                            {!employee && <p className="rec-empty">Search an employee to see records.</p>}
                            {employee && transactions.length === 0 && (
                                <p className="rec-empty">No transactions found.</p>
                            )}

                            {transactions.map((t) => (
                                <div className="rec-row rec-transaction-cols rec-item" key={t.id}>
                                    <span>{formatDate(t.date)}</span>
                                    <span>{formatMoney(sumItems(t.items))}</span>
                                    <span>
                                        <span className={`rec-badge rec-${t.status.toLowerCase()}`}>
                                            {t.status}
                                        </span>
                                    </span>
                                    <button
                                        type="button"
                                        className="rec-icon-btn"
                                        onClick={() => setViewTransaction(t)}
                                        aria-label="View transaction details"
                                    >
                                        <img src={Viewdetails} alt="" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {viewTransaction && (
                <TransactionBreakdown
                    transaction={viewTransaction}
                    employeeName={employee.name}
                    onClose={() => setViewTransaction(null)}
                />
            )}

            {viewDeduction && (
                <DeductionBreakdown
                    deduction={viewDeduction}
                    employeeName={employee.name}
                    onClose={() => setViewDeduction(null)}
                />
            )}
        </div>
    );
}

export default RecordsView;