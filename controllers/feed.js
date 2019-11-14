const fs = require('fs');
const path = require('path');
const os = require('os');
const escapeRegex = require('../helper/regex-escape');

const multer = require('multer');

const {
  validateFeedPost
} = require('../validation/feed-validation');
const {
  fileFilterOptions,
  fileStorageOptions,
  limits
} = require('../config/multer');

exports.uploadFile = multer({
  storage: fileStorageOptions,
  fileFilter: fileFilterOptions,
  limits: limits
}).single('image');

const event = require('../subscribers/events');
const listener = require('../subscribers/feed')
const Post = require('../model/post');
const User = require('../model/user');

exports.getPosts = async (req, res, next) => {
  //search query
  const searchQuery = req.query.search;
  // page
  const currentPage = req.query.page || 1;
  // resource per page
  const perPage = 10;
  let posts, totalItems;
    try {
        if (searchQuery){
          regex = new RegExp(escapeRegex(req.query.search), 'gi');
          posts = await Post.find({title : regex}).skip((currentPage - 1) * perPage).limit(perPage);
          totalItems = await Post.estimatedDocumentCount({title : regex});
        } else {
          posts = await Post.find().skip((currentPage - 1) * perPage).limit(perPage);
          totalItems = await Post.find().estimatedDocumentCount();
        }
        res.status(200).json({
          message: 'Fetched posts successfully.',
          totalItems: totalItems,
          posts: posts,
        });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
   
};

exports.createPost = (req, res, next) => {
  const {
    error
  } = validateFeedPost(req.body);
  if (error) {
    const message = error.details.map(i => {
      return i.message;
    });
    const errors = new Error('Validation failed');
    errors.statusCode = 422;
    errors.data = message
    throw errors;
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }

  const imageUrl = `http://${req.headers.host}/feed/image/${req.file.filename}`;
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });
  post
    .save()
    .then(result => {
      listener.emit(event.feed.postImage, req.file);
      return User.findById(req.userId);
    })
    .then(user => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then(result => {
      res.status(201).json({
        message: 'Post created successfully!',
        post: post,
        creator: { _id: creator._id, name: creator.name }
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });

};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post
    .findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: 'Post fetched.',
        post: post
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })
}

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const {
    error
  } = validateFeedPost(req.body);
  if (error) {
    const message = error.details.map(i => {
      return i.message;
    });
    const errors = new Error(message);
    errors.statusCode = 422;
    throw errors;
  }

  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = `http://${req.headers.host}/feed/image/${req.file.filename}`;
  }
  if (!imageUrl) {
    const error = new Error('No file picked');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }

      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized');
        error.statusCode = 403;
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        let filename = post.imageUrl.split(/(\/feed\/image\/)/g);
        filename = filename[filename.length - 1];
        listener.emit(event.feed.postImage, req.file);
        clearImage(filename);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Post updated!', post: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

exports.getImage = (req, res, next) => {
  const imageId = req.params.imageId;
  const filePath = path.join(__dirname, `../storage/images/build/${imageId}`);
  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    'Content-Type': `image/${path.extname(filePath)}`,
    'Content-Length': stat.size
  });
  var readStream = fs.createReadStream(filePath);
  readStream.on('data', function (data) {
    res.write(data);
  });

  readStream.on('end', function () {
    res.end();
  });
}

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {

      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }

      if (post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized');
        error.statusCode = 403;
        throw error;
      }

      let filename = post.imageUrl.split(/(\/feed\/image\/)/g);
      filename = filename[filename.length - 1];
      clearImage(filename);
      return Post.findByIdAndRemove(postId);
    })
    .then(result => {
      return User.findById(req.userId);
    })
    .then(user => {
      user.posts.pull(postId);
      return user.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Post Deleted' });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}

const clearImage = imageName => {
  filePath = path.join(__dirname, `../storage/images/build/${imageName}`);
  fs.unlink(filePath, err => console.log(err));
}