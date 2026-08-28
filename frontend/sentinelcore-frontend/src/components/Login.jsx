import { useState } from "react"

function Login({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    // Temporary frontend-only login.
    // Real authentication will be connected to the backend later.
    console.log("Login submitted:", { email, password })

    // Temporarily enter the dashboard.
    if (onLogin) {
      onLogin()
    }
  }

  return (
    <div className="login-page">

      {/* Background effects */}
      <div className="login-background">
        <div className="login-glow login-glow-one"></div>
        <div className="login-glow login-glow-two"></div>
      </div>

      {/* Login container */}
      <div className="login-container">

        {/* Brand */}
        <div className="login-brand">

          <div className="login-logo">
            S
          </div>

          <div className="login-brand-text">
            <h1>SentinelCore</h1>
            <span>SECUREOPS</span>
          </div>

        </div>

        {/* Login card */}
        <div className="login-card">

          <div className="login-header">

            <p className="login-eyebrow">
              SECURE ACCESS
            </p>

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to access your infrastructure
              monitoring dashboard.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="login-form"
          >

            {/* Email */}
            <div className="login-field">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <span
                    className={`eye-icon ${
                      showPassword ? "eye-closed" : ""
                    }`}
                  ></span>
                </button>

              </div>

            </div>

            {/* Login options */}
            <div className="login-options">

              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="forgot-password"
                onClick={() =>
                  console.log("Forgot password clicked")
                }
              >
                Forgot password?
              </button>

            </div>

            {/* Sign in */}
            <button
              type="submit"
              className="login-button"
            >
              Sign In
            </button>

          </form>

          {/* Card footer */}
          <div className="login-footer">
            <span>
              Protected infrastructure environment
            </span>
          </div>

        </div>

        {/* Copyright */}
        <p className="login-copyright">
          SentinelCore SecureOps • Infrastructure Security Platform
        </p>

      </div>

    </div>
  )
}

export default Login