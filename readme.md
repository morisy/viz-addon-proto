This JavaScript wrapper provides a convenient way to interact with the DocumentCloud API. It handles authentication, makes API calls, and provides an easy-to-use interface for accessing different API endpoints.

## Usage

To use this wrapper, import `documentcloud-api.js` into your project:

```
<script type="module">
  import DocumentCloudAPI from './documentcloud-api.js';
</script>
```

Then, create an instance of `DocumentCloudAPI`. It will pick up an API key from any viewer of the page, so none is needed to be passed in:


```
const api = new DocumentCloudAPI();
```

Make sure the user is logged in to DocumentCloud.org before using the API.

## Authenticating Users

To create a dismissible prompt that hovers over the page, based on the user's state, include the following HTML inside the `<body>` tag:

```
<div id="prompt" style="display: none; position: fixed; top: 20px; right: 20px; padding: 10px; background-color: #f2dede; border: 1px solid #ebccd1; border-radius: 5px;">
  <span id="prompt-text"></span>
  <button id="prompt-dismiss" style="margin-left: 10px;">Dismiss</button>
</div>
```

Inside your projects JavaScript file, import the `showPrompt` function and call it:

```
import DocumentCloudAPI, { showPrompt } from './documentcloud-api.js';

const api = new DocumentCloudAPI();

// Call the function to show the prompt
showPrompt(api);
```

This code will create a dismissible prompt that hovers over the page, showing a message based on the user's state. If the user is not logged in, it prompts them to either log in or create an account. If the user is logged in, it displays the user's username and associated organization. Both prompts are dismissible by clicking the "Dismiss" button.


## Methods

Below are some examples of how to use the methods provided by the `DocumentCloudAPI` wrapper.

### Check Users Projects

```
const isLoggedIn = await api.isLoggedIn();
if (isLoggedIn) {
  console.log('The user is logged in');
} else {
  console.log('The user is not logged in');
}
```

### Get documents within a project

```
const projectId = 'your-project-id';
const documents = await api.getProjectDocuments(projectId);
console.log('Documents:', documents);
```

### Get collaborators of a project

```
const projectId = 'your-project-id';
const collaborators = await api.getProjectCollaborators(projectId);
console.log('Collaborators:', collaborators);
```

### Fetch a user by their ID
```
const userId = 'your-user-id';
const user = await api.fetchUser(userId);
console.log('User details:', user);
```

### Custom API Calls
If you need to make a custom API call, you can use the `apiGet` method. It accepts an endpoint as its first argument and an optional `params` object as its second argument:
```
const endpoint = '/your-custom-endpoint/';
const params = { key: 'value' };
const response = await api.apiGet(endpoint, params);
console.log('API Response:', response);
```

For example, to fetch a specific document by its ID:
```
const documentId = 'your-document-id';
const response = await api.apiGet(`/documents/${documentId}/`);
console.log('Document details:', response);
```

Please refer to the [DocumentCloud API documentation](https://www.documentcloud.org/help/api) for a complete list of available endpoints and their corresponding parameters.
