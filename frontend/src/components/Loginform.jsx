import userIcon from '../assets/user-icon.png';
import lockIcon from '../assets/lock-icon.png';
import Logo from '../assets/logos.jpg';
import Cblogo from'../assets/cb-sislogo.png';
import Background from '../assets/background.jpg';
import "./components-css/loginform.css";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth';

function Loginform() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loginStatus, setLoginStatus] = useState('LOGIN');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (username.trim() === '' && password.trim() === '') {
            setErrorMessage('Please input your username and password.');
            setHasError(true);
            return;
        }

        if (username.trim() === '' || password.trim() === '') {
            setErrorMessage('Please fill all fields.');
            setHasError(true);
            return;
        }

        const usernameInvalid = /[^a-zA-Z0-9.]/.test(username);

        if (usernameInvalid) {
            setErrorMessage('Invalid input.');
            setHasError(true);
            setUsername('');
            setPassword('');
            return;
        }

        setIsLoading(true);
        setLoginStatus('AUTHENTICATING...');

        try {
            // Short pause before sending the login request
            await new Promise(resolve => setTimeout(resolve, 600));

            setLoginStatus('VERIFYING ACCOUNT...');

            const data = await loginUser(username, password);

            setLoginStatus('LOGGING IN...');

            await new Promise(resolve => setTimeout(resolve, 800));

            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', data.username);

            if (data.role === 'Admin') {
                navigate('/admin');
            } else if (data.role === 'Staff') {
                navigate('/staff');
            } else {
                setErrorMessage('Your account role is not recognized.');
                setHasError(true);

                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Invalid username or password.');
            setHasError(true);
            setUsername('');
            setPassword('');
        } finally {
            setIsLoading(false);
            setLoginStatus('LOGIN');
        }
    };

    const handleInputChange = (setter, value) => {
        setter(value);
        if (hasError) {
            setHasError(false);
            setErrorMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            handleLogin();
        }
    };

    return (
        <div className="login-page"
        style={{ backgroundImage: `url(${Background})` }}>
        <div className="form-card-container">

                <button
                    type="button"
                    className="back-landing-button"
                    onClick={() => navigate('/')}
                    aria-label="Back to landing page"
                >
                    <span aria-hidden="true"><h1>←</h1></span>
                    Back to Home
                </button>

            <div className="logo-section">
                <img src={Logo} alt="store logo" className="Logo" />
            </div>

            <div className="form-section">

                <img src={Cblogo} alt="EOV logo" className="login-header-logo" />

                <h1>Welcome Back!</h1>
                <h2>Log in to your CB-SIS System Account </h2>

                <div className="form-inputs">
                    <div className="input-wrapper">
                        <img src={userIcon} alt="user icon" className="input-icon" />
                        <input
                            type="text"
                            placeholder={hasError ? "* Username" : "Enter your username"}
                            value={username}
                            onChange={(e) => handleInputChange(setUsername, e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={hasError ? "input-error" : ""}
                        />
                    </div>

                    <div className="input-wrapper">
                        <img src={lockIcon} alt="lock icon" className="input-icon" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder={hasError ? "* Password" : "Enter your password"}
                            value={password}
                            onChange={(e) => handleInputChange(setPassword, e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={hasError ? "input-error" : ""}
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword((prev) => !prev)}
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.6 18.6 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                <button
                    className="login-button"
                    onClick={handleLogin}
                    disabled={isLoading}
                >
                    {loginStatus}
                </button>

                {errorMessage && (
                    <p className="error-text">{errorMessage}</p>
                )}
            </div>
        </div>
        </div>
    );
}

export default Loginform;