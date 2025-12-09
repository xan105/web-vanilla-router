if (!("navigation" in window)) {
  await import("@virtualstate/navigation/polyfill");
  console.log("Using @virtualstate/navigation polyfill!");
}

import { Router, updateMetadata } from "@xan105/vanilla-router";

const router = new Router({ autoFire: false });

router.addEventListener("error", ({detail})=> { console.error(detail) });
router.addEventListener("will-navigate", ({detail})=> { console.log("will-navigate", detail) });
router.addEventListener("did-navigate", ({detail})=> { console.info("did-navigate", detail) });

router
.on("/", function(event){
  console.log("hello world");
  
  updateMetadata([
    { name: "title", content: "Xan" },
    { name: "description", content: "Lorem Ipsum" },
    { name: "url", content: "http://localhost" },
    { name: "type", content: "website" }
  ]);
})
.on("/redirect", function(){
  this.redirect("/hello");
})
.on("/hello", (event, url) => {
  console.log("hello world!")
})
.on("/test", async(event, params) => {
  console.log(event, params);
  
  updateMetadata([
    { name: "title", content: "Xan - test" },
    { name: "description", content: "Lorem Ipsum" },
    { name: "url", content: "http://localhost" },
    { name: "type", content: "website" }
  ]);
})
//Parameterized routes
.on("/user/:id", (event, { routeParams }) => {
  console.log(routeParams);
})
.on("/user/:id/:subid", (event, { routeParams }) => {
  console.log(routeParams);
})
//Query parameters
.on("/target", (event, { searchParams }) => {
  console.log(searchParams);
})
//Options overrides
.on("/options", (event) => {
  console.log(event);
  event.commit();
}, { deferredCommit: true })
//Optional "not found" hook
.on(404, (event) => {
  console.error(event, "no route found ! (404)");
})
.listen();

const { redirect } = sessionStorage;
delete sessionStorage.redirect;
if (redirect && redirect !== location.pathname){
  console.log("redirecting");
  navigation.navigate(redirect, { history: "replace" });
}
else{
  console.log("self exec");
  navigation.navigate("/test", { history: "replace" });
}