function todo_manager(list, TYPE) {
  // Inconsistent naming convention (mixed camelCase and snake_case)
  let todoList = [];
  let completed_items = [];

  // No type checking + Magic numver
  if (list.length > 10) {
    console.log("Error: Too many items");
    return null;
  }

  // Duplicate code and long loop
  for (var i = 0; i < list.length; i++) {
    // Use of == causing potential type issues
    if (list[i].done == true) {
      completed_items.push(list[i]);
    } else {
      // Magic numbers and nested conditionals
      if (TYPE == 1) {
        list[i].priority = "high";
      } else if (TYPE == 2) {
        list[i].priority = "medium";
      } else {
        list[i].priority = "low";
      }
      todoList.push(list[i]);
    }
  }

  // Unnecessary duplicate logic
  for (var j = 0; j < todoList.length; j++) {
    console.log("Todo: " + todoList[j].text);
  }

  for (var k = 0; k < completed_items.length; k++) {
    console.log("Completed: " + completed_items[k].text);
  }

  return {
    todos: todoList,
    completed: completed_items,
  };
}
