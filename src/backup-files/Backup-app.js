import React, { useState, useRef, useEffect } from "react";
import TodoList from "./backup-files/TodoList";
import uuidv4 from "uuid/v4";

const TODO_STORAGE = "app.todos";
function BackupApp() {
  const [todos, setTodos] = useState([]);
  var typed = useState();
  const todoRef = useRef();

  useEffect(() => {
    const storageTodos = localStorage.getItem(TODO_STORAGE);
    if (storageTodos) setTodos(JSON.parse(storageTodos));
  }, []);

  useEffect(() => {
    localStorage.setItem(TODO_STORAGE, JSON.stringify(todos));
  }, [todos]);

  function addTodo(e) {
    typed = todoRef.current.value;
    console.log(typed);
    todoRef.current.value = null;
    setTodos(prevTodos => {
      return [...prevTodos, { id: uuidv4(), name: typed, checked: false }];
    });
  }
  return (
    <>
      <TodoList todos={todos} />
      <input ref={todoRef} type="text" />
      <button onClick={addTodo}>Add TODO</button>
      <button>Clear TODO</button>
      <div>0 left Todo</div>
    </>
  );
}

export default BackupApp;
