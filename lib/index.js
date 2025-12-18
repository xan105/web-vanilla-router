/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

export class Router extends EventTarget {
  
  #routes;
  #notFound;
  
  constructor(option = {}){
    super();
    this.#routes = Object.create(null);
    this.#notFound = Symbol("404");
    
    this.autoFire = option?.autoFire ?? true;
    this.sensitive = option?.sensitive ?? true;
    this.ignoreAssets = option?.ignoreAssets ?? true;
    this.directoryIndex = Array.isArray(option?.directoryIndex) ? option.directoryIndex : ["index.html"];
    this.manualOverride = option?.manualOverride ?? true;
    
    //Overridable per route
    this.autoFocus = option?.autoFocus ?? true;
    this.autoScroll = option?.autoScroll ?? true;
    this.deferredCommit = option?.deferredCommit ?? false;
  }
  
  get routes(){
    return Reflect.ownKeys(this.#routes);
  }

  get current(){
    return navigation.currentEntry;
  }
  
  get history(){
    return navigation.entries();
  }

  back(){
    if(navigation.canGoBack) return navigation.back();
  }
  
  forward(){
    if(navigation.canGoForward) return navigation.forward();
  }
  
  navigate(url, options){
    return navigation.navigate(url, options);
  }

  on(path, handler, options = {}) {
    if(typeof handler !== "function") return this;
    
    if(typeof path === "string" && path.length > 0){
      this.#routes[path] = { handler, options };
    } else if(path === 404){
      this.#routes[this.#notFound] = { handler, options };
    }
    return this;
  }

  off(path){
    if(typeof path === "string" && path.length > 0){
      delete this.#routes[path];
    } else if(path === 404){
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

  #match(path){
    if(this.sensitive === true && Object.hasOwn(this.#routes, path)){
      return this.#routes[path];
    }

    for (const [route, { handler, options }] of Object.entries(this.#routes))
    {
      const pattern = new URLPattern({ pathname: route }, { ignoreCase: this.sensitive === false });
      const match = pattern.exec({ pathname: path });
      if(match){
        return { handler, options, routeParams: match.pathname.groups };
      }
      else {
        continue;
      }
    }

    return this.#routes[this.#notFound];
  }

  listen(){
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
      if (
        !event.canIntercept    ||
         event.hashChange      ||
         event.downloadRequest || 
         event.formData        ||
        (this.manualOverride && event.sourceElement?.dataset?.navigation === "false")
      ) return;

      const url = new URL(event.destination.url);
      url.pathname = this.#normalize(url.pathname);
      if (this.ignoreAssets === true && /\.[^/]+$/.test(url.pathname)) return; //same-origin assets

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
            redirect: function(url){
              if (controller && controller instanceof NavigationPrecommitController) {
                controller.redirect(url, { history: "replace" });
              } else {
                navigation.navigate(url, { history: "replace" });
                throw new DOMException("Abort", "AbortError");
              }  
            }
          }));
        } 
      });
    });

    //Navigation API doesn't trigger "navigate" on page first load
    if(this.autoFire === true) {
      this.navigate(location.pathname, { history: "replace"});
    }
    return this;
  }
}

export { updateMetadata } from "./metadata.js"