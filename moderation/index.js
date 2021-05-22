const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json);

app.post('/events', async (req, res) => {
    console.log('Event Received', req.body.type);

    // listen to 
    const { type, data } = req.body;

    if (type === 'CommentCreated') {
        console.log('CommentCreated is checking if orange is present');
        const status = data.content.includes('orange') ? 'rejected' : 'approved';
    
        // emmit events on query
        await axios.post('http://localhost:4005/events', {
            type: 'CommentModerated',
            data: {
                id: data.id,
                postId: data.postId,
                status,
                content: data.content
            }
        });
    };

    res.send({});
});

app.listen(4003, () => {
    console.log('Listening on 4003');
});