async function loadDictionary() {
  const response = await fetch(chrome.runtime.getURL("dictionary.json"));
  return await response.json();
}

function highlightText(node, dictionary) {
  let text = node.nodeValue;
  let replaced = false;
  let replacementHTML = text;

  // Recorremos todas las palabras del diccionario
  for (let word in dictionary) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    if (regex.test(replacementHTML)) {
      replaced = true;
      replacementHTML = replacementHTML.replace(regex, (match) => {
        return `<span class="inclusive-highlight" data-suggestion="${dictionary[word]}">${match}</span>`;
      });
    }
  }

  if (replaced) {
    const span = document.createElement("span");
    span.innerHTML = replacementHTML;
    node.parentNode.replaceChild(span, node);
  }

  return replaced;
}

function walkDOM(dictionary) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  let nodes = [];
  
  // Primero recolectamos todos los nodos para evitar problemas con el DOM cambiante
  while ((node = walker.nextNode())) {
    if (node.parentNode && node.parentNode.nodeName !== "SCRIPT" && node.nodeValue.trim() !== "") {
      nodes.push(node);
    }
  }
  
  // Luego procesamos cada nodo
  nodes.forEach(node => {
    highlightText(node, dictionary);
  });
}

loadDictionary().then((dictionary) => {
  // Primer escaneo
  walkDOM(dictionary);

  // 👀 Re-escanea cuando cambia la página
  const observer = new MutationObserver(() => walkDOM(dictionary));
  observer.observe(document.body, { childList: true, subtree: true });
});