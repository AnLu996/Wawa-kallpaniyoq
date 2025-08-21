async function loadDictionary() {
  // Cargar el diccionario local
  const response = await fetch(chrome.runtime.getURL("dictionary.json"));
  return await response.json();
}

function highlightText(node, dictionary) {
  let text = node.nodeValue;
  for (let word in dictionary) {
    if (text.toLowerCase().includes(word.toLowerCase())) {
      const span = document.createElement("span");
      span.className = "inclusive-highlight";
      span.textContent = text;
      span.setAttribute("data-suggestion", dictionary[word]);

      node.parentNode.replaceChild(span, node);
      break;
    }
  }
}

function walkDOM(dictionary) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentNode && node.parentNode.nodeName !== "SCRIPT") {
      highlightText(node, dictionary);
    }
  }
}

loadDictionary().then((dictionary) => {
  walkDOM(dictionary);
});
