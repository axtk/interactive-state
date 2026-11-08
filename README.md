# interactive-state

This library's core vanilla TS/JS exports:

- State management: [State](#state) · [PersistentState](#persistentstate)
- Routing: [Route](#route) [ [SPA navigation](#spa-navigation) · [Navigation options](#navigation-options) · [URL matching](#url-matching) · [Type-safe routes](#type-safe-routes) · [SPA links](#spa-links) · [Routing middleware](#navigation-events-and-middleware) ]

`State` is a thin data container allowing for subscription to data updates. It plays a central role in general-purpose shared state management, allowing application components to share data without coupling tightly to each other.

`Route` is a variety of `State`, with its data being the URL. Its purpose is interaction with the URL in a SPA fashion, without full-page reloads, via a `window.location`-like API.

The library's exports include a couple of intermediary objects and maintain the following relations:

```
EventEmitter
  └─► State
        ├─► PersistentState
        └─► URLState
              └─► Route
```

- `EventEmitter` triggers actions without tightly coupling interacting components
- `State` is `EventEmitter` that stores data and emits an event whenever the data gets updated allowing for dynamic data sharing without tight coupling
- `PersistentState` is `State` that syncs its data to the browser storage and restores it on page reload
- `URLState` is `State` that stores the URL and updates it in a SPA fashion
- `Route` is `URLState` with a `window.location`-like SPA navigation API and a URL matching API

\+ [Annotated live demos](#annotated-live-demos) · [Integrations](#integrations)

## State

`State` is a thin data container allowing for subscription to data updates. It enables data sharing across multiple parts of code without making these parts directly dependent on each other.

```js
import { State } from "interactive-state";

const counterState = new State(42);

document.querySelector("button").addEventListener("click", () => {
  counterState.setValue((value) => value + 1);
});

counterState.on("set", ({ current }) => {
  document.querySelector("output").textContent = String(current);
});
```
&#x2BC8; [Live demo: Shared state](https://codesandbox.io/p/sandbox/lqt3z2?file=%252Fsrc%252Findex.ts)

In this example, a button changes a counter value and an `<output>` element shows the updating value. Both elements are decoupled from each other: they are only aware of the shared counter state, but not of each other.

A `"set"` event callback is called each time the state value changes and immediately when the callback is added. Subscribe to the `"update"` event to have the callback respond only to the subsequent state changes without the immediate invocation.

&#x2BC8; [Live demo: Shared form input state](https://codesandbox.io/p/sandbox/4q7f99?file=%252Fsrc%252Findex.ts)

With TypeScript, the value type of a `State` instance is inferred from its initial value, or it can be explicitly specified with a generic type as `new State<T>(value)`.

## PersistentState

`PersistentState` is a variety of `State` that syncs its data to a browser storage, like `localStorage` or `sessionStorage`, and restores it on page reload. The way it's used is almost identical to `State`.

```diff
- import { State } from "interactive-state";
+ import { PersistentState } from "interactive-state";

- const counterState = new State(42);
+ const counterState = new PersistentState(42, { key: "counter" });

  document.querySelector("button").addEventListener("click", () => {
    counterState.setValue((value) => value + 1);
  });

  counterState.on("set", ({ current }) => {
    document.querySelector("output").textContent = String(current);
  });
```

By default, `PersistentState` stores its data at the specified `key` in `localStorage` and transforms the data with `JSON.stringify()` and `JSON.parse()`. Switch to `sessionStorage` by setting `options.session` to `true` in `new PersistentState(value, options)`. Set custom `serialize()` and `deserialize()` in `options` to override the default data transforms. Alternatively, use custom `{ read(), write()? }` as `options` to set up custom interaction with an external storage.

Instances of `PersistentState` automatically sync their values with the browser storage when created and updated. At other times, call `.emit("sync")` on a `PersistentState` instance to sync its value from the browser storage when needed.

## Route

`Route` stores the URL and exposes a `window.location`-like API for SPA navigation with a URL matching API.

```js
import { Route } from "interactive-state";

const route = new Route();
```

### SPA navigation

Navigate to other URLs in a SPA fashion similarly to the browser APIs:

```js
route.href = "/intro";
route.assign("/intro");
route.replace("/intro");
```

Or in a more fine-grained fashion:

```js
route.navigate({ href: "/intro", history: "replace", scroll: "off" });
```

### Navigation options

The navigation options object accepted by `route.navigate(options)` includes:

- `href`, a target URL;
- `referrer`, an original URL prior to the navigation;
- `history: "push" | "replace"`, controlling whether to save the navigation to the browser history session or not (default: `"push"`, save);
- `target`, accepting the HTML link `target` attribute values;
- `scroll: "auto" | "off"`, controlling whether the content should be automatically scrolled to the top after the navigation, similarly to the ordinary link navigation (`"auto"`, default), or not (`"off"`);
- `spa: "auto" | "off"`, controlling whether the navigation is in the SPA mode (`"auto"`, default) or requires a full-page reload (`"off"`);
- `id`, an optional ID that can be used in navigation handlers to identify a specific navigation.

### URL matching

Check the current URL value like a regular `string` with `route.href`:

```js
route.href === "/intro";
route.href.startsWith("/sections/");
/^\/sections\/\d+\/?/.test(route.href);
```

Or, alternatively, with `route.at(url)` returning `true` if the current URL matches `url`, and `false` otherwise:

```js
route.at("/intro"); // `true` at "/intro", `false` otherwise
route.at(/^\/sections\//); // `true` at "/sections/*"
```

Or with the extended form `route.at(url, x, y?)`, which acts similarly to the ternary conditional operator `atURL ? x : y`:

```js
document.querySelector("header").className = route.at("/", "full", "compact");
// at "/" ? then "full" : otherwise "compact"
```

Use `route.at(url, x, y?)` with dynamic values that require values from the URL pattern's capturing groups:

```js
document.querySelector("h1").textContent = route.at(
  /^\/sections\/(?<id>\d+)\/?/,
  ({ params }) => `Section ${params.id}`,
);
// at "/sections/:id", "Section <id>" (otherwise `undefined`)
```

&#x2BC8; [Live demo: URL-based rendering](https://codesandbox.io/p/sandbox/kt6m5l?file=%252Fsrc%252Findex.ts)

### Type-safe routes

Use `zod`, or another [Standard Schema compliant library](https://standardschema.dev/schema#what-schema-libraries-implement-the-spec), with a URL builder like `url-shape` to set up a typed URL schema:

```js
import { createURLBuilder } from "url-shape";
import { z } from "zod"; // Or another Standard Schema compliant library

export const url = createURLBuilder({
  "/sections/:id": z.object({
    // URL path placeholder parameters
    params: z.object({ id: z.coerce.number() }),
    // An optional URL `query` schema can be defined here, too
  }),
  "/": z.object({}), // No parameters, empty schema
});
```

Use the typed schema-based URLs and URL patterns to enable type-safe routing:

```js
// With the URL builder `url()` as defined above
route.href = url("/intro").href;
// Navigates to "/intro"

route.href = url("/sections/:id").compile({ params: { id: 10 } });
//                                          ^ { id: number }
// Navigates to "/sections/10"

document.querySelector("h1").textContent = route.at(
  url("/sections/:id"),
  ({ params }) => `Section ${params.id}`,
  // ^ { id: number }
);
// at "/sections/:id", "Section <id>" (otherwise `undefined`)
```

&#x2BC8; [Live demo: Type-safe routing](https://codesandbox.io/p/sandbox/qg7qg3?file=%2Fsrc%2Findex.ts)

### SPA links

Enable SPA navigation with regular HTML links inside a specified container (or the entire `document`) without any changes to the HTML:

```js
route.observe(document);
```

Tweak the links' navigation behavior by adding a relevant combination of `href`, `target`, and `data-` attributes corresponding to the [navigation options](#navigation-options) outlined above:

```html
<a href="/intro">Intro</a>
<a href="/intro" data-history="replace">Intro</a>
<a href="/intro" data-scroll="off">Intro</a>
<a href="/intro" data-spa="off">Intro</a>
<a href="/intro" data-id="header-intro-link">Intro</a>
```

Links covered by `route.observe(container, selector?)` also automatically receive the `data-active="true"` attribute whenever their `href` attribute matches the current URL, which can be used for additional styling. If links are added to the DOM asynchronously, call `route.emit("ready")` when the rendering is complete to mark active links.

&#x2BC8; [Live demo: URL-based rendering, SPA links](https://codesandbox.io/p/sandbox/kt6m5l?file=%252Fsrc%252Findex.ts)

### Navigation events and middleware

Define what should be done when the URL changes:

```js
route.on("navigationcomplete", ({ href }) => {
  renderContent();
});
```

Define what should be done before the URL changes:

```js
route.on("navigationstart", ({ href }) => {
  if (hasUnsavedInput) return false; // Quit the navigation, prevent the current URL change

  if (href === "/") {
    route.href = "/intro"; // SPA redirection
    return false;
  }
});
```

The object received by the event handlers as a parameter has the shape of the [navigation options](#navigation-options) outlined above.

Effectively, the navigation event handlers act like routing middleware.

&#x2BC8; [Live demo: Routing middleware](https://codesandbox.io/p/sandbox/rpl3gh?file=%252Fsrc%252Findex.ts)

## Annotated live demos

State management:

- [Shared state](https://codesandbox.io/p/sandbox/lqt3z2?file=%252Fsrc%252Findex.ts)
- [Shared form input state](https://codesandbox.io/p/sandbox/4q7f99?file=%252Fsrc%252Findex.ts)
- [Persistent shared state](https://codesandbox.io/p/sandbox/c9gt3r?file=%252Fsrc%252Findex.ts)

Routing:

- [URL-based rendering, SPA links](https://codesandbox.io/p/sandbox/kt6m5l?file=%252Fsrc%252Findex.ts)
- [Type-safe URL-based rendering](https://codesandbox.io/p/sandbox/qg7qg3?file=%2Fsrc%2Findex.ts)
- [Routing middleware](https://codesandbox.io/p/sandbox/rpl3gh?file=%252Fsrc%252Findex.ts)

Find also the code of these examples in the repo's [`tests`](https://github.com/axtk/interactive-state/tree/main/tests) directory.

## Integrations

[`interactive-react-state`](https://www.npmjs.com/package/interactive-react-state)
