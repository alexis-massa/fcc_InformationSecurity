const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/thread');
const { default: mongoose } = require('mongoose');
const reply = require('../models/reply');

chai.use(chaiHttp);

const mockThread = {
  text: 'Test thread text',
  delete_password: 'good_password',
  reported: false,
  replies: [],
}

const mockReply = {
  text: 'Test reply text',
  delete_password: 'good_password',
  reported: false,
}

suite('Functional Tests', function () {
  // #region /api/threads/{board}
  suite('/api/threads/{board}', () => {
    // Creating a new thread: POST request to /api/threads/{board}
    test('Creating a new thread: POST request to /api/threads/{board}', async () => {
      const res = await chai.request(server).keepOpen()
        .post('/api/threads/general')
        .send({ text: mockThread.text, delete_password: mockThread.delete_password })

      assert.equal(res.status, 201)
      assert.property(res.body, '_id')
      assert.property(res.body, 'text')
      assert.equal(res.body.text, mockThread.text)
      assert.property(res.body, 'delete_password')
      assert.equal(res.body.delete_password, mockThread.delete_password)
      assert.property(res.body, 'reported')
      assert.equal(res.body.reported, mockThread.reported)
      assert.property(res.body, 'replies')
      assert.deepEqual(res.body.replies, mockThread.replies)
      assert.property(res.body, 'created_on')
      assert.property(res.body, 'bumped_on')

      // Save id for later
      mockThread._id = res.body._id

    })
    // Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', async () => {
      const res = await chai.request(server).keepOpen()
        .get('/api/threads/general')

      assert.equal(res.status, 200)
      assert.equal(res.body.length, 10)

      res.body.forEach(thread => {
        assert.property(thread, 'text')
        assert.notProperty(thread, 'reported')
        assert.notProperty(thread, 'delete_password')
        assert.isBelow(thread.replies.length, 4)
      })
    })
    // Reporting a thread: PUT request to /api/threads/{board}
    test('Reporting a thread: PUT request to /api/threads/{board}', async () => {
      const res = await chai.request(server).keepOpen()
        .put('/api/threads/general')
        .send({ thread_id: mockThread._id })

      assert.equal(res.status, 200)
      assert.equal(res.text, 'reported')
    })
    // Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password
    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', async () => {
      const res = await chai.request(server).keepOpen()
        .delete('/api/threads/general')
        .send({ thread_id: mockThread._id, delete_password: 'wrong_password' })

      assert.equal(res.status, 401)
      assert.equal(res.text, 'incorrect password')
    })
    // Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', async () => {
      const res = await chai.request(server).keepOpen()
        .delete('/api/threads/general')
        .send({ thread_id: mockThread._id, delete_password: mockThread.delete_password })

      assert.equal(res.status, 200)
      assert.equal(res.text, 'success')
    })
  })

  // #region /api/replies/{board}
  suite('/api/replies/{board}', () => {
    // Creating a new reply: POST request to /api/replies/{board}
    test('Creating a new reply: POST request to /api/replies/{board}', async () => {
      // Get a thread_id
      let thread = await Thread.find({}).exec()
      mockThread._id = thread[0]._id

      const res = await chai.request(server).keepOpen()
        .post('/api/replies/general')
        .send({
          text: mockReply.text,
          delete_password: mockReply.delete_password,
          thread_id: mockThread._id
        })

      assert.equal(res.status, 201)
      assert.containsAllKeys(res.body, mockReply)
      assert.property(res.body, '_id')
      assert.property(res.body, 'created_on')

      // Save reply_id
      mockReply._id = res.body._id
    })
    // Viewing a single thread with all replies: GET request to /api/replies/{board}
    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', async () => {
      const res = await chai.request(server).keepOpen()
        .get(`/api/replies/general?thread_id=${mockThread._id}`)

      assert.equal(res.status, 200)
      assert.property(res.body, '_id')
      assert.property(res.body, 'text')
      assert.property(res.body, 'created_on')
      assert.property(res.body, 'bumped_on')
      assert.property(res.body, 'replies')
      assert.notProperty(res.body, 'reported')
      assert.notProperty(res.body, 'delete_password')
    })
    // Reporting a reply: PUT request to /api/replies/{board}
    test('Reporting a reply: PUT request to /api/replies/{board}', async () => {
      const res = await chai.request(server).keepOpen()
        .put('/api/replies/general')
        .send({ thread_id: mockThread._id, reply_id: mockReply._id })

      assert.equal(res.status, 200)
      assert.equal(res.text, 'reported')
    })
    // Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
    test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', async () => {
      const res = await chai.request(server).keepOpen()
        .delete('/api/replies/general')
        .send({ thread_id: mockThread._id, reply_id: mockReply._id, delete_password: 'wrong_password' })

      assert.equal(res.status, 401)
      assert.equal(res.text, 'incorrect password')
    })
    // Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
    test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', async () => {
      const res = await chai.request(server).keepOpen()
        .delete('/api/replies/general')
        .send({ thread_id: mockThread._id, reply_id: mockReply._id, delete_password: mockReply.delete_password })

      assert.equal(res.status, 200)
      assert.equal(res.text, 'success')
    })
  })
})