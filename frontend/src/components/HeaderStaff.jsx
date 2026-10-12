import dashIcon from '../assets/dashboard-icon.png';
import recordsIcon from '../assets/report-icon.png';
import inventoryIcon from '../assets/inventory-icon.png';
import productIcon from '../assets/product-icon.png';
import deliveryIcon from '../assets/delivery-icon.png';

import userAvatar from '../assets/user2.jpg';
import menuIcon from '../assets/menu-icon.png';

import './components-css/headerstaff.css';

import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link');

function HeaderStaff() {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');

        navigate('/login', { replace: true });
    };

    return (
        <header className="header-container">
            <nav className="nav-menu">
                <NavLink to="/staff" end className={linkClass}>
                    Dashboard <img src={dashIcon} alt="" className="nav-icon" />
                </NavLink>
                <NavLink to="/staff/records" className={linkClass}>
                    Records <img src={recordsIcon} alt="" className="nav-icon" />
                </NavLink>
                <NavLink to="/staff/inventory" className={linkClass}>
                    Inventory <img src={inventoryIcon} alt="" className="nav-icon" />
                </NavLink>
                <NavLink to="/staff/product" className={linkClass}>
                    Product <img src={productIcon} alt="" className="nav-icon" />
                </NavLink>
                <NavLink to="/staff/delivery" className={linkClass}>
                    Delivery <img src={deliveryIcon} alt="" className="nav-icon" />
                </NavLink>
            </nav>

            <div className="user-profile">
                <img src={userAvatar} alt="User Avatar" className="avatar" />
                <div className="welcome-text">
                    <span>Welcome,</span>
                    <br />
                    <span>{localStorage.getItem('username') || 'User'}</span>
                </div>

                <div className="menu-container">
                    <button
                        className="menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <img src={menuIcon} alt="Menu" className="menu-icon" />
                    </button>

                    {isMenuOpen && (
                        <div className="dropdown-popup">
                            <button className="logout-btn" onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default HeaderStaff;