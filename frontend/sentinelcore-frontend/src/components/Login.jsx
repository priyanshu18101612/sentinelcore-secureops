import { useState } from "react"

function Login({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const showMessage = (text, type) => {
    setMessage(text)
    setMessageType(type)
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
      showMessage(
        "Password must contain at least 6 characters.",
        "error"
      )
      return
    }

    if (password !== confirmPassword) {
      showMessage(
        "Passwords do not match.",
        "error"
      )
      return
    }

    const users = JSON.parse(
      localStorage.getItem("sentinelcore_users") || "[]"
    )

    const existingUser = users.find(
      (user) => user.email === trimmedEmail
    )

    if (existingUser) {
      showMessage(
        "An account with this email already exists.",
        "error"
      )
      return
    }

    const newUser = {
      id: Date.now(),
      name: trimmedName,
      email: trimmedEmail,
      password: password,
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

    showMessage(
      "Account created successfully.",
      "success"
    )

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
      showMessage(
        "Invalid email or password.",
        "error"
      )
      return
    }

    // Save currently logged-in user
    localStorage.setItem(
      "sentinelcore_current_user",
      JSON.stringify(user)
    )

    showMessage(
      "Login successful. Welcome back!",
      "success"
    )

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

      {/* Background effects */}
      <div className="login-background">
        <div className="login-glow login-glow-one"></div>
        <div className="login-glow login-glow-two"></div>
        <div className="login-grid"></div>
      </div>

      <div className="login-container">

        {/* Brand */}
        <div className="login-brand">

          <div className="login-logo">
            S
          </div>

          <h1>SentinelCore</h1>

          <span>SECUREOPS</span>

        </div>

        {/* Login / Register card */}
        <div className="login-card">

          <div className="login-header">

            <p className="login-eyebrow">
              {isRegistering
                ? "CREATE ACCOUNT"
                : "SECURE ACCESS"}
            </p>

            <h2>
              {isRegistering
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <p className="login-description">
              {isRegistering
                ? "Create your SentinelCore account to monitor and secure your infrastructure."
                : "Sign in to access your infrastructure monitoring dashboard."}
            </p>

          </div>

          {/* Message */}
          {message && (
            <div
              className={`login-message ${
                messageType === "error"
                  ? "login-error"
                  : "login-success"
              }`}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={
              isRegistering
                ? handleRegister
                : handleLogin
            }
            className="login-form"
          >

            {/* Name - Register only */}
            {isRegistering && (
              <div className="login-field">

                <label htmlFor="name">
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  autoComplete="name"
                  required
                />

              </div>
            )}

            {/* Email */}
            <div className="login-field">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
                required
              />

            </div>

            {/* Password */}
            <div className="login-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="password-input-wrapper">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete={
                    isRegistering
                      ? "new-password"
                      : "current-password"
                  }
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

              {isRegistering && (
                <span className="password-hint">
                  Use at least 6 characters.
                </span>
              )}

            </div>

            {/* Confirm password */}
            {isRegistering && (
              <div className="login-field">

                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className="password-input-wrapper">

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>
            )}

            {/* Login options */}
            {!isRegistering && (
              <div className="login-options">

                <label className="remember-me">

                  <input
                    type="checkbox"
                  />

                  <span>
                    Remember me
                  </span>

                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    showMessage(
                      "Password recovery will be connected to the backend.",
                      "success"
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="login-button"
            >
              {isRegistering
                ? "Create Account"
                : "Sign In"}
            </button>

          </form>

          {/* Switch login/register */}
          <div className="login-switch">

            <span>
              {isRegistering
                ? "Already have an account?"
                : "Don't have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {isRegistering
                ? "Sign in"
                : "Create account"}
            </button>

          </div>

          <div className="login-footer">
            <span>
              SentinelCore SecureOps
            </span>

            <span>
              •
            </span>

            <span>
              Infrastructure Security Platform
            </span>
          </div>

        </div>

        <p className="login-copyright">
          © 2026 SentinelCore SecureOps
        </p>

      </div>

    </div>
  )
}

export default Login