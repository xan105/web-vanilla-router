/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

/*
Open Graph protocol: https://ogp.me/
*/

function clearMetadata(){
  [
    ...document.head.querySelectorAll("meta[property^=\"og:\"]"),
    ...document.head.querySelectorAll("meta[property^=\"article:\"]"),
    ...document.head.querySelectorAll("meta[property^=\"book:\"]"),
    ...document.head.querySelectorAll("meta[property^=\"profile:\"]"),
    ...document.head.querySelectorAll("meta[property^=\"video:\"]"),
    ...document.head.querySelectorAll("meta[property^=\"music:\"]"),
    ...document.head.querySelectorAll("link[rel^=\"canonical\"]")
  ]
  .forEach(el => document.head.removeChild(el));
}

export function updateMetadata(data){
  if (!Array.isArray(data)) return;

  const prefix = ["og: https://ogp.me/ns/#"];
  
  clearMetadata();

  for (const { name, content, details } of data)
  {
    switch (name){
      case "title": {
        document.title = content;
        break;
      }
      case "description": {
        const element = document.head.querySelector(`meta[name="${name}"]`) ??
                        document.head.appendChild(document.createElement("meta"));      
        element.setAttribute("name", name);         
        element.setAttribute("content", content);
        break;
      }
      case "url": {
        const element = document.head.querySelector(`link[rel="canonical"]`) ??
                        document.head.appendChild(document.createElement("link"));
        element.setAttribute("rel", canonical);
        element.setAttribute("href", content);
        break;
      }
      case "type": {
        const schema = `${content}: https://ogp.me/ns/${content}#`;
        prefix.push(schema);
        break;
      }
    }

    //General Open Graph Meta Tags
    const element = document.createElement("meta");
    element.setAttribute("property", "og:" + name);
    element.setAttribute("content", content);
    document.head.appendChild(element);

    //Handle article-specific details (like tags, author, published_time, etc.)
    for (const [ key, value ] of Object.entries(details ?? {}))
    { 
      const array = Array.isArray(value) ? value : [value];
      for (const entry of array) {
        const element = document.createElement("meta");
        if(name === "type"){
          const [ type, ] = content.split(".");
          element.setAttribute("property", type + ":" + key);
        }
        else {
          element.setAttribute("property", "og:" + name + ":" + key);
        }
        element.setAttribute("content", entry);
        document.head.appendChild(element);
      }
    }
  }
  
  document.head.setAttribute("prefix", prefix.join(" "));
}