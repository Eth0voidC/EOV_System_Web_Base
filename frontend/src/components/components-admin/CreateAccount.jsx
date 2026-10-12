import { useState, useMemo, useRef, useEffect} from 'react';
import { createUser, getUsers, updateUser } from '../../api/auth';

import Logo from '../../assets/kick1.jpg';
import SaveIcon from '../../assets/save-icon.png';
import EditIcon from '../../assets/pencil-icon.png';
import SearchIcon from '../../assets/search-icon.png';
import DropdownIcon from '../../assets/dropdown-icon.png';

import '../components-css/createaccount.css';

// ---------- Temporary sample data. Later this comes from the API. ----------
// Passwords are stored as bcrypt hashes, so the API never sends them back.

const ROLES = ['Admin', 'Staff'];
const ROLE_IDS = { Admin: 1, Staff: 2 }; // matches the Roles table (needed for POST /api/auth/users)

const NAME_PATTERN = /^\p{L}[\p{L} .'-]*$/u; // letters, spaces, periods, hyphens, apostrophes
const USERNAME_PATTERN = /^[A-Za-z0-9.]{3,50}$/; // the same characters the login form accepts
const MIN_PASSWORD_LENGTH = 8;

const EMPTY_FORM = {
    lastName: '',
    firstName: '',
    middleInitial: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: '',
};
const EMPTY_DRAFT = { lastName: '', firstName: '', middleInitial: '', role: '', username: '', password: '' };

const cleanName = (value) => value.trim().replace(/\s+/g, ' ');
const cleanInitial = (value) => value.replace(/[^A-Za-z]/g, '').slice(0, 1).toUpperCase();


// Returns an error message, or '' when everything is valid.
function validateProfile({ lastName, firstName, role, username }, users, ignoreId = null) {
    if (!lastName || !firstName) return 'Last name and first name are required.';

    if (!NAME_PATTERN.test(lastName) || !NAME_PATTERN.test(firstName)) {
        return 'Names can only contain letters, spaces, periods, hyphens and apostrophes.';
    }

    if (!role) return 'Please select a role.';

    if (!USERNAME_PATTERN.test(username)) {
        return 'Username must be 3 to 50 characters: letters, numbers and dots only.';
    }

    const isTaken = users.some(
        (u) => u.user_id !== ignoreId && u.username.toLowerCase() === username.toLowerCase()
    );
    if (isTaken) return 'That username is already taken.';

    return '';
}

function EyeIcon({ off }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="100%"
            height="100%"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {off ? (
                <>
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" x2="22" y1="2" y2="22" />
                </>
            ) : (
                <>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            )}
        </svg>
    );
}

function ResetIcon() {
    return (
        <svg
            className="caf-btn-icon"
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

function CreateAccount() {
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [loadError, setLoadError] = useState('');

    const currentUsername = localStorage.getItem('username');

    // ---------- Account form ----------
    const [form, setForm] = useState(EMPTY_FORM);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formMessage, setFormMessage] = useState(null);

    // ---------- List controls ----------
    const [searchTerm, setSearchTerm] = useState('');
    const searchRef = useRef(null);
    const [listMessage, setListMessage] = useState(null);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                setIsLoadingUsers(true);
                setLoadError('');

                const data = await getUsers();
                setUsers(data);
            } catch (err) {
                setLoadError(err.message || 'Failed to load accounts.');
            } finally {
                setIsLoadingUsers(false);
            }
        };

        loadUsers();
    }, []);

    useEffect(() => {
        if (!listMessage) return;

        const timer = setTimeout(() => {
            setListMessage(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [listMessage]);
    // ---------- Row editing ----------
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [showDraftPassword, setShowDraftPassword] = useState(false);

    

    // =====================================================================
    // Account form
    // =====================================================================
    const handleFieldChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (formMessage) setFormMessage(null);
    };

    const handleReset = () => {
        setForm(EMPTY_FORM);
        setShowPassword(false);
        setShowConfirm(false);
        setFormMessage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
            const values = {
            lastName: cleanName(form.lastName),
            firstName: cleanName(form.firstName),
            middleInitial: form.middleInitial.trim(),
            role: form.role,
            username: form.username.trim(),
        };

        let error = validateProfile(values, users);

        if (!error && form.password.length < MIN_PASSWORD_LENGTH) {
            error = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        }

        if (!error && form.password !== form.confirmPassword) {
            error = 'Passwords do not match.';
        }

        if (error) {
            setFormMessage({ type: 'error', text: error });
            return;
        }

        try {
            await createUser({
                last_name: values.lastName,
                first_name: values.firstName,
                middle_initial: values.middleInitial || null,
                role_id: ROLE_IDS[values.role],
                username: values.username,
                password: form.password,
            });

            const updatedUsers = await getUsers();
            setUsers(updatedUsers);

            handleReset();

            setFormMessage({
                type: 'success',
                text: `Account created for ${values.username} (${values.role}).`,
            });
        } catch (err) {
            setFormMessage({
                type: 'error',
                text: err.message || 'Failed to create account.',
            });
        }

            //   { last_name, first_name, middle_initial, role_id: ROLE_IDS[values.role], username, password }
        //     const nextId = Math.max(0, ...users.map((u) => u.user_id)) + 1;

        //     setUsers((prev) => [
        //         ...prev,
        //         {
        //             user_id: nextId,
        //             last_name: values.lastName,
        //             first_name: values.firstName,
        //             middle_initial: values.middleInitial,
        //             role: values.role,
        //             username: values.username,
        //         },
        //     ]);

        //     handleReset();
        //     setFormMessage({ type: 'success', text: `Account created for ${values.username} (${values.role}).` });
        // };
    };
    // =====================================================================
    // Row editing
    // =====================================================================
    const startEditing = (user) => {
        setEditingId(user.user_id);
        setDraft({
            lastName: user.last_name,
            firstName: user.first_name,
            middleInitial: user.middle_initial || '',
            role: user.role,
            username: user.username,
            password: '',
        });
        setShowDraftPassword(false);
        setListMessage(null);
    };

    const stopEditing = () => {
        setEditingId(null);
        setShowDraftPassword(false);
    };

    const toggleEditing = (user) => {
        if (editingId === user.user_id) {
            stopEditing(); // clicking EDIT again cancels
        } else {
            startEditing(user);
        }
    };

    const updateDraft = (field, value) => {
        setDraft((prev) => ({ ...prev, [field]: value }));
    };
    const saveRow = async (id) => {
        const values = {
            lastName: cleanName(draft.lastName),
            firstName: cleanName(draft.firstName),
            middleInitial: draft.middleInitial.trim(),
            role: draft.role,
            username: draft.username.trim(),
        };

        // Validate the edited profile.
        let error = validateProfile(values, users, id);

        // Password is optional. Leave it blank to keep the current password.
        if (!error && draft.password && draft.password.length < MIN_PASSWORD_LENGTH) {
            error = `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
        }

        if (error) {
            setListMessage({ type: 'error', text: error });
            return;
        }

        try {
            const result = await updateUser(id, {
                last_name: values.lastName,
                first_name: values.firstName,
                middle_initial: values.middleInitial || null,
                role_id: ROLE_IDS[values.role],
                username: values.username,
                ...(draft.password ? { password: draft.password } : {}),
            });

            // Reload the latest account records from PostgreSQL.
            const updatedUsers = await getUsers();
            setUsers(updatedUsers);

            setListMessage({
                type: 'success',
                text: result.message || `${values.username} saved successfully.`,
            });

            stopEditing();
        } catch (err) {
            setListMessage({
                type: 'error',
                text: err.message || 'Failed to update account.',
            });
        }
    };

    // =====================================================================
    // Search
    // =====================================================================
    const visibleUsers = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return users;

        return users.filter((u) =>
            [u.user_id, u.last_name, u.first_name, u.middle_initial, u.role, u.username]
                .join(' ')
                .toLowerCase()
                .includes(q)
        );
    }, [users, searchTerm]);

    return (
        <div className="ca-page">
            <div className="ca-top">
                {/* ---------- Logo ---------- */}
                <div className="ca-logo">
                    <img src={Logo} alt="Store logo" />
                </div>

                {/* ---------- User Account Form ---------- */}
                <section className="caf-card" aria-labelledby="caf-title">
                    <h2 className="caf-title" id="caf-title">
                        User Account Form
                    </h2>

                    <form className="caf-form" onSubmit={handleSubmit} noValidate>
                        <div className="caf-grid">
                            <div className="caf-field">
                                <label htmlFor="ca-last-name">Last Name:</label>
                                <div className="caf-input-wrap">
                                    <input
                                        id="ca-last-name"
                                        type="text"
                                        placeholder="e.g., Dela Cruz"
                                        maxLength={50}
                                        autoComplete="off"
                                        value={form.lastName}
                                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="caf-field">
                                <label htmlFor="ca-first-name">First Name:</label>
                                <div className="caf-input-wrap">
                                    <input
                                        id="ca-first-name"
                                        type="text"
                                        placeholder="e.g., Juan"
                                        maxLength={50}
                                        autoComplete="off"
                                        value={form.firstName}
                                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="caf-field">
                                <label htmlFor="ca-middle-initial">Middle Initial:</label>
                                <div className="caf-input-wrap">
                                    <input
                                        id="ca-middle-initial"
                                        type="text"
                                        placeholder="e.g., D"
                                        maxLength={1}
                                        autoComplete="off"
                                        autoCapitalize="characters"
                                        value={form.middleInitial}
                                        onChange={(e) => handleFieldChange('middleInitial', cleanInitial(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="caf-field">
                                <label htmlFor="ca-username">Username:</label>
                                <div className="caf-input-wrap">
                                    <input
                                        id="ca-username"
                                        type="text"
                                        placeholder="Enter username"
                                        maxLength={50}
                                        autoComplete="off"
                                        autoCapitalize="none"
                                        spellCheck={false}
                                        value={form.username}
                                        onChange={(e) => handleFieldChange('username', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="caf-field">
                                <label htmlFor="ca-password">Password:</label>
                                <div className="caf-input-wrap">
                                    <input
                                        id="ca-password"
                                        className="caf-has-eye"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        autoComplete="new-password"
                                        value={form.password}
                                        onChange={(e) => handleFieldChange('password', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="caf-eye"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        aria-pressed={showPassword}
                                        onClick={() => setShowPassword((prev) => !prev)}
                                    >
                                        <EyeIcon off={!showPassword} />
                                    </button>
                                </div>
                            </div>

                            <div className="caf-field">
                                <label htmlFor="ca-confirm-password">Confirm Password:</label>
                                <div className="caf-input-wrap">
                                    <input
                                        id="ca-confirm-password"
                                        className="caf-has-eye"
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="Re-enter password"
                                        autoComplete="new-password"
                                        value={form.confirmPassword}
                                        onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="caf-eye"
                                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                                        aria-pressed={showConfirm}
                                        onClick={() => setShowConfirm((prev) => !prev)}
                                    >
                                        <EyeIcon off={!showConfirm} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="caf-bottom">
                            <div className="caf-role-wrap">
                                <select
                                    aria-label="Role"
                                    value={form.role}
                                    onChange={(e) => handleFieldChange('role', e.target.value)}
                                >
                                    <option value="" disabled>
                                        Role
                                    </option>
                                    {ROLES.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                                <img src={DropdownIcon} alt="" className="caf-role-icon" />
                            </div>

                            <div className="caf-actions">
                                <button type="submit" className="caf-btn">
                                    <img src={SaveIcon} alt="" className="caf-btn-icon" />
                                    Save
                                </button>
                                <button type="button" className="caf-btn" onClick={handleReset}>
                                    <ResetIcon />
                                    Reset
                                </button>
                            </div>
                        </div>

                        <div className="caf-feedback" role="status" aria-live="polite">
                            {formMessage && (
                                <p className={`caf-message caf-message-${formMessage.type}`}>{formMessage.text}</p>
                            )}
                        </div>
                    </form>
                </section>
            </div>

            {/* ---------- Full User Account List ---------- */}
            <section className="cal-panel" aria-labelledby="cal-title">
                <div className="cal-band">
                    <div className="cal-search">
                        <input
                            ref={searchRef}
                            type="text"
                            className="cal-search-input"
                            placeholder="Search accounts..."
                            aria-label="Search accounts"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                            type="button"
                            className="cal-search-btn"
                            aria-label="Search"
                            onClick={() => searchRef.current?.focus()}
                        >
                            <img src={SearchIcon} alt="" />
                        </button>
                    </div>

                    <h2 className="cal-title" id="cal-title">
                        Full User Account List
                    </h2>
                </div>

                {/* <div className="cal-feedback" role="status" aria-live="polite">
                    {listMessage && <p className={`cal-message cal-message-${listMessage.type}`}>{listMessage.text}</p>}
                </div> */}

                <div className="cal-table" role="table" aria-label="User accounts">
                    <div className="cal-head" role="row">
                        <span role="columnheader">User_Id</span>
                        <span role="columnheader">Last_Name</span>
                        <span role="columnheader">First_Name</span>
                        <span role="columnheader">M. I.</span>
                        <span role="columnheader">Role</span>
                        <span role="columnheader">Username</span>
                        <span role="columnheader">Password</span>
                        <span
                            role="columnheader"
                            className="cal-notification-header"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {listMessage && (
                                <span className={`cal-message cal-message-${listMessage.type}`}>
                                    {listMessage.text}
                                </span>
                            )}
                        </span>
                    </div>

                    <div className="cal-body" role="rowgroup">
                        {isLoadingUsers ? (
                                <p className="cal-empty">Loading accounts...</p>
                            ) : loadError ? (
                                <p className="cal-empty">{loadError}</p>
                            ) : visibleUsers.length === 0 ? (
                                <p className="cal-empty">No accounts found.</p>
                            ) : (
                                visibleUsers.map((user) => {
                                const isEditing = editingId === user.user_id;
                                const isSelf = user.username === currentUsername;
                                const fullName = `${user.first_name} ${user.last_name}`;

                                return (
                                    <div
                                        className={`cal-row${isEditing ? ' cal-row-editing' : ''}`}
                                        role="row"
                                        key={user.user_id}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape' && isEditing) stopEditing();
                                        }}
                                    >
                                        <span className="cal-cell" role="cell" data-label="User ID">
                                            {user.user_id}
                                        </span>

                                        <span className="cal-cell" role="cell" data-label="Last name">
                                            {isEditing ? (
                                                <input
                                                    className="cal-edit-input"
                                                    type="text"
                                                    maxLength={50}
                                                    aria-label={`Last name of ${fullName}`}
                                                    value={draft.lastName}
                                                    onChange={(e) => updateDraft('lastName', e.target.value)}
                                                />
                                            ) : (
                                                user.last_name
                                            )}
                                        </span>

                                        <span className="cal-cell" role="cell" data-label="First name">
                                            {isEditing ? (
                                                <input
                                                    className="cal-edit-input"
                                                    type="text"
                                                    maxLength={50}
                                                    aria-label={`First name of ${fullName}`}
                                                    value={draft.firstName}
                                                    onChange={(e) => updateDraft('firstName', e.target.value)}
                                                />
                                            ) : (
                                                user.first_name
                                            )}
                                        </span>

                                        <span className="cal-cell" role="cell" data-label="M. I.">
                                            {isEditing ? (
                                                <input
                                                    className="cal-edit-input cal-edit-initial"
                                                    type="text"
                                                    maxLength={1}
                                                    aria-label={`Middle initial of ${fullName}`}
                                                    value={draft.middleInitial}
                                                    onChange={(e) => updateDraft('middleInitial', cleanInitial(e.target.value))}
                                                />
                                            ) : (
                                                user.middle_initial || '—'
                                            )}
                                        </span>

                                        <span className="cal-cell" role="cell" data-label="Role">
                                            {isEditing ? (
                                                <span className="cal-select-wrap">
                                                    <select
                                                        aria-label={`Role of ${fullName}`}
                                                        value={draft.role}
                                                        disabled={isSelf}
                                                        title={isSelf ? "You can't change your own role" : undefined}
                                                        onChange={(e) => updateDraft('role', e.target.value)}
                                                    >
                                                        {ROLES.map((role) => (
                                                            <option key={role} value={role}>
                                                                {role}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <img src={DropdownIcon} alt="" className="cal-select-icon" />
                                                </span>
                                            ) : (
                                                user.role
                                            )}
                                        </span>

                                        <span className="cal-cell" role="cell" data-label="Username">
                                            {isEditing ? (
                                                <input
                                                    className="cal-edit-input"
                                                    type="text"
                                                    maxLength={50}
                                                    autoComplete="off"
                                                    autoCapitalize="none"
                                                    spellCheck={false}
                                                    aria-label={`Username of ${fullName}`}
                                                    value={draft.username}
                                                    onChange={(e) => updateDraft('username', e.target.value)}
                                                />
                                            ) : (
                                                user.username
                                            )}
                                        </span>

                                        <span className="cal-cell cal-cell-password" role="cell" data-label="Password">
                                            {isEditing ? (
                                                <input
                                                    className="cal-edit-input"
                                                    type={showDraftPassword ? 'text' : 'password'}
                                                    placeholder="New password (optional)"
                                                    autoComplete="new-password"
                                                    aria-label={`New password for ${fullName}`}
                                                    value={draft.password}
                                                    onChange={(e) => updateDraft('password', e.target.value)}
                                                />
                                            ) : (
                                                <span className="cal-dots" aria-label="Password is hidden">
                                                    ••••••••
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                className="cal-eye"
                                                disabled={!isEditing}
                                                aria-pressed={isEditing && showDraftPassword}
                                                aria-label={showDraftPassword ? 'Hide new password' : 'Show new password'}
                                                title={
                                                    isEditing
                                                        ? undefined
                                                        : "Passwords are stored securely and can't be shown. Click EDIT to set a new one."
                                                }
                                                onClick={() => setShowDraftPassword((prev) => !prev)}
                                            >
                                                <EyeIcon off={!(isEditing && showDraftPassword)} />
                                            </button>
                                        </span>

                                        <span className="cal-cell cal-cell-actions" role="cell" data-label="Action">
                                            <button
                                                type="button"
                                                className="cal-btn cal-btn-edit"
                                                aria-pressed={isEditing}
                                                onClick={() => toggleEditing(user)}
                                            >
                                                <img src={EditIcon} alt="" />
                                                EDIT
                                            </button>
                                            <button
                                                type="button"
                                                className="cal-btn cal-btn-save"
                                                aria-label={`Save changes for ${fullName}`}
                                                disabled={!isEditing}
                                                onClick={() => saveRow(user.user_id)}
                                            >
                                                <img src={SaveIcon} alt="" />
                                            </button>
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default CreateAccount;