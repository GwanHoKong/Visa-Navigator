"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">
        <span className="globe">🌐</span>
        Visa Navigator
      </Link>
      <div className="navbar-links">
        <Link href="/" className={pathname === "/" ? "active" : ""}>🏠 Home</Link>
        <Link href="/timeline" className={pathname === "/timeline" ? "active" : ""}>⏱ Timeline</Link>
        <Link href="/predict" className={pathname === "/predict" ? "active" : ""}>📊 Predict</Link>
        <Link href="/resources" className={pathname === "/resources" ? "active" : ""}>📚 Resources</Link>
      </div>
    </nav>
  );
}
