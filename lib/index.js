/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

export class Router {
  
  constructor(option = {}){

    Object.defineProperty(this, "options", {
      value: {
        autoFocus: option.autoFocus ?? true,
        autoScroll: option.autoScroll ?? true
      },
      writable: false,
      configurable: false,
      enumerable: true
    });
    
    Object.defineProperty(this, "routes", {
      value: Object.create(null),
      writable: false,
      configurable: false,
      enumerable: true
    });
  }
  
  current(){
    return navigation.currentEntry;
  }
  
  history(){
    return navigation.entries();
  }
  
  navigate(path = "/"){
    if(
      !(typeof path === "string" && path.length > 0) || 
      !this.routes[path]
    ) return;
    
    return navigation.navigate(path, {
      history: location.pathname === path ? "replace" : "auto"
    });
  }
  
  on(path, handler) {
    if(((typeof path === "string" && path.length > 0) || 
        typeof path === "number") && 
        typeof handler === "function"
    ){
      this.routes[path] = handler;
    }
    return this;
  }
  
  off(path){
    delete this.routes[path];
    return this;
  }

  #matchRoute(path){
    const routes = Object.keys(this.routes)
      .filter(r => r.includes(":") && r.split("/").length === path.split("/").length)
      .map((r)=>{ 
        return { 
          route: r, 
          regex: new RegExp(r.replaceAll("/","\/").replaceAll(/:(\w|\d)+/g, "(\\w|\\d)+") )
        }
      });

    const match = routes.find( ({regex}) => regex.test(path) );
    return match?.route;
  }

  listen(){

    navigation.addEventListener("navigate", (e)=>{
    
      if (
        !e.canIntercept || 
        e.hashChange || 
        e.downloadRequest !== null || 
        e.formData
      ) return;
      
      const url = new URL(e.destination.url);
      const param = Object.create(null);
      
      let handler = this.routes[url.pathname];
      if(!handler) {
        const route = this.#matchRoute(url.pathname);
        if(route){
          const path = route.split("/");
          const values = url.pathname.split("/");

          if (values.length === path.length){
            const regex = /:(\w|\d)+/;
            for (const [index, name] of path.entries()){
              if (regex.test(name)) 
                param[name.slice(1)] = values[index];
            }
          }
        }
        handler = this.routes[route] ?? this.routes[404];
        if(!handler) return;
      }

      e.intercept({
        focusReset: this.options.autoFocus ? "after-transition" : "manual",
        scroll: this.options.autoScroll ? "after-transition" : "manual",
        handler: handler.bind(this, e, url, param)
      });
    });
    
    //Navigation API doesn't trigger "navigate" on page first load
    this.navigate();
  }
}