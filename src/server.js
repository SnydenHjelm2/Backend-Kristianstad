import app from "./app.js";
import {addTask} from "./model/todo.js";

const port = process.env.PORT ?? 8000;

addTask("Go for a walk");
addTask("Buy groceries");
addTask("Write code");

app.listen(port, (error) => {
    if (error) throw error;

    console.log("Listening on http://localhost:" + port);
});

