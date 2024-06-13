const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const unleash = require('unleash-client');

unleash.initialize({
  url: 'https://localhost:4002',
  appName: 'posts',
  environment: 'development',
  customHeaders: { Authorization: '*: development.cfa99f3c7a64985a5e8477c6af1352df7db1f8073903b74176fa4c18' },
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

setInterval(() => {
  if (unleash.isEnabled('DemoToggle')) {
    console.log('Toggle enabled');
  } else {
    console.log('Toggle disabled');
  }
}, 1000);

const context = {
  userId: '123',
  sessionId: '123123-123-123',
  remoteAddress: '127.0.0.1',
};

const enabled = isEnabled('app.demo', context);

const posts = {};

const handleEvent = (type, data) => {
    if (type === 'PostCreated') {
        const { id, title } = data;

        posts[id] = { id, title, comments: [] };
    }

    if (type === 'CommentCreated') {
        const { id, content, postId, status } = data;

        const post = posts[postId];
        post.comments.push({ id, content, status });
    }

    if (type === 'CommentUpdated') {
        const { id, content, postId, status } = data;

        const post = posts[postId];
        const comment = post.comments.find(comment => {
            return comment.id === id;
        });

        comment.status = status;
        comment.content = content;
    }
};

app.get('/posts', (req, res) => {
    res.send(posts);
});

app.post('/events', (req, res) => {
    const { type, data } = req.body;

    handleEvent(type, data);

    res.send({});
});

app.listen(4002, async () => {
    console.log('Listening on 4002');

    try {
        const res = await axios.get("http://localhost:4005/events");
        // whenever we use qxios, the data are available in the data element of this event
        for (let event of res.data) {
          console.log("Processing event:", event.type);

          handleEvent(event.type, event.data);
        }
      } catch (error) {
        console.log(error.message);
      }
});
