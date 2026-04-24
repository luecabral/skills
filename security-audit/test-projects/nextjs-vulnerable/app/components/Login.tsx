'use client';

export function Login({ jwt }: { jwt: string }) {
  // Intentionally vulnerable — token in localStorage is XSS-readable
  const save = () => {
    localStorage.setItem('auth_token', jwt);
  };
  return <button onClick={save}>Login</button>;
}
