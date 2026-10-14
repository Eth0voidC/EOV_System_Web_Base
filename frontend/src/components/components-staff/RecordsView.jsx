import { useEffect, useState } from 'react';

import SearchIcon from '../../assets/search-icon.png';
import Viewdetails from '../../assets/view-details-icon.png';
import { getAllEmployees } from '../../api/employees';
import { getEmployeeRecords } from '../../api/records';
import { formatMoney, formatDate } from './recordsHelpers';
import { TransactionBreakdown, DeductionBreakdown } from './RecordModals';
import '../components-css/recordsview.css';

const sumItems = (items) => items.reduce((sum, i) => sum + i.qty * i.price, 0);

function RecordsView() {
    const [employees, setEmployees] = useState([]);
    const [query, setQuery] = useState('');
    const [employee, setEmployee] = useState(null);
    const [records, setRecords] = useState({ balance: 0, transactions: [], deductions: [] });
    const [statusFilter, setStatusFilter] = useState(''); // '' = all
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [error, setError] = useState('');

    const [viewTransaction, setViewTransaction] = useState(null);
    const [viewDeduction, setViewDeduction] = useState(null);

    // Load the employee list once (Inactive employees stay searchable: their history still matters)
    useEffect(() => {
        const token = localStorage.getItem('token');

        getAllEmployees(token)
            .then((data) =>
                setEmployees(
                    data.map((e) => ({
                        id: e.employee_id,
                        code: e.employee_code,
                        name: `${e.last_name}, ${e.first_name}`,
                        employmentStatus: e.employment_status,
                        accountStatus: e.account_status,
                    }))
                )
            )
            .catch((err) => setError(err.message));
    }, []);

    // Suggestions while typing (hidden once an employee is chosen)
    const suggestions =
        query.trim() && !employee
            ? employees
                  .filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
                  .slice(0, 30)
            : [];

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setEmployee(null); // typing again means the old choice no longer applies
        setRecords({ balance: 0, transactions: [], deductions: [] });
        setStatusFilter('');
        setError('');
    };

    const handleSelect = async (emp) => {
        setEmployee(emp);
        setQuery(emp.name);
        setStatusFilter('');
        setError('');
        setLoadingRecords(true);

        try {
            const token = localStorage.getItem('token');
            setRecords(await getEmployeeRecords(token, emp.id));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingRecords(false);
        }
    };

    // Newest first (the API already sorts, this keeps the filter safe)
    const byDateDesc = (a, b) => b.date.localeCompare(a.date);

    const transactions = employee
        ? records.transactions
              .filter((t) => !statusFilter || t.status === statusFilter)
              .sort(byDateDesc)
        : [];

    const deductions = employee ? [...records.deductions].sort(byDateDesc) : [];

    // Balance comes from employee_balance, the same number the cart updates on every purchase
    const balance = employee ? records.balance : null;

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

            {error && <p className="rec-empty" style={{ color: '#b3261d' }}>{error}</p>}
            {loadingRecords && <p className="rec-empty">Loading records...</p>}

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
                            {employee && !loadingRecords && deductions.length === 0 && (
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
                                <option value="Deducted">Deducted</option>
                            </select>
                        </div>

                        <div className="rec-list">
                            {!employee && <p className="rec-empty">Search an employee to see records.</p>}
                            {employee && !loadingRecords && transactions.length === 0 && (
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