import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "gmp-place-details": DetailedHTMLProps<
          HTMLAttributes<HTMLElement>,
          HTMLElement
        > & { id?: string };
        "gmp-place-details-place-request": DetailedHTMLProps<
          HTMLAttributes<HTMLElement>,
          HTMLElement
        > & { id?: string; place?: string };
        "gmp-place-all-content": DetailedHTMLProps<
          HTMLAttributes<HTMLElement>,
          HTMLElement
        >;
      }
    }
  }
}

export {};
