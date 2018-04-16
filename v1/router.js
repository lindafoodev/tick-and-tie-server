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

router.post('/', jsonParser, (req, res) => {
	const requiredFields = ['sideA', 'sideB', 'nValue'];
	
	for(let i = 0; i < requiredFields.length; i++){
		const missingField = requiredFields.find(field => !(field in req.body));

		if (missingField) {
			console.log('missing field = ', missingField);
			return res.status(400).json({
				code: 400,
				reason: 'ValidationError',
				message: 'Missing field',
				location: missingField
			});
		}
	}

	Deck.create({
		sideA: req.body.sideA,
		sideB: req.body.sideB,
		nValue: req.body.nValue
	})
	.then(card => res.status(201).json(card.serialize()))
	.catch(err => {
		console.error(error);
	});
})

module.exports = { router };
