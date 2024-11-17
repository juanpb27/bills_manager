let dropArea = document.getElementById('drop-area');
let fileElem = document.getElementById('fileElem');
let gallery = document.getElementById('gallery');
let extractButton = document.getElementById('extractButton');
let downloadButton = document.getElementById('downloadButton');
let resultsDiv = document.getElementById('results');
let markdownResults = document.getElementById('markdownResults');
let uploadedFiles = [];

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
  dropArea.classList.add('highlight');
}

function unhighlight(e) {
  dropArea.classList.remove('highlight');
}

dropArea.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
  let dt = e.dataTransfer;
  let files = dt.files;
  handleFiles(files);
}

function handleFiles(files) {
  uploadedFiles = [...files];
  extractButton.disabled = uploadedFiles.length === 0;
  gallery.innerHTML = '';
  ([...files]).forEach(previewFile);
}

function previewFile(file) {
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = function() {
    let img = document.createElement('img');
    img.src = reader.result;
    gallery.appendChild(img);
  }
}

extractButton.addEventListener('click', handleExtraction);

function handleExtraction() {
  if (uploadedFiles.length === 0) return;

  extractButton.disabled = true;
  extractButton.textContent = 'Processing...';

  const formData = new FormData();
  uploadedFiles.forEach(file => formData.append('files', file));

  fetch('http://127.0.0.1:8000/extract', {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error);
      }
      window.extractedEntities = data.data || data; // Guardar los datos extraídos
      displayResults(window.extractedEntities);
      extractButton.textContent = 'Extract Entities';
      extractButton.disabled = false;
      resultsDiv.style.display = 'block';
    })
    .catch(error => {
      console.error(error);
      alert('Failed to extract text from images: ' + error.message);
      extractButton.textContent = 'Extract Entities';
      extractButton.disabled = false;
    });
}

function displayResults(data) {
    let markdown = '';
  
    data.forEach((item, index) => {
      // Asume que 'text' contiene el contenido relevante
      if (item.text) {
        markdown += `## Bill ${index + 1}\n\n`;
        markdown += `${item.text}\n\n`; // Agrega el contenido del texto extraído
      }
    });
  
    markdownResults.innerHTML = marked.parse(markdown);
  }
  

downloadButton.addEventListener('click', () => {
  let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.extractedEntities, null, 2));
  let downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "extracted_entities.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});