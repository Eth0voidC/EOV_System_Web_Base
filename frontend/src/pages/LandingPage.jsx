import { useNavigate } from 'react-router-dom';
import { FaGithub } from 'react-icons/fa';
import './LandingPage.css';
import DashboardPreview from '../assets/dashboard-preview.jpg';
import Cblogo from '../assets/cb-sislogo.png';

function LandingPage() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const handleGetStarted = () => {
        navigate('/login');
    };

    const scrollToSection = (sectionId) => {
        document.getElementById(sectionId)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    return (
        <main className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <a
                    href="#home"
                    className="landing-brand"
                    aria-label="CB-SIS System home"
                    onClick={(event) => {
                        event.preventDefault();
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth',
                        });
                    }}
                >
                    <img
                        src={Cblogo}
                        alt="EOV logo"
                        className="login-header-logo"
                    />
                    <span className="brand-name">
                        CB-SIS <span>System</span>
                    </span>
                </a>

                {/* Header Navigation */}
                <nav
                    className="landing-nav"
                    aria-label="Main navigation"
                >
                    <button
                        type="button"
                        onClick={() => scrollToSection('about')}
                    >
                        About Us
                    </button>

                    <button
                        type="button"
                        onClick={() => scrollToSection('contact')}
                    >
                        Contact Us
                    </button>
                </nav>

                <button
                    type="button"
                    className="landing-login-button"
                    onClick={handleGetStarted}
                >
                    Get Started
                </button>
            </header>

            {/* Hero Section */}
            <section className="landing-hero" id="home">
                <div className="hero-content">
                    <span className="hero-label">
                        EMPLOYEE &amp; INVENTORY MANAGEMENT
                    </span>

                    <h1>
                        Credit-Based
                        <br />
                        Sales and Inventory System
                        <br />
                        <span>CB-SIS System.</span>
                    </h1>

                    <p>
                        Manage employee purchases, monitor inventory, and
                        organize store records through one centralized system.
                    </p>

                    <button
                        type="button"
                        className="hero-cta"
                        onClick={handleGetStarted}
                    >
                        Get Started
                        <span aria-hidden="true">→</span>
                    </button>

                    <div className="hero-note">
                        <span className="status-dot" />
                        A centralized system for everyday store operations
                    </div>
                </div>

                {/* Dashboard Preview */}
                <div className="hero-visual">
                    <div className="dashboard-window image-preview">
                        <img
                            src={DashboardPreview}
                            alt="EOV System dashboard preview"
                            className="dashboard-preview-image"
                        />
                    </div>

                    <div className="visual-decoration decoration-one" />
                    <div className="visual-decoration decoration-two" />
                </div>
            </section>

            {/* About the System */}
            <section
                className="landing-about"
                id="about"
                aria-labelledby="about-heading"
            >
                <div className="landing-about-content">
                    <span className="hero-label">ABOUT THE SYSTEM</span>

                    <h2 id="about-heading">
                        One System for Everyday Store Operations
                    </h2>

                    <p>
                        The Credit-Based Sales and Inventory System for the EOV Sari-Sari Store helps the store personnel record employee-obtained items more easily, keep track of employee balances, manage inventory, monitor product deliveries, and prepare total credit reports whenever needed.
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section
                className="landing-features"
                id="features"
                aria-labelledby="features-heading"
            >
                <div className="features-heading">
                    <span>BUILT FOR STORE OPERATIONS</span>

                    <h2 id="features-heading">
                        Everything organized in one place.
                    </h2>

                    <p>
                        Designed to help simplify the daily work of managing
                        employee purchases and store inventory.
                    </p>
                </div>

                <div className="features-grid">
                    <article className="feature-card">
                        <div className="feature-icon blue">▦</div>
                        <h3>Credit-Based Purchasing</h3>
                        <p>
                            Keep employee credit purchases organized for
                            accurate recordkeeping.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon green">⇄</div>
                        <h3>Employee Purchase Monitoring</h3>
                        <p>
                            Maintain employee purchase records and track
                            transaction details.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon purple">▤</div>
                        <h3>Inventory Management</h3>
                        <p>
                            Organize product information and monitor available
                            stock.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon blue">₱</div>
                        <h3>Deduction Reports</h3>
                        <p>
                            Organize purchase deduction records for payroll
                            period reporting.
                        </p>
                    </article>

                    <article className="feature-card">
                        <div className="feature-icon green">◷</div>
                        <h3>Transaction History</h3>
                        <p>
                            Review recorded employee purchases and previous
                            transactions.
                        </p>
                    </article>
                </div>
            </section>

            {/* Contact Us */}
            <section
                className="landing-contact"
                id="contact"
                aria-labelledby="contact-heading"
            >
                <div className="landing-contact-content">
                    <span className="hero-label">GET IN TOUCH</span>

                    <h2 id="contact-heading">Contact Us</h2>

                    <p>
                        For inquiries about the EOV Store Management System,
                        use the contact details below.
                    </p>

                    <div className="contact-details">
                        <div className="contact-item">
                            <span className="contact-item-label">
                                Store Owner
                            </span>
                            <p>Evelyn Ordoñez Villanueva</p>
                        </div>

                        <div className="contact-item">
                            <span className="contact-item-label">
                                Email Address
                            </span>
                            <p>Not specified (Contact via Messenger)</p>
                        </div>

                        <div className="contact-item">
                            <span className="contact-item-label">
                                Location
                            </span>
                            <p>ERV Electrical Construction Corp, Buenavista, Santa Maria, Bulacan</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-main">
                    {/* System Summary */}
                    <div className="footer-column footer-about">
                        <a
                            href="#home"
                            className="landing-brand"
                            onClick={(event) => {
                                event.preventDefault();
                                window.scrollTo({
                                    top: 0,
                                    behavior: 'smooth',
                                });
                            }}
                        >
                            <img
                                src={Cblogo}
                                alt="CB-SIS logo"
                                className="login-header-logo"
                            />
                            <span className="brand-name">
                                CB-SIS <span>System</span>
                            </span>
                        </a>

                        <p>
                            The Credit-Based Sales and Inventory System helps manage employee purchases,
                            monitor inventory, and organize deduction records.
                        </p>
                    </div>

                    {/* Quick Navigation */}
                    <div className="footer-column">
                        <h3>Quick Navigation</h3>

                        <ul className="footer-links">
                            <li>
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('about')}
                                >
                                    About the System
                                </button>
                            </li>

                            <li>
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('features')}
                                >
                                    Features
                                </button>
                            </li>

                            <li>
                                <button
                                    type="button"
                                    onClick={() => scrollToSection('contact')}
                                >
                                    Contact Us
                                </button>
                            </li>

                            <li>
                                <button
                                    type="button"
                                    onClick={handleGetStarted}
                                >
                                    Get Started / Login
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Features List */}
                    <div className="footer-column">
                        <h3>Features</h3>

                        <ul className="footer-feature-list">
                            <li>Credit-Based Purchasing</li>
                            <li>Employee Purchase Monitoring</li>
                            <li>Inventory Management</li>
                            <li>Deduction Reports</li>
                            <li>Transaction History and Reports</li>
                        </ul>
                    </div>

                    {/* Contact and Developer */}
                    <div className="footer-column">
                        <h3>Contact Us</h3>

                        <ul className="footer-contact-list">
                            <li>
                                <span>Store Owner</span>
                                <p>Evelyn Ordoñez Villanueva</p>
                            </li>

                            <li>
                                <span>Email</span>
                                <p>Not specified</p>
                            </li>

                            <li>
                                <span>Location</span>
                                <p>Buenavista, Santa Maria, Bulacan</p>
                            </li>
                        </ul>

                        <h3 className="footer-developer-heading">
                            Developers
                        </h3>
                        <p>
                            <a
                                className="footer-developer-link"
                                href="https://github.com/Eth0voidC"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span>Romnick James Bargo</span>
                                <FaGithub size={15} aria-hidden="true" />
                            </a>
                        </p>

                        <p>
                            <a
                                className="footer-developer-link"
                                href="https://github.com/Cryptic7505"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span>Marcos, Ralph Geoffery S.</span>
                                <FaGithub size={15} aria-hidden="true" />
                            </a>
                        </p>

                        <p>
                            <a
                                className="footer-developer-link"
                                href=""
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span>Reyes, Ace Dave D.</span>
                                <FaGithub size={15} aria-hidden="true" />
                            </a>
                        </p>

                        <p>
                            <a
                                className="footer-developer-link"
                                href=""
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span>Sta. Rosa, Aerosh Yezel F.</span>
                                <FaGithub size={15} aria-hidden="true" />
                            </a>
                        </p>                        
                    </div>
                </div>

                {/* Copyright */}
                <div className="footer-bottom">
                    <p>
                        &copy; {currentYear} EOV System. All rights reserved.
                    </p>

                    <p>
                        Credit-Based Sales and Inventory System
                    </p>
                </div>
            </footer>
        </main>
    );
}

export default LandingPage;