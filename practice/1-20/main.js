import { addTask } from "./todo.js";
import { getTasks } from "./todo.js";
import { deleteTask } from "./todo.js";
import { clearTasks } from "./todo.js";
import { getTasksAsJson } from "./todo.js";

function printTasks() {
    let tasks = getTasks();

    if (tasks.length === 0){
        console.log("Your list is empty")
        return;
    };

    tasks.forEach((task, i) => {
        console.log(`${i + 1}: `, task);
    });
}

function printTasksFromJson() {
    let tasks = JSON.parse(getTasksAsJson());

    if (tasks.length === 0){
        console.log("Your list is empty")
        return;
    };

    tasks.forEach((task) => {
        console.log(`${task.number}: `, task.task);
    });
}

addTask("Cook Food");
addTask("Go for a walk");
addTask("Do homework");

printTasks();
console.log("Removed task: ", deleteTask(2));
printTasks();

try {
  deleteTask(42);
} catch (error) {
  console.log(error.message);
}

console.log(getTasksAsJson());

printTasksFromJson();