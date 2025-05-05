dataService.getData().then(setData);

// GOOD: Error handling
dataService.getData()
  .then(setData)
  .catch(error => {
    console.error('Failed to fetch data:', error);
    setError('Unable to load data. Please try again.');
  });

// ALSO GOOD: Using async/await with try-catch
async function loadData() {
  try {
    const data = await dataService.getData();
    setData(data);
  } catch (error) {
    console.error('Failed to fetch data:', error);
    setError('Unable to load data. Please try again.');
  }
}
Related Files:

src/utils/errorHandling.js
src/hooks/useAsyncData.js

Components
StateManager
Purpose:
Provides centralized state management for the application, with support for both local and global state.
Interfaces:

createStore(initialState): Creates a new state store with the provided initial state
useStore(selector): Hook to access and subscribe to store state
dispatch(action): Method to update store state via actions

Dependencies:

EventEmitter
LocalStorage

Implementation: src/state/StateManager.js
APIClient
Purpose:
Handles all communication with backend APIs, including request formatting, authentication, and error handling.
Interfaces:

request(endpoint, options): Makes a request to the specified endpoint
get(endpoint): Shorthand for GET requests
post(endpoint, data): Shorthand for POST requests
setAuthToken(token): Sets the authentication token for subsequent requests

Dependencies:

StateManager (for auth state)
ErrorLogger

Implementation: src/api/APIClient.js
Patterns
Repository Pattern
Problem:
Components need access to data from multiple sources (API, local storage, etc.) without being coupled to the specific data sources.
Solution:
Create repository classes that abstract data access. These repositories provide a consistent interface regardless of where the data comes from.
Example:
javascriptclass UserRepository {
  constructor(apiClient, cacheService) {
    this.apiClient = apiClient;
    this.cacheService = cacheService;
  }

  async getUser(id) {
    // Try cache first
    const cached = this.cacheService.get(`user_${id}`);
    if (cached) return cached;

    // Fall back to API
    const user = await this.apiClient.get(`/users/${id}`);
    this.cacheService.set(`user_${id}`, user);
    return user;
  }
}

// Usage in component:
const userRepo = new UserRepository(apiClient, cacheService);
const user = await userRepo.getUser(123);
When to use:
Use this pattern when components need to access data that may come from different sources or when you want to decouple data access logic from presentation logic.