import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Ontime Academy & Co-working Space",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-screen">
      <div className="auth-mesh" />
      <div className="auth-grid" />
      {children}
    </div>
  );
}
