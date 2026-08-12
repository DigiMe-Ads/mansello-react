import {
  useNavigate,
  useLocation,
  useParams as useRouterParams,
  useSearchParams as useRouterSearchParams,
} from "react-router-dom";

// Drop-in replacements for the `next/navigation` hooks the app used:
// useRouter().push / .replace / .back, usePathname, useSearchParams, useParams.
// redirect / notFound are provided for completeness.

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => {
      /* no-op in an SPA */
    },
    prefetch: () => {
      /* no-op in an SPA */
    },
  };
}

export function usePathname(): string {
  return useLocation().pathname;
}

// Next's useSearchParams returns a ReadonlyURLSearchParams (i.e. the params
// object itself). React Router returns a [params, setParams] tuple, so we
// unwrap it to match the original call sites that do `searchParams.get(...)`.
export function useSearchParams(): URLSearchParams {
  const [searchParams] = useRouterSearchParams();
  return searchParams;
}

export function useParams<T extends Record<string, string | undefined>>(): T {
  return useRouterParams() as T;
}

export function redirect(href: string): never {
  window.location.href = href;
  throw new Error(`redirect: ${href}`);
}

export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}
