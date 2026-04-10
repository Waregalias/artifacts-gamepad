import type * as React from "react";

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
          src?: string;
          partition?: string;
          allowpopups?: string;
          webpreferences?: string;
        };
      }
    }
  }
}

export {};
