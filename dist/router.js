// lib/index.js
var Router = class extends EventTarget {
  #routes;
  #notFound;
  constructor(option = {}) {
    super();
    this.#routes = /* @__PURE__ */ Object.create(null);
    this.#notFound = Symbol("404");
    this.autoFire = option?.autoFire ?? true, this.autoFocus = option?.autoFocus ?? true, this.autoScroll = option?.autoScroll ?? true, this.sensitive = option?.sensitive ?? true;
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
    if (navigation.canGoBack)
      navigation.back();
  }
  forward() {
    if (navigation.canGoForward)
      navigation.forward();
  }
  navigate(path = "/") {
    if (typeof path === "string" && path.length > 0 && this.#routes[path]) {
      return navigation.navigate(path, {
        history: location.pathname === path ? "replace" : "auto"
      });
    }
  }
  on(path, handler) {
    if (typeof handler !== "function")
      return this;
    if (typeof path === "string" && path.length > 0) {
      this.#routes[path] = handler;
    } else if (path === 404) {
      this.#routes[this.#notFound] = handler;
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
  #match(path) {
    const result = /* @__PURE__ */ Object.create(null);
    if (this.sensitive === true)
      result.handler = this.#routes[path];
    if (!result.handler) {
      for (const [route, handler] of Object.entries(this.#routes)) {
        const pattern = new URLPattern({ pathname: route }, { ignoreCase: this.sensitive === false });
        const match = pattern.exec({ pathname: path });
        if (match) {
          result.handler = handler;
          result.param = match.pathname.groups;
          break;
        } else {
          continue;
        }
      }
    }
    result.handler ??= this.#routes[this.#notFound];
    result.param ??= {};
    return result;
  }
  listen() {
    navigation.addEventListener("navigateerror", (e) => {
      this.dispatchEvent(new CustomEvent("error", {
        detail: { error: e.message }
      }));
    });
    navigation.addEventListener("navigate", (e) => {
      if (!e.canIntercept || e.hashChange || e.downloadRequest !== null || e.formData)
        return;
      const url = new URL(e.destination.url);
      const { handler, param } = this.#match(url.pathname);
      if (!handler) {
        this.dispatchEvent(new CustomEvent("error", {
          detail: { error: "No handler found !" }
        }));
        return;
      }
      this.dispatchEvent(new CustomEvent("will-navigate", {
        detail: { url }
      }));
      e.intercept({
        focusReset: this.autoFocus === true ? "after-transition" : "manual",
        scroll: this.autoScroll === true ? "after-transition" : "manual",
        handler: handler.bind(this, e, url, param)
      });
    });
    if (this.autoFire === true)
      this.navigate();
    return this;
  }
};
export {
  Router
};
