
import { useState, useMemo, useRef, useEffect } from 'react';

import SaveIcon from '../../assets/save-icon.png';
import EditIcon from '../../assets/pencil-icon.png';
import SearchIcon from '../../assets/search-icon.png';
import DropdownIcon from '../../assets/dropdown-icon.png';


import {
    getAllEmployees,
    createEmployee,
    updateEmployee,
} from "../../api/employees";

import '../components-css/registercustomer.css';

const byName = (a, b) =>
    a.last_name.localeCompare(b.last_name) ||
    a.first_name.localeCompare(b.first_name);

const EMPLOYMENT_OPTIONS = ['Regular', 'Extra', 'Inactive'];

const ACCOUNT_OPTIONS = [
    { value: 'Active', label: 'Allow' },
    { value: 'Restricted', label: 'Restricted' },
];

const accountLabel = (value) =>
    ACCOUNT_OPTIONS.find((o) => o.value === value)?.label ?? value;

const NAME_PATTERN = /^[\p{L}][\p{L}\p{M} .'-]*$/u;

const EMPTY_FORM = {
    lastName: '',
    firstName: '',
    middleInitial: '',
    employmentStatus: 'Regular',
};

const EMPTY_DRAFT = {
    last_name: '',
    first_name: '',
    middle_initial: '',
    employment_status: '',
    account_status: '',
};

function Stat({ label, value }) {
    return (
        <div className="rco-stat">
            <span className="rco-label">{label}</span>
            <span className="rco-value">{value}</span>
        </div>
    );
}

function ResetIcon() {
    return (
        <svg
            className="rcf-btn-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
        </svg>
    );
}

function RegisterCustomer() {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    // Registration form
    const [form, setForm] = useState(EMPTY_FORM);
    const [formMessage, setFormMessage] = useState(null);

    // List controls
    const [searchTerm, setSearchTerm] = useState('');
    const searchRef = useRef(null);

    // Row editing
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [rowMessage, setRowMessage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Load actual employee records from the API.
    const loadEmployees = async () => {
        setIsLoading(true);
        setLoadError('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Please log in to view employees.');
            }

            const data = await getAllEmployees(token);

            if (!Array.isArray(data)) {
                throw new Error('Invalid employee data received from the server.');
            }

            setEmployees([...data].sort(byName));
        } catch (error) {
            setLoadError(error.message || 'Failed to load employees.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    // Overview numbers
    const stats = useMemo(() => ({
        active: employees.filter(
            (e) =>
                e.employment_status === 'Regular' ||
                e.employment_status === 'Extra'
        ).length,

        inactive: employees.filter(
            (e) => e.employment_status === 'Inactive'
        ).length,

        regular: employees.filter(
            (e) => e.employment_status === 'Regular'
        ).length,

        extra: employees.filter(
            (e) => e.employment_status === 'Extra'
        ).length,

        restricted: employees.filter(
            (e) => e.account_status === 'Restricted'
        ).length,

        allow: employees.filter(
            (e) => e.account_status === 'Active'
        ).length,
    }), [employees]);

    // Registration form
    const handleFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setFormMessage(null);
    };

    const handleMiddleInitialChange = (value) => {
        handleFieldChange(
            'middleInitial',
            value.replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase()
        );
    };

    const handleReset = () => {
        setForm(EMPTY_FORM);
        setFormMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormMessage(null);

        const lastName = form.lastName.trim().replace(/\s+/g, ' ');
        const firstName = form.firstName.trim().replace(/\s+/g, ' ');
        const middleInitial = form.middleInitial.trim();

        if (!lastName || !firstName) {
            setFormMessage({
                type: 'error',
                text: 'Last name and first name are required.',
            });
            return;
        }

        if (
            !NAME_PATTERN.test(lastName) ||
            !NAME_PATTERN.test(firstName)
        ) {
            setFormMessage({
                type: 'error',
                text: 'Names can only contain letters, spaces, periods, hyphens and apostrophes.',
            });
            return;
        }

        const isDuplicate = employees.some(
            (emp) =>
                emp.last_name.trim().toLowerCase() === lastName.toLowerCase() &&
                emp.first_name.trim().toLowerCase() === firstName.toLowerCase() &&
                (emp.middle_initial || '').trim().toLowerCase() ===
                    middleInitial.toLowerCase()
        );

        if (isDuplicate) {
            setFormMessage({
                type: 'error',
                text: 'This employee is already registered.',
            });
            return;
        }

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Please log in again.');
            }

            const response = await createEmployee(
                {
                    last_name: lastName,
                    first_name: firstName,
                    middle_initial: middleInitial || null,
                    employment_status: form.employmentStatus,
                },
                token
            );

            // The server generates the employee ID and code.
            await loadEmployees();

            setForm(EMPTY_FORM);
            setFormMessage({
                type: 'success',
                text: response.message || 'Employee registered successfully.',
            });
        } catch (error) {
            setFormMessage({
                type: 'error',
                text: error.message || 'Failed to register employee.',
            });
        }
    };

    // Row editing
    const startEditing = (emp) => {
        setEditingId(emp.employee_id);

        setDraft({
            last_name: emp.last_name,
            first_name: emp.first_name,
            middle_initial: emp.middle_initial || '',
            employment_status: emp.employment_status,
            account_status: emp.account_status,
        });

        setRowMessage(null);
    };

    const toggleEditing = (emp) => {
        if (editingId === emp.employee_id) {
            setEditingId(null);
            setDraft(EMPTY_DRAFT);
            setRowMessage(null);
        } else {
            startEditing(emp);
        }
    };

    const saveRow = async (id) => {
        setRowMessage(null);

        const lastName = (draft.last_name ?? '').trim().replace(/\s+/g, ' ');
        const firstName = (draft.first_name ?? '').trim().replace(/\s+/g, ' ');
        const middleInitial = (draft.middle_initial ?? '').trim();

        if (!lastName || !firstName) {
            setRowMessage({
                type: 'error',
                text: 'Last name and first name are required.',
            });
            return;
        }

        if (
            !NAME_PATTERN.test(lastName) ||
            !NAME_PATTERN.test(firstName)
        ) {
            setRowMessage({
                type: 'error',
                text: 'Names contain invalid characters.',
            });
            return;
        }

        const isDuplicate = employees.some(
            (emp) =>
                emp.employee_id !== id &&
                emp.last_name.trim().toLowerCase() === lastName.toLowerCase() &&
                emp.first_name.trim().toLowerCase() === firstName.toLowerCase() &&
                (emp.middle_initial || '').trim().toLowerCase() ===
                    middleInitial.toLowerCase()
        );

        if (isDuplicate) {
            setRowMessage({
                type: 'error',
                text: 'Another employee with this name already exists.',
            });
            return;
        }

        setIsSaving(true);

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Please log in again.');
            }

            const response = await updateEmployee(
                id,
                {
                    last_name: lastName,
                    first_name: firstName,
                    middle_initial: middleInitial || null,
                    employment_status: draft.employment_status,
                    account_status: draft.account_status,
                },
                token
            );

            // Reload to display the server-confirmed statuses and balance.
            await loadEmployees();

            setEditingId(null);
            setDraft(EMPTY_DRAFT);
            setRowMessage({
                type: 'success',
                text: response.message || 'Employee updated successfully.',
            });
        } catch (error) {
            setRowMessage({
                type: 'error',
                text: error.message || 'Failed to update employee.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Search
    const visibleEmployees = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();

        if (!q) return employees;

        return employees.filter((emp) =>
            [
                emp.employee_code,
                emp.last_name,
                emp.first_name,
                emp.middle_initial,
                emp.employment_status,
                accountLabel(emp.account_status),
            ]
                .join(' ')
                .toLowerCase()
                .includes(q)
        );
    }, [employees, searchTerm]);

    return (
        <div className="rc-page">
            <div className="rc-top">
                {/* Employee Overview */}
                <section className="rco-card" aria-labelledby="rco-title">
                    <h2 className="rco-title" id="rco-title">
                        Employee Overview
                    </h2>

                    <div className="rco-row rco-row-4">
                        <Stat label="Active" value={stats.active} />
                        <Stat label="Inactive" value={stats.inactive} />
                        <Stat label="Regular" value={stats.regular} />
                        <Stat label="Extra" value={stats.extra} />
                    </div>

                    <div className="rco-row rco-row-2">
                        <Stat label="Restricted" value={stats.restricted} />
                        <Stat label="Allow" value={stats.allow} />
                    </div>
                </section>

                {/* Employee Personal Information Form */}
                <section className="rcf-card" aria-labelledby="rcf-title">
                    <h2 className="rcf-title" id="rcf-title">
                        Employee Personal Information Form
                    </h2>

                    <form className="rcf-form" onSubmit={handleSubmit} noValidate>
                        <div className="rcf-names">
                            <div className="rcf-field">
                                <label htmlFor="rc-last-name">Last Name:</label>
                                <input
                                    id="rc-last-name"
                                    type="text"
                                    placeholder="e.g., Dela Cruz"
                                    maxLength={50}
                                    autoComplete="off"
                                    value={form.lastName}
                                    onChange={(e) =>
                                        handleFieldChange('lastName', e.target.value)
                                    }
                                />
                            </div>

                            <div className="rcf-field">
                                <label htmlFor="rc-first-name">First Name:</label>
                                <input
                                    id="rc-first-name"
                                    type="text"
                                    placeholder="e.g., Juan"
                                    maxLength={50}
                                    autoComplete="off"
                                    value={form.firstName}
                                    onChange={(e) =>
                                        handleFieldChange('firstName', e.target.value)
                                    }
                                />
                            </div>

                            <div className="rcf-field">
                                <label htmlFor="rc-middle-initial">Middle Initial:</label>
                                <input
                                    id="rc-middle-initial"
                                    type="text"
                                    placeholder="e.g., D"
                                    maxLength={1}
                                    autoComplete="off"
                                    autoCapitalize="characters"
                                    value={form.middleInitial}
                                    onChange={(e) =>
                                        handleMiddleInitialChange(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="rcf-status-row">
                            <div className="rcf-status">
                                <label htmlFor="rc-employment-status">
                                    Employment Status:
                                </label>
                                <div className="rcf-select-wrap">
                                    <select
                                        id="rc-employment-status"
                                        value={form.employmentStatus}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                'employmentStatus',
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="Regular">Regular</option>
                                        <option value="Extra">Extra</option>
                                    </select>
                                    <img
                                        src={DropdownIcon}
                                        alt=""
                                        className="rcf-select-icon"
                                    />
                                </div>
                            </div>

                            <div className="rcf-actions">
                                <button type="submit" className="rcf-btn">
                                    <img
                                        src={SaveIcon}
                                        alt=""
                                        className="rcf-btn-icon"
                                    />
                                    Save
                                </button>

                                <button
                                    type="button"
                                    className="rcf-btn"
                                    onClick={handleReset}
                                >
                                    <ResetIcon />
                                    Reset
                                </button>
                            </div>
                        </div>

                        <div className="rcf-feedback" role="status" aria-live="polite">
                            {formMessage && (
                                <p
                                    className={`rcf-message rcf-message-${formMessage.type}`}
                                >
                                    {formMessage.text}
                                </p>
                            )}
                        </div>
                    </form>
                </section>
            </div>

            {/* Full Employee List */}
            <section className="rcl-panel" aria-labelledby="rcl-title">
                <div className="rcl-band">
                    <div className="rcl-search">
                        <input
                            ref={searchRef}
                            type="text"
                            className="rcl-search-input"
                            placeholder="Search employees..."
                            aria-label="Search employees"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <button
                            type="button"
                            className="rcl-search-btn"
                            aria-label="Search"
                            onClick={() => searchRef.current?.focus()}
                        >
                            <img src={SearchIcon} alt="" />
                        </button>
                    </div>

                    <h2 className="rcl-title" id="rcl-title">
                        Full Employee List
                    </h2>
                </div>

                <div className="rcl-table" role="table" aria-label="Employees">
                    <div className="rcl-head" role="row">
                        <span role="columnheader">Employee_Code</span>
                        <span role="columnheader">Last_Name</span>
                        <span role="columnheader">First_Name</span>
                        <span role="columnheader">Middle_Initial</span>
                        <span role="columnheader">Balance</span>
                        <span role="columnheader">Emp_Status</span>
                        <span role="columnheader">Acct._Status</span>
                        <span role="columnheader" className="rcl-sr-only">
                            Action
                        </span>
                    </div>

                    <div className="rcl-body" role="rowgroup">
                        {isLoading ? (
                            <p className="rcl-empty">Loading employees...</p>
                        ) : loadError ? (
                            <div className="rcl-empty" role="alert">
                                <p>{loadError}</p>
                                <button type="button" onClick={loadEmployees}>
                                    Retry
                                </button>
                            </div>
                        ) : visibleEmployees.length === 0 ? (
                            <p className="rcl-empty">No employees found.</p>
                        ) : (
                            visibleEmployees.map((emp) => {
                                const isEditing = editingId === emp.employee_id;
                                const fullName =
                                    `${emp.first_name} ${emp.last_name}`;

                                return (
                                    <div
                                        className={`rcl-row${isEditing ? ' rcl-row-editing' : ''}`}
                                        role="row"
                                        key={emp.employee_id}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape' && isEditing) {
                                                setEditingId(null);
                                                setDraft(EMPTY_DRAFT);
                                            }
                                        }}
                                    >
                                        <span
                                            className="rcl-cell"
                                            role="cell"
                                            data-label="Code"
                                        >
                                            {emp.employee_code}
                                        </span>

                                        <span
                                            className="rcl-cell"
                                            role="cell"
                                            data-label="Last name"
                                        >
                                            {isEditing ? (
                                                <input
                                                    className="rcl-edit-input"
                                                    aria-label={`Last name of ${fullName}`}
                                                    value={draft.last_name}
                                                    onChange={(e) =>
                                                        setDraft((prev) => ({
                                                            ...prev,
                                                            last_name: e.target.value,
                                                        }))
                                                    }
                                                />
                                            ) : (
                                                emp.last_name
                                            )}
                                        </span>

                                        <span
                                            className="rcl-cell"
                                            role="cell"
                                            data-label="First name"
                                        >
                                            {isEditing ? (
                                                <input
                                                    className="rcl-edit-input"
                                                    aria-label={`First name of ${fullName}`}
                                                    value={draft.first_name}
                                                    onChange={(e) =>
                                                        setDraft((prev) => ({
                                                            ...prev,
                                                            first_name: e.target.value,
                                                        }))
                                                    }
                                                />
                                            ) : (
                                                emp.first_name
                                            )}
                                        </span>

                                        <span
                                            className="rcl-cell"
                                            role="cell"
                                            data-label="Middle initial"
                                        >
                                            {isEditing ? (
                                                <input
                                                    className="rcl-edit-input"
                                                    aria-label={`Middle initial of ${fullName}`}
                                                    maxLength={1}
                                                    value={draft.middle_initial}
                                                    onChange={(e) =>
                                                        setDraft((prev) => ({
                                                            ...prev,
                                                            middle_initial: e.target.value
                                                                .replace(/[^A-Za-z]/g, '')
                                                                .slice(0, 1)
                                                                .toUpperCase(),
                                                        }))
                                                    }
                                                />
                                            ) : (
                                                emp.middle_initial || '—'
                                            )}
                                        </span>

                                        <span
                                            className="rcl-cell rcl-cell-balance"
                                            role="cell"
                                            data-label="Balance"
                                        >
                                            ₱{Number(emp.balance ?? 0).toLocaleString(
                                                'en-PH',
                                                {
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0,
                                                }
                                            )}
                                        </span>

                                        <span
                                            className="rcl-cell rcl-cell-control"
                                            role="cell"
                                            data-label="Employment"
                                        >
                                            <span className="rcl-select-wrap">
                                                <select
                                                    aria-label={`Employment status of ${fullName}`}
                                                    disabled={!isEditing || isSaving}
                                                    value={
                                                        isEditing
                                                            ? draft.employment_status
                                                            : emp.employment_status
                                                    }
                                                    onChange={(e) =>
                                                        setDraft((prev) => ({
                                                            ...prev,
                                                            employment_status: e.target.value,
                                                        }))
                                                    }
                                                >
                                                    {EMPLOYMENT_OPTIONS.map((option) => (
                                                        <option
                                                            key={option}
                                                            value={option}
                                                        >
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                                <img
                                                    src={DropdownIcon}
                                                    alt=""
                                                    className="rcl-select-icon"
                                                />
                                            </span>
                                        </span>

                                        <span
                                            className="rcl-cell rcl-cell-control"
                                            role="cell"
                                            data-label="Account"
                                        >
                                            <span className="rcl-select-wrap">
                                                <select
                                                    aria-label={`Account status of ${fullName}`}
                                                    disabled={!isEditing || isSaving}
                                                    value={
                                                        isEditing
                                                            ? draft.account_status
                                                            : emp.account_status
                                                    }
                                                    onChange={(e) =>
                                                        setDraft((prev) => ({
                                                            ...prev,
                                                            account_status: e.target.value,
                                                        }))
                                                    }
                                                >
                                                    {ACCOUNT_OPTIONS.map((option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <img
                                                    src={DropdownIcon}
                                                    alt=""
                                                    className="rcl-select-icon"
                                                />
                                            </span>
                                        </span>

                                        <span
                                            className="rcl-cell rcl-cell-actions"
                                            role="cell"
                                            data-label="Action"
                                        >
                                            <button
                                                type="button"
                                                className="rcl-btn rcl-btn-edit"
                                                aria-pressed={isEditing}
                                                disabled={isSaving}
                                                onClick={() => toggleEditing(emp)}
                                            >
                                                <img src={EditIcon} alt="" />
                                                EDIT
                                            </button>

                                            <button
                                                type="button"
                                                className="rcl-btn rcl-btn-save"
                                                aria-label={`Save changes for ${fullName}`}
                                                disabled={!isEditing || isSaving}
                                                onClick={() => saveRow(emp.employee_id)}
                                            >
                                                <img src={SaveIcon} alt="" />
                                            </button>
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {rowMessage && (
                        <p
                            className={`rcf-message rcf-message-${rowMessage.type}`}
                            role="status"
                            aria-live="polite"
                        >
                            {rowMessage.text}
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}

export default RegisterCustomer;