const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

let a;
app.get('/', (req, res) => {
    res.send(a);
});

app.get('/print-message', (req, res) => {
    // Get the message you want to print from a database, file, or any other source
    const message = a;
    res.send(message);
});

app.post('/submit-form', (req, res) => {
    const { age, gender, bmi, children, smoker, region } = req.body;
    a=age;
    res.json({
        age,
        gender,
        bmi,
        children,
        smoker,
        region
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
