import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import dash2Icon from '../../assets/dashboard2-icon.png';
import reportIcon from '../../assets/report-icon.png';
import inventory2Icon from '../../assets/inventory2-icon.png';
import switchmodeIcon from '../../assets/switchmode-icon.png';
import arrowIcon from '../../assets/arrow-right.png';
import userAvatar from '../../assets/user1-icon.jpg';
import menuIcon from '../../assets/menu-icon.png';
import dropdownIcon from '../../assets/dropdown-icon.png';
import customerIcon from '../../assets/customer-icon.png';
import iventoryIcon from '../../assets/inventory-icon.png';
import deliveryIcon from '../../assets/delivery-icon.png';

import '../components-css/sidebaradmin.css';

const REPORTS_LINKS = [
    { label: 'Delivery History', path: '/admin/reports/delivery-history' },
    { label: 'Transaction History', path: '/admin/reports/transaction-history' },
    { label: 'Deduction Processing', path: '/admin/reports/deduction-processing' },
    { label: 'Logs', path: '/admin/reports/logs' },
];

const CUSTOMER_LINKS = [
    { label: 'Register Customer', path: '/admin/customer/register' },
    { label: 'Create Account', path: '/admin/customer/create-account' },
];

function SidebarAdmin() {
    const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);
    const [openSection, setOpenSection] = useState(null); // 'reports' | 'customer' | null
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const navigate = useNavigate();
    const [rotateClockwise, setRotateClockwise] = useState(true);
    const [isStaffMode, setIsStaffMode] = useState(false);

    const toggleSection = (section) => {
        if (collapsed) {
            setCollapsed(false);
        }
        setOpenSection((prev) => (prev === section ? null : section));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        navigate('/', { replace: true });
    };

    return (
        <div className={`sidebar-admin${collapsed ? ' sidebar-collapsed' : ''}`}>
            <div className="sidebar-top">
                <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={() => setCollapsed((prev) => !prev)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <img src={menuIcon} alt="" />
                </button>

                {!collapsed && (
                    <button
                        type="button"
                        className="sidebar-collapse-arrow"
                        onClick={() => setCollapsed(true)}
                        aria-label="Collapse sidebar"
                    >
                        <img src={arrowIcon} alt="" className="arrow-flip" />
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/admin/dashboard" className="sidebar-item">
                    <img src={dash2Icon} alt="" className="sidebar-icon" />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>

                <NavLink to="/admin/inventory" className="sidebar-item">
                    <img src={inventory2Icon} alt="" className="sidebar-icon" />
                    {!collapsed && <span>Inventory</span>}
                </NavLink>

                {isStaffMode && (
                    <>
                        <NavLink to="/admin/product" className="sidebar-item">
                            <img
                                src={iventoryIcon}
                                alt=""
                                className="sidebar-icon"
                            />
                            {!collapsed && <span>Product</span>}
                        </NavLink>

                        <NavLink to="/admin/delivery" className="sidebar-item">
                            <img
                                src={deliveryIcon}
                                alt=""
                                className="sidebar-icon"
                            />
                            {!collapsed && <span>Delivery</span>}
                        </NavLink>
                    </>
                )}

                <div className="sidebar-section">
                    <button
                        type="button"
                        className="sidebar-item sidebar-section-toggle"
                        onClick={() => toggleSection('reports')}
                    >
                        <img src={reportIcon} alt="" className="sidebar-icon" />
                        {!collapsed && (
                            <>
                                <span>Reports</span>
                                <img
                                    src={dropdownIcon}
                                    alt=""
                                    className={`dropdown-caret${openSection === 'reports' ? ' caret-open' : ''}`}
                                />
                            </>
                        )}
                    </button>

                    {!collapsed && openSection === 'reports' && (
                        <div className="sidebar-submenu">
                            {REPORTS_LINKS.map((link) => (
                                <NavLink key={link.path} to={link.path} className="sidebar-subitem">
                                    {link.label}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>

                <div className="sidebar-section">
                    <button
                        type="button"
                        className="sidebar-item sidebar-section-toggle"
                        onClick={() => toggleSection('customer')}
                    >
                        <img src={customerIcon} alt="" className="sidebar-icon" />
                        {!collapsed && (
                            <>
                                <span>Customer / Account</span>
                                <img
                                    src={dropdownIcon}
                                    alt=""
                                    className={`dropdown-caret${openSection === 'customer' ? ' caret-open' : ''}`}
                                />
                            </>
                        )}
                    </button>

                    {!collapsed && openSection === 'customer' && (
                        <div className="sidebar-submenu">
                            {CUSTOMER_LINKS.map((link) => (
                                <NavLink key={link.path} to={link.path} className="sidebar-subitem">
                                    {link.label}
                                </NavLink>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            <div className="sidebar-bottom">
                <button
                    type="button"
                    className="sidebar-item"
                    onClick={() => {
                        setIsStaffMode(prev => !prev);
                        setRotateClockwise(prev => !prev);
                    }}
                >
                    <img
                        src={switchmodeIcon}
                        alt=""
                        className={`sidebar-icon switchmode-icon ${
                            rotateClockwise ? 'rotate-clockwise' : 'rotate-counterclockwise'
                        }`}
                    />
                    {!collapsed && <span>Switch Mode</span>}
                </button>

                <div className="sidebar-user-wrapper">
                    <button
                        type="button"
                        className="sidebar-item sidebar-user"
                        onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    >
                        <img src={userAvatar} alt="" className="sidebar-avatar" />
                        {!collapsed && <span>{localStorage.getItem('username') || 'Username'}</span>}
                    </button>

                    {isUserMenuOpen && (
                        <div className="sidebar-user-popup">
                            <button className="sidebar-logout-btn" onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SidebarAdmin;