import DocumentCloudAPI, { showPrompt } from './documentcloud-api.js';



const projectIds = {
  unreviewed: 211312,
  nonSensitive: 212657,
  sensitive: 212658,
};

async function getNextUnreviewedDocument(api) {
  console.log('Getting next unreviewed document...');
  const unreviewedDocuments = await api.getProjectDocuments(projectIds.unreviewed);
  for (const unreviewedDoc of unreviewedDocuments.results) {
    console.log(`Checking unreviewed document: ${unreviewedDoc.document}`);
    const nonSensitiveDocuments = await api.getProjectDocuments(projectIds.nonSensitive, { document: unreviewedDoc.document });
    const sensitiveDocuments = await api.getProjectDocuments(projectIds.sensitive, { document: unreviewedDoc.document });

    if (nonSensitiveDocuments.count === 0 && sensitiveDocuments.count === 0) {
      return unreviewedDoc;
    }
  }
  console.log('No unreviewed document found.');
  return null;
}
async function reviewDocument(api, documentId, isSensitive) {
  if (isSensitive) {
    await api.addDocumentToProject(projectIds.sensitive, documentId);
  } else {
    await api.addDocumentToProject(projectIds.nonSensitive, documentId);
  }
}



async function fetchCounts(api) {
  const nonSensitiveProjectData = await api.getProjectDocuments(212657);
  const sensitiveProjectData = await api.getProjectDocuments(212658);

  const nonSensitiveCount = nonSensitiveProjectData.count;
  const sensitiveCount = sensitiveProjectData.count;
  const totalCount = nonSensitiveCount + sensitiveCount;
  const falsePositiveRate = (nonSensitiveCount / totalCount) * 100;

  document.getElementById("nonSensitiveCount").textContent = nonSensitiveCount;
  document.getElementById("sensitiveCount").textContent = sensitiveCount;
  document.getElementById("falsePositiveRate").textContent = `${falsePositiveRate.toFixed(2)}%`;
}

export async function main() {
  const api = new DocumentCloudAPI();
const userUrl = "https://api.www.documentcloud.org/api/users/me/";
    console.log('Starting the review app...');

  try {
    await showPrompt(api);

    const response = await fetch(userUrl, { credentials: "include" });
    if (response.ok) {
      const userData = await response.json();
      const apiKey = userData.api_key;

      const userApi = new DocumentCloudAPI(apiKey); // Changed variable name here

      const nextUnreviewedDoc = await getNextUnreviewedDocument(userApi);
      console.log('Next unreviewed document:', nextUnreviewedDoc);
      if (nextUnreviewedDoc) {
        const notes = await api.getDocumentNotes(nextUnreviewedDoc.document);
        console.log('Notes:', notes);
      
        // Embed the document
        const embedUrl = `https://embed.documentcloud.org/documents/${nextUnreviewedDoc.document}`;
        console.log('Embed URL:', embedUrl);
      
        setTimeout(() => {
          const documentViewer = document.getElementById("documentViewer");
          console.log("documentViewer:", documentViewer);

          documentViewer.src = embedUrl;
        }, 2000);
        
      
        // Display the notes
        const notesList = document.getElementById("notes-list");
        notesList.innerHTML = "";
        notes.results.forEach(note => {
          const listItem = document.createElement("li");
          listItem.textContent = `Page ${note.page_number}: ${note.title} - ${note.content}`;
          notesList.appendChild(listItem);
        });
      
        // Add event listeners for the buttons

        const nonSensitiveButton = document.getElementById("markAsNonSensitive");
        const sensitiveButton = document.getElementById("markAsSensitive");
        const skipButton = document.getElementById("skip");
        console.log("nonSensitiveButton:", nonSensitiveButton);
        console.log("sensitiveButton:", sensitiveButton);
        console.log("skipButton:", skipButton);
        
        nonSensitiveButton.addEventListener("click", async () => {
          try {
            await reviewDocument(userApi, nextUnreviewedDoc.document, false);
            main();
          } catch (error) {
            console.error('Error while marking as non-sensitive:', error.message);
          }
        });
        
        sensitiveButton.addEventListener("click", async () => {
          try {
            await reviewDocument(userApi, nextUnreviewedDoc.document, true);
            main();
          } catch (error) {
            console.error('Error while marking as sensitive:', error.message);
          }
        });
        
        skipButton.addEventListener("click", () => {
          main();
        });
        
      } else {
        console.log('No more unreviewed documents.');
      }
      
      // Update the counts of sensitive and non-sensitive documents
      fetchCounts(api);
      
      } else {
        throw new Error("Failed to authenticate");
      }
    } catch (error) {
      console.error('Error:', error);    }
  }

