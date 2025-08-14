'use client';

export default function SignUpPage() {
  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <h1 className="mb-4 text-center fw-bold">Create Account</h1>
        <div className="card p-4 shadow-sm border-0 text-center">
          <p className="mb-3">Sign up with Auth0 to get started.</p>
          <button
            className="btn btn-success w-100 mb-2"
            type="button"
            onClick={() => {
              window.location.href = '/auth/login?screen_hint=signup';
            }}
          >
            Sign Up with Auth0
          </button>
          <p className="text-muted small mb-0">
            Already have an account?{' '}
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => {
                window.location.href = '/login';
              }}
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
