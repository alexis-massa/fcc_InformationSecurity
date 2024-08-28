'use strict'
const Reply = require("../models/reply")
const Thread = require("../models/thread")
const Board = require("../models/board")
const { default: mongoose } = require("mongoose")

module.exports = function (app) {
  // #region threads
  app.route('/api/threads/:board')
    // GET 10 most recently bumed threads with 3 replies each
    .get(async (req, res) => {
      const { board } = req.params

      // query options : 10 recently updated threads, with 3 replies latest replies 
      const options = {
        // In the threads
        path: 'threads',
        // Remove fields
        select: '-reported -delete_password -__v',
        // Limit 10, most recent updates
        options: { limit: 10, sort: { bumped_on: 'desc' } },
        populate: {
          // Dans les replies
          path: 'replies',
          // Remove fields
          select: '-reported -delete_password -__v',
          // Limit 3, most recent created
          options: { limit: 3, sort: { created_on: 'desc' } }
        }
      }

      try {
        // Find the board
        const foundBoard = await Board.findOne({ name: board }).populate(options).lean()

        // Board not found
        if (!foundBoard) return res.status(404).json({ error: 'Board not found' })

        // return threads of the board
        return res.status(200).send(foundBoard.threads)
      } catch (e) {
        console.error(e)
        return res.status(500).json(e)
      }
    })
    // POST thread to existing board, or create board
    .post(async (req, res) => {
      const { board } = req.params
      const thread = new Thread(req.body)

      try {
        // Create thread with given body
        await thread.save()

        // find board and update with threads
        // Create board if not found
        await Board.findOneAndUpdate(
          { name: board },
          { $push: { threads: thread } },
          { upsert: true, useFindAndModify: true }
        )

        return res.status(201).json(thread)
      } catch (e) {
        console.error(e)
        return res.status(400).send(e)
      }
    })
    // PUT Report a thread (reported: true)
    .put(async (req, res) => {
      const { thread_id } = req.body

      try {
        // Find and update thread
        const thread = await Thread.findByIdAndUpdate(
          thread_id,
          { reported: true },
          // Don't update timestamps
          { timestamps: false }
        )

        // Thread not found
        if (!thread) return res.status(404).json({ error: 'Thread not found' })

        return res.status(200).send('reported')
      } catch (e) {
        console.error(e)
        return res.status(500).send(e)
      }

    })
    // DELETE a thread
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body

      try {
        // Find thread
        const thread = await Thread.findById(thread_id)

        // Thread not found
        if (!thread) return res.status(404).json({ error: 'Thread not found' })

        // Incorrect password
        if (thread.delete_password !== delete_password) return res.status(401).send('incorrect password')

        // Delete it
        await thread.deleteOne()
        return res.status(200).send('success')
      } catch (e) {
        console.error(e)
        return res.status(500).send(e)
      }
    })

  // #region replies
  app.route('/api/replies/:board')
    // GET thread with all replies
    .get(async (req, res) => {
      const { thread_id } = req.query

      // Selection options for replies : remove reported delete_password and version columns
      const options = { path: 'replies', select: '-reported -delete_password -__v' }

      try {
        // Threads with replies
        const thread = await Thread.findById(thread_id)
          .select('-reported -delete_password -__v')
          .populate(options)
          .lean()

        // Thread not found
        if (!thread) return res.status(404).json({ error: 'Thread not found' })

        return res.status(200).send(thread)
      } catch (e) {
        console.error(e)
        return res.status(500).send(e)
      }
    })
    // POST a reply
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body
      const reply = new Reply({ text, delete_password })

      try {
        // Find thread to add to
        const thread = await Thread.findById(thread_id)

        // Thread not found
        if (!thread) return res.status(404).json({ error: 'Thread not found' })

        // Save reply
        await reply.save()

        // Push it to the thread, update bumped_on manually (timestamps: false or mongoose updates them anyways)
        await thread.updateOne(
          { $push: { replies: reply }, bumped_on: reply.created_on },
          { useFindAndModify: false, timestamps: false }
        )

        return res.status(201).json(reply)
      } catch (e) {
        console.error(e)
        return res.status(500).send(e)
      }
    })
    // PUT Report reply
    .put(async (req, res) => {
      const { reply_id } = req.body

      try {
        const reply = await Reply.findByIdAndUpdate(reply_id,
          { reported: true },
          { useFindAndModify: false }
        )

        // Reply not found
        if (!reply) return res.status(404).json({ error: 'Reply not found' })

        return res.status(200).send('reported')
      } catch (e) {
        console.error(e)
        return res.status(500).send(e)
      }

    })
    // DELETE a reply
    .delete(async (req, res) => {
      const { reply_id, delete_password } = req.body

      try {
        const reply = await Reply.findById(reply_id)

        // Reply not found
        if (!reply) return res.status(404).json({ error: 'Reply not found' })

        if (reply.delete_password !== delete_password) return res.status(401).send('incorrect password')

        await reply.updateOne({ text: '[deleted]' }, { useFindAndModify: false })

        return res.status(200).send('success')
      } catch (e) {
        console.error(e)
        return res.status(500).send(e)
      }

    })

}
