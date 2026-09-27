import userIcon from '../assets/user-icon.png';
import lockIcon from '../assets/lock-icon.png';
import Logo from '../assets/store-logo.jpg';
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
    const [showPassword, setShowPassword] = useState(false); // NEW
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (username.trim() === '' && password.trim() === '') {
            setErrorMessage('please input your username and password');
            setHasError(true);
            return;
        }

        if (username.trim() === '' || password.trim() === '') {
            setErrorMessage('please fill all form');
            setHasError(true);
            return;
        }

        const usernameInvalid = /[^a-zA-Z0-9.]/.test(username);
        const passwordInvalid = /[^a-zA-Z0-9]/.test(password);
        if (usernameInvalid || passwordInvalid) {
            setErrorMessage('invalid input');
            setHasError(true);
            setUsername('');
            setPassword('');
            return;
        }

        setIsLoading(true);
        try {
            const data = await loginUser(username, password);

            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', data.username);

            if (data.role === 'Admin') {
                navigate('/admin');
            } else if (data.role === 'Staff') {
                navigate('/staff');
            }
        } catch (err) {
            setErrorMessage(err.message || 'invalid username or password');
            setHasError(true);
            setUsername('');
            setPassword('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (setter, value) => {
        setter(value);
        if (hasError) {
            setHasError(false);
            setErrorMessage('');
        }
    };

    return (
        <div className="form-card-container">
            <div className="logo-section">
                <img src={Logo} alt="store logo" className="Logo" />
            </div>

            <div className="form-section">
                <h1>Welcome Back!</h1>

                <div className="form-inputs">
                    <div className="input-wrapper">
                        <img src={userIcon} alt="user icon" className="input-icon" />
                        <input
                            type="text"
                            placeholder={hasError ? "* Username" : "Enter your username"}
                            value={username}
                            onChange={(e) => handleInputChange(setUsername, e.target.value)}
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

                <button className="login-button" onClick={handleLogin} disabled={isLoading}>
                    {isLoading ? 'LOGGING IN...' : 'LOGIN'}
                </button>

                {errorMessage && (
                    <p className="error-text">{errorMessage}</p>
                )}
            </div>
        </div>
    );
}

export default Loginform;