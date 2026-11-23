import app from "./app.js";

const port = process.env.PORT ?? 8000;

app.listen(port, (error) => {
    if (error) throw error;

    console.log("Listening on http://localhost:" + port);
});

