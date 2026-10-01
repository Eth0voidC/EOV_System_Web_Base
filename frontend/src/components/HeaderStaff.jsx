import dashIcon from '../assets/dashboard-icon.png';
import recordsIcon from '../assets/report-icon.png';
import inventoryIcon from '../assets/inventory-icon.png';
import productIcon from '../assets/product-icon.png';
import deliveryIcon from '../assets/delivery-icon.png';

import userAvatar from '../assets/user1-icon.jpg';
import menuIcon from '../assets/menu-icon.png';

import './components-css/headerstaff.css';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HeaderStaff() {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        
        navigate('/');
    };

    return (
        <header className="header-container">
            <nav className="nav-menu">
                <a href="#" className="nav-link">
                    Dashboard <img src={dashIcon} alt="" className="nav-icon" />
                </a>
                <a href="#" className="nav-link">
                    Records <img src={recordsIcon} alt="" className="nav-icon" />
                </a>
                <a href="#" className="nav-link">
                    Inventory <img src={inventoryIcon} alt="" className="nav-icon" />
                </a>
                <a href="#" className="nav-link">
                    Product <img src={productIcon} alt="" className="nav-icon" />
                </a>
                <a href="#" className="nav-link">
                    Delivery <img src={deliveryIcon} alt="" className="nav-icon" />
                </a>
            </nav>

            <div className="user-profile">
                <img src={userAvatar} alt="User Avatar" className="avatar" />
                <div className="welcome-text">
                    <span>Welcome,</span>
                    <br />
                    <span>User</span>
                </div>
                
                {/* 4. Wrap the button and dropdown in a relative container */}

                <div className="menu-container">
                    <button 
                        className="menu-btn" 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <img src={menuIcon} alt="Menu" className="menu-icon" />
                    </button>

                    {/* 5. Conditionally render the popup if isMenuOpen is true */}
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