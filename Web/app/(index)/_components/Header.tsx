import Link from 'next/link'
import { Button } from '../../../components/ui/button'
import { SignedIn, SignedOut, SignOutButton} from '@clerk/nextjs'



export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
          <span className="font-bold">EduAssist</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link
            href="#features"
            className="transition-colors hover:text-foreground/80"
          >
            Features
          </Link>
          <Link
            href="#about"
            className="transition-colors hover:text-foreground/80"
          >
            About
          </Link>
          <Link
            href="#reviews"
            className="transition-colors hover:text-foreground/80"
          >
            Reviews
          </Link>
          <Link
            href="#contact"
            className="transition-colors hover:text-foreground/80"
          >
            Contact
          </Link>
        </nav>
        <div className="flex gap-4">
          <SignedOut>
            <Link href="\sign-in">
              <Button variant="outlineBlack" className="hidden md:inline-flex">
                Login
              </Button>
            </Link>
            <Link href="\sign-up">
              <Button variant="defaultBlack" className="hidden md:inline-flex">
                Sign Up
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="\dashboard">
              <Button variant="defaultBlack" className="hidden md:inline-flex">
                Dashboard
              </Button>
            </Link>
            <SignOutButton />
          </SignedIn>
        </div>
        <Button variant="outline" size="icon" className="md:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>
    </header>
  );
}

