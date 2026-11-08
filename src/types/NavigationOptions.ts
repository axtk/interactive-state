export type NavigationOptions<Href = string> = {
  target?: string;
  href?: Href;
  referrer?: Href;
  /** @default "auto" */
  spa?: "auto" | "off" | undefined;
  /** @default "push" */
  history?: "push" | "replace" | undefined;
  /** @default "auto" */
  scroll?: "auto" | "off" | undefined;
  id?: string;
  source?: "popstate" | undefined;
};
