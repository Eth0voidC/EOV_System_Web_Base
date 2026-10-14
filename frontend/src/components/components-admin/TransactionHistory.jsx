// frontend/src/components/components-admin/TransactionHistory.jsx
import { useEffect, useState } from 'react';
import SearchIcon from '../../assets/search-icon.png';
import Viewdetails from '../../assets/view-details-icon.png';
import { getAllEmployees } from '../../api/employees';
import { getEmployeeRecords } from '../../api/records';
import { formatMoney, formatDate } from '../components-staff/recordsHelpers'; //[cite: 5]
import { TransactionBreakdown } from '../components-staff/RecordModals'; //[cite: 5]

// Reusing staff CSS for table rows and badges, plus custom admin layout CSS
import '../components-css/recordsview.css'; //[cite: 5]
import '../components-css/transactionhistory.css';

const sumItems = (items) => items.reduce((sum, i) => sum + i.qty * i.price, 0); //[cite: 5]

function TransactionHistory() {
    const [employees, setEmployees] = useState([]);
    const [query, setQuery] = useState('');
    const [employee, setEmployee] = useState(null);
    const [records, setRecords] = useState({ transactions: [] }); //[cite: 5]
    const [statusFilter, setStatusFilter] = useState(''); 
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [error, setError] = useState('');
    const [viewTransaction, setViewTransaction] = useState(null); //[cite: 5]

    useEffect(() => {
        const token = localStorage.getItem('token');
        getAllEmployees(token)
            .then((data) => {
                // 1. Map the real data from the database
                const realEmployees = data.map((e) => ({
                    id: e.employee_id,
                    name: `${e.last_name}, ${e.first_name}`,
                    accountStatus: e.account_status,
                    employmentStatus: e.employment_status, 
                }));

                // 2. Inject a dummy Inactive employee for testing
                realEmployees.push({
                    id: 9999,
                    name: "Dummy, Inactive",
                    accountStatus: "Restricted", // or "Active"
                    employmentStatus: "Inactive"
                });

                // 3. Set the state
                setEmployees(realEmployees);
            })
            .catch((err) => setError(err.message));
    }, []);
    const suggestions =
        query.trim() && !employee
            ? employees
                  .filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
            : []; //[cite: 5]

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setEmployee(null); 
        setRecords({ transactions: [] });
        setStatusFilter('');
        setError('');
    }; //[cite: 5]

    const handleSelect = async (emp) => {
        setEmployee(emp);
        setQuery(emp.name);
        setStatusFilter('');
        setError('');
        setLoadingRecords(true);

        try {
            const token = localStorage.getItem('token');
            setRecords(await getEmployeeRecords(token, emp.id)); //[cite: 5]
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingRecords(false);
        }
    }; //[cite: 5]

    const byDateDesc = (a, b) => b.date.localeCompare(a.date); //[cite: 5]

    const transactions = employee
        ? records.transactions
              .filter((t) => !statusFilter || t.status === statusFilter)
              .sort(byDateDesc)
        : []; //[cite: 5]

    return (
        <div className="th-page">
            <section className="th-card">
                {/* ---------- Green Header with Search ---------- */}
                <div className="th-card-header">
                    <h2 className="th-title">TRANSACTION HISTORY</h2>
                    
                    <div className="th-search-container">
                        <span className="th-search-label">Search Employee</span>
                        <div className="th-search-box">
                            <img src={SearchIcon} alt="" className="th-input-search-icon" />

                            <input
                                type="text"
                                value={query}
                                onChange={handleQueryChange}
                                placeholder="Search Employee......"
                            />
                            {suggestions.length > 0 && (
                                <ul className="th-suggestions">
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
                                <ul className="th-suggestions">
                                    <li className="th-no-match">No employee found.</li>
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* ---------- Transaction List ---------- */}
                <div className="th-card-body">
                    {error && <p className="rec-empty" style={{ color: '#b3261d' }}>{error}</p>}
                    {loadingRecords && <p className="rec-empty">Loading records...</p>}

                    <div className="rec-row rec-transaction-cols rec-head-row th-head-row">
                        <span>DATE</span>
                        <span>TOTAL PRICE</span>
                        <span>STATUS</span>
                        <select
                            className="rec-status-filter th-status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Filter by status"
                        >
                            <option value="">All</option>
                            <option value="Pending">Pending</option>
                            <option value="Deducted">Deducted</option>
                        </select>
                    </div>

                    <div className="rec-list th-list">
                        {!employee && <p className="rec-empty">Search an employee to see transaction history.</p>}
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

            {/* ---------- Transaction Breakdown Modal ---------- */}
            {viewTransaction && (
                <TransactionBreakdown
                    transaction={viewTransaction}
                    employeeName={employee.name}
                    onClose={() => setViewTransaction(null)}
                />
            )}
        </div>
    );
}

export default TransactionHistory;