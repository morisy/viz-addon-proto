class AsyncQueue {
    constructor(requestsPerSecond) {
        this.requestsPerSecond = requestsPerSecond;
        this.queue = [];
        this.processing = false;
    }

    enqueue() {
        return new Promise((resolve, reject) => {
            this.queue.push({ resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const startTime = Date.now();
            const request = this.queue.shift();
            request.resolve();

            const timeElapsed = Date.now() - startTime;
            const delay = Math.max((1000 / this.requestsPerSecond) - timeElapsed, 0);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.processing = false;
    }
}




class DocumentCloudAPI {
    constructor(apiKey) {
         // apiKey is not required when using the logged-in user's session.
        // Make sure the user is logged in to DocumentCloud.org before using this API.

        this.apiKey = apiKey;
        this.API_BASE_URL = 'https://api.www.documentcloud.org/api';
        this.AUTH_BASE_URL = 'https://accounts.muckrock.com';

        this.REQUESTS_PER_SECOND = 10;
        this.requestQueue = new AsyncQueue(this.REQUESTS_PER_SECOND);
        this.accessToken = null;

    }

    _getCsrfToken() {
      const cookieValue = document.cookie.match('(^|;)\\s*' + 'csrftoken' + '\\s*=\\s*([^;]+)');
      return cookieValue ? cookieValue.pop() : '';
  }
  
// Helper method for adding authentication headers
_getAuthHeaders() {
  return {
      'Authorization': `Token ${this.apiKey}`,
      'X-CSRFToken': this._getCsrfToken(),
  };
}



async _fetch(endpoint, options = {}) {
  const url = `${this.API_BASE_URL}${endpoint}`;

    console.log('Request URL:', url);
    console.log('Request Method:', options.method || 'GET');
    if (options.body) {
      console.log('Request Body:', options.body);
    }

  const response = await fetch(url, {
      ...options,
      headers: {
          ...options.headers,
          ...this._getAuthHeaders(),
      },
  });

  if (!response.ok) {
      throw new Error(
          `Request failed with status ${response.status} at endpoint: ${url}. Response text: ${await response.text()}`
      );
  }

  const responseData = await response.json();
  if (responseData.error) {
      throw new Error(
          `Error in response data for endpoint: ${url}. Error: ${responseData.error}`
      );
  }

  return responseData;
}

// Authentication check
async isLoggedIn() {
  const url = `${this.API_BASE_URL}/users/me/`;
  try {
      const response = await fetch(url, { credentials: "include" });
      return response.ok;
  } catch (error) {
      return false;
  }
}

// General API GET request
async apiGet(endpoint, params = {}) {
  const url = new URL(`${this.API_BASE_URL}${endpoint}`);
  url.search = new URLSearchParams(params).toString();

  try {
      const response = await fetch(url, {
          headers: { ...this._getAuthHeaders() },
          credentials: "include",
      });

      if (!response.ok) {
          throw new Error(
              `Request failed with status ${response.status} at endpoint: ${url}. Response text: ${await response.text()}`
          );
      }

      const data = await response.json();
      return { data };
  } catch (error) {
      console.error(`Error in API call to ${endpoint}:`, error);
      return null;
  }
}


// Fetch User
async fetchUser(userId) {
  const endpoint = `/users/${userId}/`;
  const response = await this.apiGet(endpoint);
  if (response && response.data) {
      return response.data;
  } else {
      throw new Error("Failed to fetch user");
  }
}

    /// Search Endpoints
    async searchDocuments(query, options) {
        const params = new URLSearchParams({
            q: query,
            ...options,
        });
    
        const response = await this._fetch(
            `/documents/search?${params.toString()}`
        );
    
        return response;
    }


    async listResources(resource, queryParams = {}) {
        const endpoint = `/${resource}/`;
        const data = await this._fetch(endpoint, {
            headers: {
                ...queryParams
            }
        });
    
        if (data.error) {
            throw new Error(`Failed to list resources: ${data.error}`);
        }
        return data;
    }
    
async getResourceById(resource, id) {
    const endpoint = `/${resource}/${id}/`;
    const data = await this._fetch(endpoint);

    if (data.error) {
        throw new Error(`Failed to get resource by ID: ${data.error}`);
    }
    return data;
}

async createResource(resource, data) {
    const endpoint = `/${resource}/`;
    const responseData = await this._fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (responseData.error) {
        throw new Error(`Failed to create resource: ${responseData.error}`);
    }
    return responseData;
}

async updateResource(resource, id, data) {
    const endpoint = `/${resource}/${id}/`;
    const responseData = await this._fetch(endpoint, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (responseData.error) {
        throw new Error(`Failed to update resource: ${responseData.error}`);
    }
    return responseData;
}

async deleteResource(resource, id) {
    const endpoint = `/${resource}/${id}/`;
    const response = await this._fetch(endpoint, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to delete resource: ${response.statusText}`);
    }
}

async getSubResource(resource, id, subResource, subResourceId) {
    const endpoint = subResourceId
        ? `/${resource}/${id}/${subResource}/${subResourceId}/`
        : `/${resource}/${id}/${subResource}/`;

    const data = await this._fetch(endpoint);

    if (data.error) {
        throw new Error(`Failed to get subresource: ${data.error}`);
    }
    return data;
}


  
// Function to get a presigned URL for direct file upload
async getPresignedUrl(documentData) {
    const response = await fetch(this.API_BASE_URL + "/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`,
      },
      body: JSON.stringify(documentData),
    });
  
    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.statusText}`);
    }
  
    return await response.json();
  }

  async generateEmbedCode(url, maxwidth, maxheight) {
    const params = new URLSearchParams();
    params.append("url", url);
    if (maxwidth) {
      params.append("maxwidth", maxwidth);
    }
    if (maxheight) {
      params.append("maxheight", maxheight);
    }

    const response = await this.apiGet("/api/oembed/", params);
    return response.data;
  }


  

async getDocument(documentId) {
  try {
    const response = await this.apiGet(`/documents/${documentId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document:', error);
  }
}

// Notes Endpoints

async getDocumentNotes(documentId, accessLevel = null) {
  const endpoint = `/documents/${documentId}/notes/`;
  const response = await this.apiGet(endpoint);

  if (response && response.data) {
      const data = response.data;
      if (accessLevel) {
          return {
              ...data,
              results: data.results.filter((note) => note.access === accessLevel),
          };
      } else {
          return data;
      }
  } else {
      throw new Error("Error fetching document notes");
  }
}


  async createNote(documentId, title, pageNumber, content = null, x1 = null, x2 = null, y1 = null, y2 = null) {
    const url = `${this.AUTH_BASE_URL}/documents/${documentId}/notes/`;
    const data = { title, pageNumber };
  
    if (content) data.content = content;
    if (x1 !== null && x2 !== null && y1 !== null && y2 !== null) {
      data.x1 = x1;
      data.x2 = x2;
      data.y1 = y1;
      data.y2 = y2;
    }
  
    const response = await this._fetch(url, {
      method: 'POST',
      headers: { ...this._getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  
    if (!response.ok) {
      throw new Error(`Error creating note: ${response.statusText}`);
    }
  
    return await response.json();
  }

  async updateNote(documentId, noteId, data) {
    const url = `${this.AUTH_BASE_URL}/documents/${documentId}/notes/${noteId}/`;
  
    const response = await this._fetch(url, {
      method: 'PUT',
      headers: { ...this._getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  
    if (!response.ok) {
      throw new Error(`Error updating note: ${response.statusText}`);
    }
  
    return await response.json();
  }
  
  
/// Upload Endpoints
  // Function to upload document using a publicly accessible URL
async  uploadDocumentByUrl(documentData) {
    const response = await fetch(this.API_BASE_URL + "/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.token}`,
      },
      body: JSON.stringify(documentData),
    });
  
    if (!response.ok) {
      throw new Error(`Failed to upload document: ${response.statusText}`);
    }
  
    return await response.json();
  }

  // Function to upload document using direct file upload
  async uploadDocumentDirect(documentData, file) {
    const { presigned_url } = await getPresignedUrl(documentData);
  
    const uploadResponse = await fetch(presigned_url, {
      method: "PUT",
      body: file,
    });
  
    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload document: ${uploadResponse.statusText}`);
    }
  
    return { success: true };
  }
  



async fetchUser(userId) {
    const url = `${this.API_BASE_URL}/users/${userId}/`;
    const response = await fetch(url, { credentials: "include" });
    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        throw new Error("Failed to fetch user");
    }
}

/// Project Endpoints

async getProjects(searchParams = {}) {
  const params = new URLSearchParams(searchParams);
  const response = await this._fetch(`/projects/?${params.toString()}`);
  return response;
}


  async createProject(title, description = "", privateProject = false) {
    const data = { title, description, private: privateProject };
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    return await this._fetch('/projects/', options);
  }

  async getProject(id) {
    return await this._fetch(`/projects/${id}/`);
  }

  async updateProject(id, data) {
    const options = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    return await this._fetch(`/projects/${id}/`, options);
  }

  async deleteProject(id) {
    return await this._fetch(`/projects/${id}/`, { method: 'DELETE' });
  }

  async getProjectDocuments(projectId, filters = {}) {
    const params = new URLSearchParams(filters);
    return await this._fetch(`/projects/${projectId}/documents/?${params.toString()}`);
  }

  async addDocumentToProject(projectId, documentId, editAccess = true) {
    const data = { document: documentId, edit_access: editAccess };
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    return await this._fetch(`/projects/${projectId}/documents/`, options);
  }

  async removeDocumentFromProject(projectId, documentId) {
    return await this._fetch(`/projects/${projectId}/documents/${documentId}/`, { method: 'DELETE' });
  }

  async getProjectCollaborators(projectId) {
    return await this._fetch(`/projects/${projectId}/users/`);
  }

  async addCollaboratorToProject(projectId, email, access = "view") {
    const data = { email, access };
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
    return await this._fetch(`/projects/${projectId}/users/`, options);
  }

  async removeCollaboratorFromProject(projectId, userId) {
    return await this._fetch(`/projects/${projectId}/users/${userId}/`, { method: 'DELETE' });
  }

  


}

export default DocumentCloudAPI;

export async function showPrompt(api) {
  const isLoggedIn = await api.isLoggedIn();
  const promptElement = document.getElementById('prompt');
  const promptTextElement = document.getElementById('prompt-text');

  if (isLoggedIn) {
    const user = await api.fetchUser("me");
    const organization = user.organization_name;
    promptTextElement.innerHTML = `Logged in as ${user.username}.`;
  } else {
    promptTextElement.innerHTML = `Please <a href="https://accounts.muckrock.com/accounts/login/?next=documentcloud.org?intent=documentcloud" target="_blank">log in</a> or <a href="https://accounts.muckrock.com/accounts/signup/?intent=documentcloud" target="_blank">create an account</a>.`;
  }

  promptElement.style.display = 'block';

  document.getElementById('prompt-dismiss').addEventListener('click', () => {
    document.getElementById('prompt').style.display = 'none';
  });
}