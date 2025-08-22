async function loadDictionary() {
  const response = await fetch(chrome.runtime.getURL("dictionary.json"));
  return await response.json();
}

function highlightText(node, dictionary) {
  let text = node.nodeValue;
  let replaced = false;
  let replacementHTML = text;

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
  let foundBias = false;
  
  while ((node = walker.nextNode())) {
    if (node.parentNode && node.parentNode.nodeName !== "SCRIPT" && node.nodeValue.trim() !== "") {
      nodes.push(node);
    }
  }
  
  nodes.forEach(node => {
    if (highlightText(node, dictionary)) {
      foundBias = true;
    }
  });

  return foundBias;
}

function showBanner(message, color) {
  // Eliminar banners previos
  const existing = document.getElementById("inclusive-banner");
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.id = "inclusive-banner";
  banner.textContent = message;
  banner.style.position = "fixed";
  banner.style.top = "0";
  banner.style.left = "0";
  banner.style.width = "100%";
  banner.style.backgroundColor = color;
  banner.style.color = "white";
  banner.style.textAlign = "center";
  banner.style.padding = "10px";
  banner.style.zIndex = "9999";
  banner.style.fontFamily = "Arial, sans-serif";
  banner.style.fontWeight = "bold";

  document.body.appendChild(banner);

  // ⏳ Eliminar automáticamente después de 5 segundos
  setTimeout(() => {
    if (banner && banner.parentNode) {
      banner.remove();
    }
  }, 3000);
}

loadDictionary().then((dictionary) => {
  function scanPage() {
    const foundBias = walkDOM(dictionary);
    if (foundBias) {
      showBanner("⚠️ Se detectaron posibles sesgos en la página", "#f44336"); // rojo
    } else {
      showBanner("✅ Página sin sesgos detectados", "#4CAF50"); // verde
    }
  }

  // Primer escaneo
  scanPage();

  let scanTimeout;
  const observer = new MutationObserver(() => {
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => scanPage(), 2000); // espera 2s antes de reescaneo
  });
  // Re-escanea en cambios del DOM
  // const observer = new MutationObserver(() => scanPage());
  //observer.observe(document.body, { childList: true, subtree: true });
});
