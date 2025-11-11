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
.on("/", function(event, url){
  console.log("hello world");
  
  updateMetadata([
    { name: "title", content: "Xan" },
    { name: "description", content: "Lorem Ipsum" },
    { name: "url", content: "http://localhost" },
    { name: "type", content: "website" }
  ]);
})
.on("/test", async(event, url) => {
  console.log(event, url);
  
  updateMetadata([
    { name: "title", content: "Xan - test" },
    { name: "description", content: "Lorem Ipsum" },
    { name: "url", content: "http://localhost" },
    { name: "type", content: "website" }
  ]);
})
//Parameterized routes
.on("/user/:id", (event, url, param) => {
  const { id } = param;
  console.log(id);
})
.on("/user/:id/:subid", (event, url, param) => {
  const { id, subid } = param;
  console.log(id, subid);
})
//Options overrides
.on("/options", (event, url) => {
  console.log(event, url);
  event.commit();
}, { deferredCommit: true })
//Optional "not found" hook
.on(404, (event, url) => {
  console.error("no route found ! (404)");
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