import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { addTask, getTasks, clearTasks, deleteTask, getTasksAsJson, getTaskList, getTask } from './todo.js'

// The list lives in the module, so empty it before each test.
beforeEach(() => clearTasks())

test('a new list is empty', () => {
    assert.deepEqual(getTasks(), [])
})

test('addTask adds a task last in the list', () => {
    addTask('Wash clothes')
    addTask('Do the dishes')
    assert.deepEqual(getTasks(), ['Wash clothes', 'Do the dishes'])
})

test('addTask throws on an empty task', () => {
    assert.throws(() => addTask(''), 'Error: No task set')
})

test('deleteTask removes by number, starting at 1', () => {
    addTask('Wash clothes');
    addTask('Do the dishes');
    assert.equal(deleteTask(1)[0], "Wash clothes");
    assert.equal(getTasks()[0], "Do the dishes");
})

test('deleteTask throws on a number outside the list', () => {
    addTask('Wash clothes');
    addTask('Do the dishes');
    assert.throws(() => deleteTask(67), "Error: Invalid number");
})

test('getTasksAsJson returns the list as JSON, numbered from 1', () => {
    addTask('Wash clothes');
    assert.deepEqual(JSON.parse(getTasksAsJson()), [{number: 1, task: "Wash clothes"}]);
})

test("getTaskList gives an empty array for an empty list", () => {
    assert.deepEqual(getTaskList(), []);
});

test('getTaskList gives each task with its id', () => {
    addTask('Wash clothes');
    addTask('Buy milk');
    assert.deepEqual(getTaskList(), [
      { id: 1, task: 'Wash clothes' },
      { id: 2, task: 'Buy milk' },
    ]);
});

test('getTask gives the task with that id, or undefined', () => {
    addTask('Wash clothes');
    addTask('Buy milk');
    assert.deepEqual(getTask(2), { id: 2, task: 'Buy milk' });
    assert.equal(getTask(0), undefined);
    assert.equal(getTask(3), undefined);
});