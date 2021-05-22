const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Where we will store posts as an object
const posts = {};

// Display all posts
app.get('/posts', (req, res) => {
    res.send(posts);
});

// Create a post
app.post('/posts', async (req, res) => {
    // generate random ids as hexdecimals, as we don't use a DB right now.
    const id = randomBytes(4).toString('hex');
    const { title } = req.body;

    // Add a new post to our post collection
    posts[id] = {
        id, title
    }

    // listen to the broker. cqn be any structure qnd type (object, string, etc)
    await axios.post('http://localhost:4005/events', {
        type: 'PostCreated',
        data: {
            id, title
        }
    });

    // send a response to the user
    res.status(201).send(posts[id]);
});

// listen to the event
app.post('/events', (req, res) => {
    console.log('Event Received', req.body.type);

    res.send({});
});

// Configure the port
app.listen(4000, () => {
    console.log('Listening on 4000');
});