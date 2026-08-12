import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

// Drop-in replacement for `next/link`. Translates Next's `href` prop to React
// Router's `to`. External links (http/https), and mailto/tel/anchor targets
// fall back to a plain <a> so they behave normally and don't hit the router.

type NextLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

function isExternal(href: string): boolean {
  return (
    /^[a-z]+:\/\//i.test(href) ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  );
}

export default function Link({
  href,
  prefetch: _prefetch,
  scroll: _scroll,
  replace,
  children,
  ...rest
}: NextLinkProps) {
  if (isExternal(href)) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={href} replace={replace} {...rest}>
      {children}
    </RouterLink>
  );
}
