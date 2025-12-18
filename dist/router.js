// lib/metadata.js
function clearMetadata() {
  [
    ...document.head.querySelectorAll('meta[property^="og:"]'),
    ...document.head.querySelectorAll('meta[property^="article:"]'),
    ...document.head.querySelectorAll('meta[property^="book:"]'),
    ...document.head.querySelectorAll('meta[property^="profile:"]'),
    ...document.head.querySelectorAll('meta[property^="video:"]'),
    ...document.head.querySelectorAll('meta[property^="music:"]'),
    ...document.head.querySelectorAll('link[rel^="canonical"]')
  ].forEach((el) => document.head.removeChild(el));
}
function updateMetadata(data) {
  if (!Array.isArray(data)) return;
  const prefix = ["og: https://ogp.me/ns/#"];
  clearMetadata();
  for (const { name, content, details } of data) {
    switch (name) {
      case "title": {
        document.title = content;
        break;
      }
      case "description": {
        const element2 = document.head.querySelector(`meta[name="${name}"]`) ?? document.head.appendChild(document.createElement("meta"));
        element2.setAttribute("name", name);
        element2.setAttribute("content", content);
        break;
      }
      case "url": {
        const element2 = document.head.querySelector(`link[rel="canonical"]`) ?? document.head.appendChild(document.createElement("link"));
        element2.setAttribute("rel", "canonical");
        element2.setAttribute("href", content);
        break;
      }
      case "type": {
        const schema = `${content}: https://ogp.me/ns/${content}#`;
        prefix.push(schema);
        break;
      }
    }
    const element = document.createElement("meta");
    element.setAttribute("property", "og:" + name);
    element.setAttribute("content", content);
    document.head.appendChild(element);
    for (const [key, value] of Object.entries(details ?? {})) {
      const array = Array.isArray(value) ? value : [value];
      for (const entry of array) {
        const element2 = document.createElement("meta");
        if (name === "type") {
          const [type] = content.split(".");
          element2.setAttribute("property", type + ":" + key);
        } else {
          element2.setAttribute("property", "og:" + name + ":" + key);
        }
        element2.setAttribute("content", entry);
        document.head.appendChild(element2);
      }
    }
  }
  document.head.setAttribute("prefix", prefix.join(" "));
}

// lib/index.js
var Router = class extends EventTarget {
  #routes;
  #notFound;
  constructor(option = {}) {
    super();
    this.#routes = /* @__PURE__ */ Object.create(null);
    this.#notFound = Symbol("404");
    this.autoFire = option?.autoFire ?? true;
    this.sensitive = option?.sensitive ?? true;
    this.ignoreAssets = option?.ignoreAssets ?? true;
    this.directoryIndex = Array.isArray(option?.directoryIndex) ? option.directoryIndex : ["index.html"];
    this.manualOverride = option?.manualOverride ?? true;
    this.autoFocus = option?.autoFocus ?? true;
    this.autoScroll = option?.autoScroll ?? true;
    this.deferredCommit = option?.deferredCommit ?? false;
  }
  get routes() {
    return Reflect.ownKeys(this.#routes);
  }
  get current() {
    return navigation.currentEntry;
  }
  get history() {
    return navigation.entries();
  }
  back() {
    if (navigation.canGoBack) return navigation.back();
  }
  forward() {
    if (navigation.canGoForward) return navigation.forward();
  }
  navigate(url, options) {
    return navigation.navigate(url, options);
  }
  on(path, handler, options = {}) {
    if (typeof handler !== "function") return this;
    if (typeof path === "string" && path.length > 0) {
      this.#routes[path] = { handler, options };
    } else if (path === 404) {
      this.#routes[this.#notFound] = { handler, options };
    }
    return this;
  }
  off(path) {
    if (typeof path === "string" && path.length > 0) {
      delete this.#routes[path];
    } else if (path === 404) {
      delete this.#routes[this.#notFound];
    }
    return this;
  }
  #normalize(path) {
    for (const filename of this.directoryIndex) {
      if (typeof filename === "string" && path.endsWith("/" + filename)) {
        return path.slice(0, -filename.length);
      }
    }
    return path;
  }
  #match(path) {
    if (this.sensitive === true && Object.hasOwn(this.#routes, path)) {
      return this.#routes[path];
    }
    for (const [route, { handler, options }] of Object.entries(this.#routes)) {
      const pattern = new URLPattern({ pathname: route }, { ignoreCase: this.sensitive === false });
      const match = pattern.exec({ pathname: path });
      if (match) {
        return { handler, options, routeParams: match.pathname.groups };
      } else {
        continue;
      }
    }
    return this.#routes[this.#notFound];
  }
  listen() {
    navigation.addEventListener("navigateerror", (e) => {
      const url = new URL(e.currentTarget.currentEntry.url);
      this.dispatchEvent(new CustomEvent("error", {
        detail: { error: e.error.message, url }
      }));
    });
    navigation.addEventListener("navigatesuccess", (e) => {
      const url = new URL(e.currentTarget.currentEntry.url);
      this.dispatchEvent(new CustomEvent("did-navigate", {
        detail: { url }
      }));
    });
    navigation.addEventListener("navigate", (event) => {
      if (!event.canIntercept || event.hashChange || event.downloadRequest || event.formData || this.manualOverride && event.sourceElement?.dataset?.navigation === "false") return;
      const url = new URL(event.destination.url);
      url.pathname = this.#normalize(url.pathname);
      if (this.ignoreAssets === true && /\.[^/]+$/.test(url.pathname)) return;
      this.dispatchEvent(new CustomEvent("will-navigate", {
        detail: { url }
      }));
      const { handler, options, routeParams } = this.#match(url.pathname) ?? {};
      const focusReset = (options?.autoFocus ?? this.autoFocus) === true;
      const scroll = (options?.autoScroll ?? this.autoScroll) === true;
      const deferredCommit = event.cancelable && (options?.deferredCommit ?? this.deferredCommit) === true;
      event.intercept({
        focusReset: focusReset ? "after-transition" : "manual",
        scroll: scroll ? "after-transition" : "manual",
        [deferredCommit ? "precommitHandler" : "handler"]: async function(controller) {
          if (!handler) throw new Error(`No route handler found!`);
          await handler(Object.freeze({
            event,
            searchParams: Object.fromEntries(url.searchParams.entries()),
            routeParams: routeParams ?? {},
            redirect: function(url2) {
              if (controller && controller instanceof NavigationPrecommitController) {
                controller.redirect(url2, { history: "replace" });
              } else {
                navigation.navigate(url2, { history: "replace" });
                throw new DOMException("Abort", "AbortError");
              }
            }
          }));
        }
      });
    });
    if (this.autoFire === true) {
      this.navigate(location.pathname, { history: "replace" });
    }
    return this;
  }
};
export {
  Router,
  updateMetadata
};
