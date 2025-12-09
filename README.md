About
=====

Simple and modern Vanilla JS router based on the 📖 [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) and 📖 [URLPattern API](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern).

<img align="left" width="89" height="128" src="https://github.com/xan105/web-vanilla-router/raw/main/logo.png">

- Dependency free.
- Parameterized routes and URL pattern matchers.
- Handles navigation: just define your routes.
- Optional "Not-found" handler.
- Handler redirection: navigating between routes.

📦 Scoped `@xan105` packages are for my own personal use but feel free to use them.

🤔 Curious to see it in real use? This package powers [my personal blog](https://xan105.com/).

Example
=======

```js
import { Router } from "@xan105/vanilla-router"

const router = new Router();

router
.on("/", function(event, params){
  // do something
})
.on("/about", async(event, params) => {
  // do something
})

// Parameterized routes
.on("/user/:id", (event, { routeParams }) => {
  const { id } = routeParams;
  // do something
})

// Query parameters (eg: /items?name=foo)
.on("/items", (event, { searchParams }) => {
  const { name } = searchParams;
  // do something
})

// Handler redirection
.on("/admin", function(){
  if (!isLoggedIn()){
    this.redirect("/login");
  }
  // do something
})
.on("/login", function(){
  // Authenticate
})

// Optional "not found" hook
.on(404, () => {
  console.error("not found !");
})

.listen();
```

OpenGraph - Metadata

```js
import { Router, updateMetadata } from "@xan105/vanilla-router"

const router = new Router();

router.on("/blog/:id", () => {
  updateMetadata([
    { name: "title", content: "My website" },
    { name: "type", content: "article", details: { 
      modified_time: "2025-01-21T00:00:00Z",
      section : "Technology"
    }}
  ]);
  
  // do something
}).listen();
```

Install
=======

```
npm i @xan105/vanilla-router
```

💡 The bundled library and its minified version can be found in the `./dist` folder.

### Via importmap

Create an importmap and add it to your html:

```html
    <script type="importmap">
    {
      "imports": {
        "@xan105/vanilla-router": "./node_modules/@xan105/vanilla-router/dist/router.min.js"
      }
    }
    </script>
    <script type="module">
      import { Router } from "@xan105/vanilla-router"
      const router = new Router();
      router
      .on("/path/to/route", (event, params)=>{
        // Do a flip()
      })
      .listen();
    </script>
  </body>
</html>
```

Compatibility
=============

As of this writing, Firefox and Safari still [lacks support for the Navigation API](https://caniuse.com/mdn-api_navigation).

I recommend the excellent Navigation API shim: [@virtualstate/navigation](https://github.com/virtualstate/navigation) in the meantime.

**Install & build**

```console
npm i -D @virtualstate/navigation esbuild
npx esbuild "./node_modules/@virtualstate/navigation/esnext/polyfill.js" --bundle --minify --legal-comments=none --platform=browser --target=esnext --format=esm --outfile="navigation.min.js"
```

**Usage (Via importmap)**

```html
    <script type="importmap">
    {
      "imports": {
        "@virtualstate/navigation/polyfill": "./navigation.min.js"
      }
    }
    </script>
    <script type="module">
      if (!("navigation" in window)) await import("@virtualstate/navigation/polyfill");
    </script>
  </body>
</html>
```

API
===

⚠️ This module is only available as an ECMAScript module (ESM) and is intended for the browser.

## Named export

### `Router(option?: object): Class`

_extends 📖 [EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)_

**Events**

  `error({ detail: { error: string, url: URL } })`

  This event is dispatched when an error has occured. 

  `will-navigate({ detail: { url: URL } })`

  This event is dispatched when the router is about to navigate to one of its route.

  `did-navigate({ detail: { url: URL } })`

  This event is dispatched when navigation is done.

**Options**

  - `autoFocus:? boolean` (true)
 
  Defines the navigation's focus behavior (automatic or manual).<br/>
  When enabled the browser will focus the first element with the autofocus attribute, or the <body> element if no element has autofocus set.

  - `autoScroll:? boolean` (true)

  Defines the navigation's scrolling behavior (automatic or manual).<br/>
  When enabled the browser will handle the scrolling for example restoring the scroll position to the same place as last time if the page is  reloaded or a page in the history is revisited.

  - 🧪 `deferredCommit:? boolean` (false)

  The default behavior of immediately "committing" (i.e., updating location.href and navigation.currentEntry) works well for most situations, but some may find they do not want to immediately update the URL.
  When deferred commit is used, the navigation will commit when `event.commit()` is called or when a route's handler fulfills / terminates and `event.commit()` hasn't yet been called (fallback).

  NB: 🧪 _Available in Chromium behind the experimental web platform features flag._

  - `autoFire:? boolean` (true)

  Triggers a navigate event for the current path on a page's first load.<br/>
  The default behavior is intended for when all requests are routed to your SPA.

  [Caddy](https://github.com/caddyserver/caddy) example:

  ```
  foo.com {
    root * /srv/www/foo.com
    try_files {path} /index.html
    file_server
  }
  ```

  If you are using a "400.html" redirect trick like when hosting on Github's Page.
  You should not use this and instead handle it yourself.

  <details><summary>Example:</summary>

  **404.html**:

  ```html
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <script>
        sessionStorage.redirect = location.pathname;
      </script>
      <meta http-equiv="refresh" content="0;URL='/'"></meta>
    </head>
  </html>
  ```

  **navigation.js**:

  ```js
  const router = new Router({ autoFire: false });
  router.on("/", () => { //some route })
  router.listen()

  const { redirect } = sessionStorage;
  delete sessionStorage.redirect;

  const url = redirect !== location.pathname ? redirect : "/"
  router.navigate(url, { history: "replace" });
  ```
  </details>

  - `sensitive?: boolean` (true)

  Enables case-insensitive route matching when set to `false`.

  - `ignoreAssets?: boolean` (true)

  Ignore same-origin assets. 

  When `true`, if a same-origin URL has a file extension then the navigation won't be intercepted.

  - 🧪 `manualOverride?: boolean` (true)

  This library handles when navigation shouldn't be intercepted. But sometimes you just need a manual override!

  When `true`, every navigation triggered by an element with the `data-navigation` attribute set to `false` won't be intercepted, eg:

  ```html
  <a href="/some/server/route/" data-navigation="false">Link</a>
  ```

  NB: 🧪 _This feature requires the `event.sourceElement` available in Chromium behind the experimental web platform features flag._

**Methods**

#### `on(path: string | number, handler: (async)function): Router`

  Add a route to the router.<br/>

  A route is unique and has one handler.<br/>
  Please see the 📖 [URLPattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) for possible pattern syntax.

  💡 The `on()` method is chainable.

  Example:

  ```js
  .on("/foo/bar", (event, params) => {
    //render logic
  })

  .on("/articles/:id", async(event, params) => {
    //render logic
  })
  ```

  Handler function is bind to the following arguments:

  ```ts
  handler(event: NavigateEvent, params: { searchParams: object, routeParams: object })
  ```

    - `event: NavigateEvent`

      The corresponding 📖 [NavigateEvent](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent).<br/>
      This exposes the NavigateEvent object instance and all its goodies.<br/>

      For example if it makes sense to scroll earlier, you can call `event.scroll()` 
      📖 [NavigateEvent.scroll()](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/scroll)

    - `params: { searchParams: object, routeParams: object }`
      
      The query and route parameters represented in key/value pairs.

      ```js
      .on("/users/:id/:action", (event, { routeParams }) => {
        console.log(routeParams); //{ id: "...", action: "..." }
      })

      .on("/items", (event, { searchParams }) => {
        console.log(searchParams); //{ foo: "bar" }
      })
      ```

  **Handling no route found**

  💡 There is a special route `404` that you can **optionally** add a handler to when you need to handle cases where no match is found.

  ```js
  .on(404, () => { 
    //no match found
  })
  ```

  If you do not add a handler to this special route navigation won't be intercepted.

#### `off(path: string | number): Router`

  Remove a route from the router.

  💡 The `off()` method is chainable.

#### `navigate(url: string, options: object): object`

  Navigate to the specified url.

  Short hand to 📖 [Navigation.navigate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate).

#### `redirect(url: string): void`

  Redirect to the specified URL by aborting the current navigation, navigating to the URL and replacing the current `NavigationHistoryEntry` (to prevent "back button loop").

  This is a sugar helper function for when you want to redirect from a route handler to another.

  **Example**

  ```js
  .on("/foo", function(){ 
    this.redirect("/bar");
  })
  .on("/bar", function(){ 
    console.log("Hello!")
  })
  ```

#### `back(): void | object`

  Navigates backwards by one entry in the navigation history, if possible.

  Returns the object of 📖 [Navigation.navigate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate#return_value) if a navigation occurs.

#### `forward(): void | object`

  Navigates forwards by one entry in the navigation history, if possible.

  Returns the object of 📖 [Navigation.navigate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate#return_value) if a navigation occurs.

#### `listen(): Router`

  Start the router logic by listening to the 📖 [navigate](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate_event) event and intercept when needed.

  💡 The `listen()` method is chainable.

**Properties**

#### `routes: string[]` (read only)

  The routers' routes.

#### `current: NavigationHistoryEntry` (read only)

  Short hand to 📖 [Navigation.currentEntry](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/currentEntry).
  
#### `history: NavigationHistoryEntry[]` (read only)

  Short hand to 📖 [Navigation.entries()](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/entries).

### `updateMetadata(data: {name: string, content:string, details?: object}[]): void`

Update the document's metadata: title, description and Open Graph protocol.

Example:

```js
  updateMetadata([
    { name: "title", content: "Xan" },
    { name: "description", content: "Lorem Ipsum" },
    { name: "image", content: "http://localhost/avatar.png" },
    { name: "url", content: "http://localhost" },
    { name: "type", content: "website" }
  ]);
```

⬇️

```html
<head prefix="og: https://ogp.me/ns# website: https://ogp.me/ns/website#">
  <title>Xan</title>
  <meta name="description" content="Lorem Ipsum" />
  <meta property="og:title" content="Xan" />
  <meta property="og:description" content="Lorem Ipsum" />
  <meta property="og:image" content="http://localhost/avatar.png" />
  <meta property="og:url" content="http://localhost" />
  <meta property="og:type" content="website" />
</head>
```

📖 [The Open Graph protocol](https://ogp.me/)
