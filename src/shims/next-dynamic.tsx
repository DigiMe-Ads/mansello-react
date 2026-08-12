import { lazy, Suspense, type ComponentType } from "react";

// Minimal replacement for `next/dynamic`. The app used it once, to lazy-load
// the Stripe-powered payment step:
//   dynamic(() => import("./payment-step").then((m) => m.PaymentStep), {
//     ssr: false,
//     loading: () => <p>Loading…</p>,
//   })
// The loader resolves to the component directly, so we wrap it as { default }
// for React.lazy and render it inside Suspense with the given loading fallback.

type DynamicOptions = {
  ssr?: boolean;
  loading?: () => JSX.Element | null;
};

export default function dynamic<P extends object>(
  loader: () => Promise<ComponentType<P>>,
  options: DynamicOptions = {},
): ComponentType<P> {
  const LazyComponent = lazy(async () => {
    const component = await loader();
    return { default: component };
  });

  const Loading = options.loading;

  return function DynamicComponent(props: P) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
