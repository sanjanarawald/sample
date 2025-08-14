'use client';

export default function LoginPage() {
  return (
    <div className="container d-flex align-items-center justify-content-center vh-100">
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <h1 className="mb-4 text-center fw-bold">ChatGPT Mobile</h1>
        <div className="card p-4 shadow-sm border-0 text-center">
          <p className="mb-3">Sign in with your account to continue.</p>
          <button
            onClick={() => {
              window.location.href = '/auth/login';
            }}
            className="btn btn-primary w-100 mb-2"
            type="button"
          >
            Continue with Auth0
          </button>
          <p className="text-muted small mb-0">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => {
                window.location.href = '/auth/login?screen_hint=signup';
              }}
              className="btn btn-link p-0 text-decoration-none"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
