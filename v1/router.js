'use strict';
const express = require('express');
const bodyParser = require('body-parser');

const { Deck } = require('./models');

const router = express.Router();
const jsonParser = bodyParser.json();


router.get('/all',  (req, res) => {
	return Deck.find({})
		.then(cards => res.json(cards.map(card => card.serialize())))
		.catch(err => res.status(500).json({ message: 'Internal server error' }));
});

router.get('/:id', (req, res) => {
	Deck.findById(req.params.id)
		.then(card => {
			res.json(card.serialize());
		})
		.catch(err => {
			console.error(error);
		});
});

module.exports = { router };
