const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const commentsByPostId = {};

// INDEX COMMENTS
app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || [] );
});

// CREATE COMMENTS
app.post('/posts/:id/comments', async (req, res) => {
    const commentId = randomBytes(4).toString('hex');

    const { content } = req.body;

    // check if there is a comment associated to a post if that results as undefinied then give an empty array
    const comments = commentsByPostId[req.params.id] || [];

    comments.push({ id: commentId, content });

    commentsByPostId[req.params.id] = comments;

    // Listen to the broker
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id
        }
    });

    // send the response to the user
    res.status(201).send(comments);
});

// listen to the event
app.post('/events', (req, res) => {
    console.log('Event Received', req.body.type);

    res.send({});
});

app.listen(4001, () => {
    console.log('Listening on 4001');
});