import Link from "next/link";
import { ReactNode } from "react";

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="apphead">
      <Link href="/" className="brand">
        formly<span>•</span>
      </Link>
      {children}
      <div className="avatar" title="Default creator workspace">
        RK
      </div>
    </header>
  );
}
