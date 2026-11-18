

const toDoList = [];


export function addTask(task) {
    if (!task) throw new Error("No task set");

    toDoList.push(task);
    return toDoList.length;
}

export function getTasks() {
    return [...toDoList];
}

function displayTasks() {
    if (toDoList.length === 0) {
        console.log("Your to-do list is empty.")
    }
    else {
        console.log("Your to-do list:")
        toDoList.forEach((element, index) => {
            console.log(`${index + 1}.  ${element}`)

        });
    }

}

export function deleteTask(number) {
    if (number < 1 || number > toDoList.length) throw new Error("Invalid number");

    return toDoList.splice(number - 1, 1);
}

export function clearTasks() {
    toDoList.length = 0;
}

export function getTasksAsJson() {
    let tasks = getTasks();

    let newTasks = [];
    tasks.forEach((task, i) => {
        newTasks.push({
            number: i + 1,
            task: task
        });
    });

    return JSON.stringify(newTasks, null, 2);
}