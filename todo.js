/**
 * Manages todo list items by priority
 * @param {Array} items - Array of todo items
 * @param {number} priorityType - Priority type (1: high, 2: medium, 3: low)
 * @returns {Object} Categorized todo lists
 */
function manageTodoList(items, priorityType) {
  // Constants definition
  const MAX_ITEMS = 10;
  const PRIORITY = {
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  // Input validation
  if (!Array.isArray(items)) {
    console.error("Valid array required");
    return null;
  }

  if (items.length > MAX_ITEMS) {
    console.error(`Maximum of ${MAX_ITEMS} items allowed`);
    return null;
  }

  // Todo filtering
  const todoItems = [];
  const completedItems = items.filter((item) => {
    const isDone = item.done === true;
    if (!isDone) {
      // Set priority
      switch (priorityType) {
        case PRIORITY.HIGH:
          item.priority = "high";
          break;
        case PRIORITY.MEDIUM:
          item.priority = "medium";
          break;
        default:
          item.priority = "low";
      }
      todoItems.push(item);
    }
    return isDone;
  });

  // Result logging (separated function)
  logItems("Todo", todoItems);
  logItems("Completed", completedItems);

  return {
    todos: todoItems,
    completed: completedItems,
  };
}

/**
 * Helper function to log items
 */
function logItems(label, items) {
  items.forEach((item) => {
    console.log(`${label}: ${item.text}`);
  });
}
