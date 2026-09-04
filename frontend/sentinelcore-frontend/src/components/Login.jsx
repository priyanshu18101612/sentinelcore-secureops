import { useState } from "react"
import "./Login.css"

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const showMessage = (text, type) => {
    setMessage(text)
    setMessageType(type)
  }

  // =========================
  // DEMO CREDENTIALS QUICK-FILL
  // =========================
  const handleQuickDemo = () => {
    const demoEmail = "alex.vance@sentinelcore.io"
    const demoPassword = "Password@123"
    setEmail(demoEmail)
    setPassword(demoPassword)

    // Ensure demo account exists in localStorage for immediate seamless login
    const users = JSON.parse(
      localStorage.getItem("sentinelcore_users") || "[]"
    )
    const existingUser = users.find(
      (user) => user.email.toLowerCase() === demoEmail.toLowerCase()
    )

    if (!existingUser) {
      const demoUser = {
        id: 1001,
        name: "Alex Vance",
        email: demoEmail,
        password: demoPassword,
        role: "Lead SecOps Engineer",
      }
      users.push(demoUser)
      localStorage.setItem("sentinelcore_users", JSON.stringify(users))
    }

    showMessage("Demo SecOps credentials filled. Click 'Sign In to Console' to proceed.", "success")
  }

  // =========================
  // REGISTER
  // =========================
  const handleRegister = (e) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      showMessage("Please enter your full name.", "error")
      return
    }

    if (password.length < 6) {
      showMessage("Password must contain at least 6 characters.", "error")
      return
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.", "error")
      return
    }

    const users = JSON.parse(
      localStorage.getItem("sentinelcore_users") || "[]"
    )

    const existingUser = users.find(
      (user) => user.email === trimmedEmail
    )

    if (existingUser) {
      showMessage("An account with this email already exists.", "error")
      return
    }

    const newUser = {
      id: Date.now(),
      name: trimmedName,
      email: trimmedEmail,
      password: password,
      role: "SecOps Analyst",
    }

    users.push(newUser)

    localStorage.setItem(
      "sentinelcore_users",
      JSON.stringify(users)
    )

    // Automatically log the newly created user in
    localStorage.setItem(
      "sentinelcore_current_user",
      JSON.stringify(newUser)
    )

    showMessage("Account created successfully. Authenticating...", "success")

    setTimeout(() => {
      if (onLogin) {
        onLogin()
      }
    }, 500)
  }

  // =========================
  // LOGIN
  // =========================
  const handleLogin = (e) => {
    e.preventDefault()

    const trimmedEmail = email.trim().toLowerCase()

    const users = JSON.parse(
      localStorage.getItem("sentinelcore_users") || "[]"
    )

    const user = users.find(
      (item) =>
        item.email === trimmedEmail &&
        item.password === password
    )

    if (!user) {
      showMessage("Invalid email or password. Check credentials or use the demo account below.", "error")
      return
    }

    // Save currently logged-in user
    localStorage.setItem(
      "sentinelcore_current_user",
      JSON.stringify(user)
    )

    showMessage("Authentication successful. Opening SecureOps Console...", "success")

    setTimeout(() => {
      if (onLogin) {
        onLogin()
      }
    }, 400)
  }

  // =========================
  // SWITCH LOGIN / REGISTER
  // =========================
  const switchMode = () => {
    setIsRegistering(!isRegistering)
    setName("")
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setMessage("")
    setMessageType("")
  }

  return (
    <div className="login-page">
      {/* Ambient background lighting and grid overlay */}
      <div className="login-background">
        <div className="login-glow login-glow-one"></div>
        <div className="login-glow login-glow-two"></div>
        <div className="login-glow login-glow-center"></div>
        <div className="login-grid"></div>
      </div>

      <div className="login-container">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-logo" aria-label="SentinelCore Logo">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <h1>SentinelCore</h1>
          <span>SECUREOPS PLATFORM</span>
        </div>

        {/* Login / Register Card */}
        <div className="login-card">
          <div className="login-header">
            <div className="login-eyebrow">
              <span className="login-status-dot"></span>
              {isRegistering ? "CREATE OPERATOR ACCOUNT" : "SECURE INFRASTRUCTURE ACCESS"}
            </div>

            <h2>{isRegistering ? "Create your account" : "Welcome back"}</h2>

            <p className="login-description">
              {isRegistering
                ? "Provision your SentinelCore identity to monitor, analyze, and secure enterprise infrastructure."
                : "Sign in with your enterprise credentials to access the SecOps Command Center."}
            </p>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`login-message ${
                messageType === "error" ? "login-error" : "login-success"
              }`}
            >
              {messageType === "error" ? (
                <svg className="login-message-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="login-message-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="login-form">
            {/* Full Name - Register Only */}
            {isRegistering && (
              <div className="login-field">
                <label htmlFor="name">Full Name</label>
                <div className="login-input-wrapper">
                  <svg className="login-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Alex Vance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="login-field">
              <label htmlFor="email">Work Email Address</label>
              <div className="login-input-wrapper">
                <svg className="login-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="operator@sentinelcore.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrapper has-toggle">
                <svg className="login-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isRegistering ? "Create strong password (min. 6 chars)" : "Enter account password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegistering ? "new-password" : "current-password"}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {isRegistering && (
                <span className="password-hint">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Use at least 6 characters with mixed characters.
                </span>
              )}
            </div>

            {/* Confirm Password - Register Only */}
            {isRegistering && (
              <div className="login-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="login-input-wrapper has-toggle">
                  <svg className="login-input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Login Options (Remember Me & Forgot Password) */}
            {!isRegistering && (
              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep me signed in</span>
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    showMessage(
                      "Self-service password reset is handled via your enterprise Identity Provider (SSO/IdP).",
                      "success"
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button type="submit" className="login-button">
              <span>{isRegistering ? "Create Operator Account" : "Sign In to Console"}</span>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            {/* Quick Demo Helper (for rapid review/testing) */}
            {!isRegistering && (
              <button
                type="button"
                className="demo-account-btn"
                onClick={handleQuickDemo}
                title="Fill demo credentials for instant testing"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Fill Demo Operator Credentials</span>
              </button>
            )}
          </form>

          {/* Switch Mode */}
          <div className="login-switch">
            <span>{isRegistering ? "Already have an account?" : "Need an operator account?"}</span>
            <button type="button" onClick={switchMode}>
              {isRegistering ? "Sign in to existing account" : "Create new account"}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="login-trust-badges">
            <span className="trust-badge-item">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              SOC 2 Type II
            </span>
            <span className="trust-badge-item">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              TLS 1.3 / E2E Encrypted
            </span>
            <span className="trust-badge-item">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Zero-Trust Auth
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="login-copyright">
          © 2026 SentinelCore SecureOps Inc. Enterprise Infrastructure Security.
        </p>
      </div>
    </div>
  )
}

export default Login