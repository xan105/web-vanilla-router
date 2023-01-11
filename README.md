About
=====

Simple Vanilla JS router based on the [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API).<br/>

📦 Scoped `@xan105` packages are for my own personal use but feel free to use them.

Example
=======

```js
import { Router } from "./path/to/router.js"

const router = new Router();

router
.on("/", function(event, url){
  //do something
})
.on("/about", async(event, url) => {
  //do something
})
//Parameterized routes
.on("/user/:id", (event, url, param) => {
  const id = { param };
  //do something
})
//Optional "not found" hook
.on(404, (event, url) => {
  console.error("not found !")
})
.listen();
```

Install
=======

```
npm i @xan105/vanilla-router
```

### Optional 

Create an importmap:

```json
{
  "imports": {
    "@xan105/vanilla-router": "./path/to/node_modules/@xan105/vanilla-router/dist/router.min.js"
  }
}
```

index.html:

```html
  <script src="./importmap.json" type="importmap"></script>
  <script src="./index.js" type="module"></script>
  </body>
</html>
```

index.js:

```js
import { Router } from "@xan105/vanilla-router"

const router = new Router();

router
.on("/path/to/route", (event, url)=>{
  //Do a flip()
})
.listen();
```

API
===

⚠️ This module is only available as an ECMAScript module (ESM) and is intended for the browser.

## Named export

### `Router(): Class`

**Options**

- autoFocus:? boolean (true)
 
Defines the navigation's focus behavior (automatic or manual).<br/>
When enabled the browser will focus the first element with the autofocus attribute, or the <body> element if no element has autofocus set.

- autoScroll:? boolean (true)

Defines the navigation's scrolling behavior (automatic or manual).<br/>
When enabled the browser will handle the scrolling for example restoring the scroll position to the same place as last time if the page is reloaded or a page in the history is revisited.

**Methods**

#### `on(path: string | number, handler: (async)function)`

Add a route to the router.

A route is unique and has one handler.<br/>
The `on()` method is chainable.

```js
.on("/foo/bar", ()=>{
  //render logic
})
.on("/bar/ffo", async()=>{
  //render logic
})
```

Handler is bind to the following arguments:

```ts
{
  event: object, //NavigateEvent
  url: object, //URL
  param: object
}
```

Where:

- `event` 

is the corresponding [📖 NavigateEvent](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent).<br/>
This exposes the NavigateEvent object instance and all its goodies.<br/>
For example if it makes sense to scroll earlier, you can call `event.scroll()` [(📖 NavigateEvent.scroll())](https://developer.mozilla.org/en-US/docs/Web/API/NavigateEvent/scroll)

- `url` 

is the corresponding [📖 URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) object instance.<br/>
So you have easy access to things like _href, pathname, searchParams, ..._

- `param`

The parameterized routes have paths that contain dynamic parts _("/articles/:id")_.<br/>
When using parameterized route `param` will expose said parameter(s) in a key/value pair.

```js
.on("/user/:id/:action", (event, url, param)=>{
  console.log(param); //{ id: "...", action: "..." }
})
```


💡 There is a special route `404` that you can **optionally** add a handler to when you need to handle cases where no match is found.

```js
.on(404, (event, url)=>{ 
  //no match found
})
```

If you do not add a handler to this route navigation won't be intercepted.

#### `off(path: string)`

Remove a route from the router.

#### `navigate(path: string)`

Short hand to [Navigation.navigate()](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate).<br/>
But does nothing _(return undefined)_ if the route doesn't exist and<br/>
if the route is the current route it will replace the current NavigationHistoryEntry

#### `current()`

Short hand to [Navigation.currentEntry](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/currentEntry).
  
#### `history()`

Short hand to [Navigation.entries()](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/entries).

#### `listen()`

Start the router logic by listening to the [navigate](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/navigate_event) event and intercept when needed.

Docs 🤓
=======

📖 https://developer.chrome.com/docs/web-platform/navigation-api<br/>
📖 https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API<br/> 
📖 https://github.com/WICG/navigation-api