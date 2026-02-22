

## Remove "Dashboard" from Navigation Links

A small change to the Navbar component: remove the "Dashboard" entry from the `navLinks` array (the middle navigation links), while keeping the "Dashboard" button on the right side intact.

### Technical Details

**File: `src/components/landing/Navbar.tsx`**

Remove the `{ label: "Dashboard", href: "/dashboard" }` entry from the `navLinks` array (line 14). The Dashboard button on the right side (rendered conditionally when the user is logged in) remains unchanged.

