import dashIcon from '../assets/dashboard-icon.png';
import recordsIcon from '../assets/report-icon.png';
import inventoryIcon from '../assets/inventory-icon.png';
import productIcon from '../assets/product-icon.png';
import deliveryIcon from '../assets/delivery-icon.png';

import userAvatar from '../assets/user1-icon.jpg';
import menuIcon from '../assets/menu-icon.png';

import './components-css/headerstaff.css';

function HeaderStaff(){
    return(
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
                <button className="menu-btn">
                    <img src={menuIcon} alt="Menu" className="menu-icon" />
                </button>
            </div>
        </header>
    );
}

export default HeaderStaff;