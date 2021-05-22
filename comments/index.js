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

    // create the comment itself
    comments.push({ id: commentId, content, status: 'pending' });

    commentsByPostId[req.params.id] = comments;

    // Listen to the broker. Create the CommentCreated Event
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    }).catch((err) => {
        console.log(err.message);
      });

    // send the response to the user
    res.status(201).send(comments);

});

// listen to the event
app.post('/events', async (req, res) => {
    console.log('Event Received', req.body.type);

    const { type, data } = req.body;

    if (type === 'CommentCreated') {
        const { postId, id, status, content } = data;

        const comments = commentsByPostId[postId];

        const comment = comments.find(comment => {
            return comment.id === id;
        });

        comment.status = status;

        // tell every services there is an update: emit CommentUpdated
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                status,
                postId,
                content
            }
        });
    };


    res.send({});
});

app.listen(4001, () => {
    console.log('Listening on 4001');
});