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
