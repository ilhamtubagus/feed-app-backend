const express = require('express');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// GET /feed/post/:postId
router.get('/post/:postId', isAuth, feedController.getPost);

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post('/post', isAuth, feedController.uploadFile, feedController.createPost);

// PUT /feed/post
router.put('/post/:postId', isAuth, feedController.uploadFile, feedController.updatePost);

// GET /feed/image
router.get('/image/:imageId', feedController.getImage);

// DELETE /feed/post
router.delete('/post/:postId', isAuth, feedController.deletePost);




module.exports = router;