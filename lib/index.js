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
    this.manualOverride = option?.manualOverride ?? true;
    
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
  
  redirect(url){
    navigation.navigate(url, { history: "replace" });
    throw new DOMException("Abort", "AbortError");
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

    navigation.addEventListener("navigate", (e) => {
      if (
        !e.canIntercept ||
        e.hashChange ||
        e.downloadRequest || 
        e.formData ||
        (this.manualOverride && e.sourceElement?.dataset?.navigation === "false")
      ) return;

      const url = new URL(e.destination.url);
      if (this.ignoreAssets === true && /\.[^/]+$/.test(url.pathname)) return; //same-origin assets

      const { handler, options, routeParams } = this.#match(url.pathname) ?? {};
      if(!handler) {
        this.dispatchEvent(new CustomEvent("error", {
          detail: { error: "No handler found !", url }
        }));
        return;
      }

      this.dispatchEvent(new CustomEvent("will-navigate", {
        detail: { url }
      }));
      
      e.intercept({
        focusReset: (options?.autoFocus ?? this.autoFocus) === true ? "after-transition" : "manual",
        scroll: (options?.autoScroll ?? this.autoScroll) === true ? "after-transition" : "manual",
        commit: (options?.deferredCommit ?? this.deferredCommit) === true ? "after-transition" : "immediate",
        handler: handler.bind(this, e, {
          searchParams: Object.fromEntries(url.searchParams.entries()),
          routeParams: routeParams ?? {}
        })
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