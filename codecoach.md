
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

StateManager (for auth stat
